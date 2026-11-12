/* ==========================================================================
 * lsfp-adapter.js — LSFP 图片集中适配层
 *
 * 站点里的 .lsfp 不是浏览器原生图片格式，不能写进 <img src> 或 CSS 背景。
 * 这里把「取字节 → LSFP.decode → 离屏画布转 Blob URL → 失败回退旧图」
 * 收敛成唯一入口，渲染点只需输出 data-lsfp-src 并调用一次 hydrate()。
 *
 * 命名约定（由 lsfp 仓库的编码产物决定）：
 *   推荐复合后缀  war1.png.lsfp → 回退 war1.png（原后缀/大小写精确保留）
 *   兼容纯后缀    war1.lsfp     → 依次探测 .png/.PNG/.jpg/.jpeg
 * 用户若按纯后缀命名，resolve() 会在复合候选失败后自动再试一次纯后缀。
 *
 * 依赖 boot.js 的 window.loadScript / window.leleleFetch（缺失时自带降级）。
 * 能力缺失、脚本 404、CORS 阻断、资源 404、解码抛错、画布失败 —— 全部
 * 收敛到同一个回退出口，resolve() 从不向调用方抛异常。
 * ========================================================================== */
(function () {
    'use strict';

    var DECODER_URL = '/lsfp.js';
    var TIMEOUT_MS = 8000;
    var MAX_CONCURRENCY = 2;
    var LSFP_RE = /\.lsfp(?=[?#]|$)/i;
    var IMG_EXT_RE = /\.(png|jpe?g|webp|gif|bmp|avif)$/i;
    var FALLBACK_EXTS = ['.png', '.PNG', '.jpg', '.jpeg'];
    // 1x1 透明 GIF：解码期间占位，避免破图、alt 文字与布局跳动
    var TRANSPARENT = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    var SEL = '[data-lsfp-src]';

    var resultCache = Object.create(null);   // url -> Promise<string>
    var blobUrls = [];
    var warned = Object.create(null);
    var decoderPromise = null;
    var queue = [];
    var active = 0;
    var io = null;

    /* ---------------------------------------------------------------- 工具 */

    function stripLsfp(url) {
        var m = LSFP_RE.exec(url);
        return m ? url.slice(0, m.index) + url.slice(m.index + 5) : url;
    }

    function splitQuery(url) {
        var i = url.search(/[?#]/);
        return i < 0 ? { path: url, query: '' } : { path: url.slice(0, i), query: url.slice(i) };
    }

    // 复合后缀同时兼容「用户按纯 .lsfp 命名」：先试数据里的 URL，再试纯后缀
    function lsfpCandidates(url) {
        var list = [url];
        var parts = splitQuery(url);
        var m = /^(.*)\.(png|jpe?g|webp|gif|bmp|avif)\.lsfp$/i.exec(parts.path);
        if (m) list.push(m[1] + '.lsfp' + parts.query);
        return list;
    }

    function fallbackCandidates(url) {
        var base = stripLsfp(url);
        var parts = splitQuery(base);
        if (IMG_EXT_RE.test(parts.path)) return [base];
        return FALLBACK_EXTS.map(function (ext) { return parts.path + ext + parts.query; });
    }

    // 同步推导旧图 URL；null 表示「不是 LSFP 图片」
    function fallbackOf(url) {
        if (!url || !LSFP_RE.test(url)) return null;
        return fallbackCandidates(url)[0];
    }

    function warnOnce(url, reason) {
        if (warned[url]) return;
        warned[url] = 1;
        // 只输出简短原因，不打印响应体、字节内容或任何用户信息
        if (typeof console !== 'undefined' && console.warn) {
            console.warn('[LSFP] fallback:', reason, url);
        }
    }

    function capable() {
        return typeof DecompressionStream === 'function' &&
            typeof ImageData === 'function' &&
            typeof document !== 'undefined' &&
            typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
    }

    function doFetch(url, opts, ms) {
        if (typeof window.leleleFetch === 'function') return window.leleleFetch(url, opts, ms);
        opts = opts || {};
        if (opts.signal || typeof AbortController !== 'function') return fetch(url, opts);
        var ctrl = new AbortController();
        var timer = setTimeout(function () { ctrl.abort(); }, ms || TIMEOUT_MS);
        var merged = {};
        Object.keys(opts).forEach(function (k) { merged[k] = opts[k]; });
        merged.signal = ctrl.signal;
        return fetch(url, merged).finally(function () { clearTimeout(timer); });
    }

    /* ---------------------------------------------------------- 解码器懒加载 */

    function loadDecoder() {
        if (decoderPromise) return decoderPromise;
        var api = (typeof LSFP !== 'undefined') ? LSFP : window.LSFP;
        if (api && typeof api.decode === 'function') {
            decoderPromise = Promise.resolve(api);
            return decoderPromise;
        }
        var loader;
        if (typeof window.loadScript === 'function') {
            loader = window.loadScript(DECODER_URL);
        } else {
            loader = new Promise(function (res, rej) {
                var s = document.createElement('script');
                s.src = DECODER_URL; s.async = true;
                s.onload = res;
                s.onerror = function () { rej(new Error('decoder script error')); };
                document.head.appendChild(s);
            });
        }
        decoderPromise = loader.then(function () {
            var lib = (typeof LSFP !== 'undefined') ? LSFP : window.LSFP;
            if (!lib || typeof lib.decode !== 'function') throw new Error('decoder unavailable');
            return lib;
        });
        return decoderPromise;
    }

    /* ---------------------------------------------------------------- 队列 */

    function enqueue(task) {
        return new Promise(function (resolve, reject) {
            queue.push({ task: task, resolve: resolve, reject: reject });
            pump();
        });
    }

    function pump() {
        while (active < MAX_CONCURRENCY && queue.length) {
            var job = queue.shift();
            active++;
            Promise.resolve().then(job.task).then(job.resolve, job.reject).then(function () {
                active--;
                pump();
            });
        }
    }

    /* ------------------------------------------------------- 解码与画布转址 */

    function toBlobUrl(imgData) {
        return new Promise(function (resolve, reject) {
            if (!imgData || !imgData.width || !imgData.height) {
                reject(new Error('empty ImageData')); return;
            }
            var canvas = document.createElement('canvas');
            canvas.width = imgData.width;
            canvas.height = imgData.height;
            var ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('no 2d context')); return; }
            ctx.putImageData(imgData, 0, 0);
            if (typeof canvas.toBlob !== 'function') {
                // 老浏览器退化为 dataURL（同样是浏览器可直接使用的地址）
                try { resolve(canvas.toDataURL('image/png')); }
                catch (e) { reject(e); }
                return;
            }
            canvas.toBlob(function (blob) {
                if (!blob) { reject(new Error('toBlob failed')); return; }
                var u = URL.createObjectURL(blob);
                blobUrls.push(u);
                resolve(u);
            }, 'image/png');
        });
    }

    function decodeOne(api, url) {
        return doFetch(url, { cache: 'force-cache', mode: 'cors', credentials: 'omit' }, TIMEOUT_MS)
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.arrayBuffer();
            })
            .then(function (buf) { return api.decode(buf); })
            .then(toBlobUrl);
    }

    function tryCandidates(api, list) {
        var i = 0;
        function next() {
            if (i >= list.length) return Promise.reject(new Error('all LSFP candidates failed'));
            return decodeOne(api, list[i++]).catch(next);
        }
        return next();
    }

    // 纯 .lsfp 的失败路径：有界探测真实存在的旧图后缀
    function pickFallback(url, hint) {
        if (hint) return Promise.resolve(hint);
        var candidates = fallbackCandidates(url);
        if (candidates.length === 1) return Promise.resolve(candidates[0]);
        var i = 0;
        function probe() {
            if (i >= candidates.length) return Promise.resolve(candidates[0]);
            var cur = candidates[i++];
            return new Promise(function (res) {
                var img = new Image();
                img.onload = function () { res(cur); };
                img.onerror = function () { res(null); };
                img.src = cur;
            }).then(function (hit) { return hit || probe(); });
        }
        return probe();
    }

    /* ------------------------------------------------------------- 对外接口 */

    function resolve(url, fallbackHint) {
        if (!url || !LSFP_RE.test(url)) return Promise.resolve(url);
        if (resultCache[url]) return resultCache[url];

        // 整个任务进队列后才启动，真正做到并发上限控制
        resultCache[url] = enqueue(function () {
            if (!capable()) return Promise.reject(new Error('capability'));
            return loadDecoder().then(function (api) {
                return tryCandidates(api, lsfpCandidates(url));
            });
        }).catch(function (err) {
            var reason = err && err.message ? String(err.message).slice(0, 48) : 'decode failed';
            warnOnce(url, reason);
            return pickFallback(url, fallbackHint);
        });
        return resultCache[url];
    }

    function apply(el, finalUrl) {
        if (!el || !el.setAttribute) return;
        el.setAttribute('data-lsfp-resolved', finalUrl);
        if (el.hasAttribute('data-lsfp-loading')) {
            el.removeAttribute('data-lsfp-loading');
            el.style.removeProperty('background');
        }
        if (el.tagName === 'IMG' && !el.hasAttribute('data-lsfp-bg')) {
            el.src = finalUrl;
        } else {
            el.style.backgroundImage = 'url(' + JSON.stringify(finalUrl) + ')';
        }
        try {
            el.dispatchEvent(new CustomEvent('lsfp-resolved', { bubbles: true, detail: { url: finalUrl } }));
        } catch (e) { /* 老浏览器无 CustomEvent，忽略 */ }
    }

    function start(el) {
        var url = el.getAttribute('data-lsfp-src');
        if (!url) return;
        var hint = el.getAttribute('data-lsfp-fallback');
        resolve(url, hint).then(function (finalUrl) { apply(el, finalUrl); });
    }

    function ensureObserver() {
        if (io || typeof IntersectionObserver !== 'function') return;
        io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                io.unobserve(e.target);
                start(e.target);
            });
        }, { rootMargin: '200px 0px' });
    }

    function hydrate(root) {
        var scope = root || document;
        if (!scope || !scope.querySelectorAll) return;
        var list = [];
        if (scope.nodeType === 1 && scope.matches && scope.matches(SEL)) list.push(scope);
        Array.prototype.push.apply(list, scope.querySelectorAll(SEL));
        ensureObserver();
        list.forEach(function (el) {
            if (el.getAttribute('data-lsfp-hydrated')) return;
            el.setAttribute('data-lsfp-hydrated', '1');
            // 解码前用透明占位，避免浏览器直接请求 .lsfp 产生破图
            if (el.tagName === 'IMG') {
                var cur = el.getAttribute('src') || '';
                if (!cur || LSFP_RE.test(cur)) {
                    el.src = TRANSPARENT;
                    el.setAttribute('data-lsfp-loading', '1');
                    el.style.background = 'linear-gradient(135deg,#e2e8f0,#cbd5e1)';
                }
            }
            // 只有显式标记 data-lsfp-lazy 的详情页截图走视口懒解码。
            // 模态框内的图片不会触发 IntersectionObserver（弹窗插入时未完成布局），
            // 若也懒加载会永远停在透明占位；横幅/告示/公告详情一律立即解析。
            if (io && el.tagName === 'IMG' && el.hasAttribute('data-lsfp-lazy')) io.observe(el);
            else start(el);
        });
    }

    function dispose() {
        blobUrls.forEach(function (u) {
            try { URL.revokeObjectURL(u); } catch (e) { /* noop */ }
        });
        blobUrls = [];
        resultCache = Object.create(null);
        if (io) { io.disconnect(); io = null; }
    }

    window.LeleleLsfp = {
        resolve: resolve,
        hydrate: hydrate,
        fallbackOf: fallbackOf,
        dispose: dispose
    };

    // 空闲预取解码器（仅取脚本、不解码）。弹窗里的图片是动态插入的，
    // 若等 hydrate 才去下载 /lsfp.js，用户会看到 1~3 秒空白；
    // 预取后解码器随页面就绪，仍保持「有 LSFP 图片才真正解码」的按需语义。
    function prefetchDecoder() {
        loadDecoder().catch(function () { /* 失败留给 resolve 统一回退 */ });
    }
    if (typeof window.onReady === 'function') {
        window.onReady(function () {
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(prefetchDecoder, { timeout: 1200 });
            } else {
                setTimeout(prefetchDecoder, 200);
            }
        });
    } else {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(prefetchDecoder, 200); });
    }

    // 非 bfcache 卸载时回收 Blob URL；进入 bfcache 时保留，避免返回后破图
    window.addEventListener('pagehide', function (e) { if (!e.persisted) dispose(); });
}());
