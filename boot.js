/* ==========================================================================
 * boot.js — 首屏加速引导（同域、defer，绝不阻塞 DOMContentLoaded）
 *
 * 4.0.12 背景：以前各页在 <head> 里写了外部域名的 <script defer>
 * （cdn.jsdelivr.net 的 supabase-js / pinyin-pro、analytics.leleleling.site 的 em.js）。
 * defer 脚本必须在 DOMContentLoaded 之前全部下载并执行完；外网一挂起（国内常见，
 * 且浏览器对 script 请求没有默认超时），DOMContentLoaded / load 就永不触发，
 * 而全站初始化与首页游戏列表都挂在这两个事件上 —— 表现为一直加载、白屏、
 * 刷新无响应、内容与头像全出不来。
 *
 * 现在：外部统计脚本改为 DOM 就绪后动态注入（async），失败静默；
 * 其余第三方库已自托管到同域 /vendor/ 并由 Service Worker 缓存。
 * ========================================================================== */
(function () {
    'use strict';

    // 动态注入脚本：async，不阻塞 HTML 解析 / DOMContentLoaded / load；带超时，失败静默
    window.loadScript = function (src, attrs) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = src;
            s.async = true;
            if (attrs) {
                Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
            }
            var settled = false;
            var timer = setTimeout(function () {
                if (settled) return;
                settled = true;
                reject(new Error('script timeout: ' + src));
            }, 8000);
            s.onload = function () {
                if (settled) return;
                settled = true; clearTimeout(timer); resolve();
            };
            s.onerror = function () {
                if (settled) return;
                settled = true; clearTimeout(timer); reject(new Error('script error: ' + src));
            };
            document.head.appendChild(s);
        });
    };

    // 初始化兜底：即使 DOMContentLoaded 被别处拦截/已错过，也能立即执行
    window.onReady = function (fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
            fn();
        }
    };

    // ----------------------------------------------------------------------
    // 作者清单：唯一的 window.fetchAuthors 定义处（4.0.13）
    //
    // 之前只定义在 common.js，而 dashboard.html 从未引入 common.js，导致后台
    // 「暂无绑定您的游戏 / 未认证」。boot.js 在 14 个页面的 <head> 同步加载、
    // 无 UI 副作用，是最合适的共享引导层。
    //
    // 契约：fetchAuthors() 返回含 uuid 的作者数组或 null。
    //   - surge 为权威主源（用户要求恢复，已核实 CORS *），5s 超时；
    //   - 失败回退同域 authors/index.json（工作流同步生成，SW 缓存）。
    // 另暴露 fetchAuthorsLocal / fetchAuthorsFresh 供首屏 stale-while-revalidate：
    // 先用本地清单即时渲染，再由 surge 异步校正，跨域变慢也不拖首屏。
    // ----------------------------------------------------------------------
    var AUTHORS_PRIMARY = 'https://authors.surge.sh/authors.json';
    var AUTHORS_FALLBACK = 'authors/index.json';

    function readAuthorsJson(url, timeoutMs) {
        return new Promise(function (resolve) {
            var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
            var settled = false;
            var timer = setTimeout(function () {
                if (settled) return;
                settled = true;
                if (ctrl) ctrl.abort();
                resolve(null);
            }, timeoutMs);
            fetch(url, ctrl ? { signal: ctrl.signal } : {})
                .then(function (r) { return r.ok ? r.json() : null; })
                .then(function (data) {
                    if (settled) return;
                    settled = true; clearTimeout(timer);
                    resolve(Array.isArray(data) && data.length ? data : null);
                })
                .catch(function () {
                    if (settled) return;
                    settled = true; clearTimeout(timer);
                    resolve(null);
                });
        });
    }

    // 同域轻量清单：命中 SW 缓存即 0 网络往返，用于首屏即时渲染
    window.fetchAuthorsLocal = function () {
        return readAuthorsJson(AUTHORS_FALLBACK, 8000);
    };

    // 权威主源：仅 surge，失败返回 null（用于无感校正，不阻塞）
    window.fetchAuthorsFresh = function () {
        return readAuthorsJson(AUTHORS_PRIMARY, 5000);
    };

    window.fetchAuthors = async function () {
        var fresh = await window.fetchAuthorsFresh();
        if (fresh) return fresh;
        return await window.fetchAuthorsLocal();
    };

    // 第三方统计：首屏之后异步注入，失败完全无感（统计不属于功能）
    window.onReady(function () {
        setTimeout(function () {
            window.loadScript('https://analytics.leleleling.site/em.js', {
                'data-domain': 'game.leleleling.site'
            }).catch(function () {});
        }, 0);
    });
})();
