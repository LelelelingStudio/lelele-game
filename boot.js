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

    // ----------------------------------------------------------------------
    // Tally 表单挂载（4.0.14）
    //
    // 根因：以前 iframe 只写 data-tally-src，把「有没有内容」押在境外的
    // tally.so/widgets/embed.js 能否执行 Tally.loadEmbeds() 上。该脚本在国内
    // 常静默挂起（既不 onload 也不 onerror），回调永不触发 → 弹窗纯白。
    //
    // 现在：https://tally.so/embed/<id> 本身就是完整可嵌入页面，直接赋给
    // iframe.src 即可渲染；embed.js 只是可选增强，不再是渲染前置条件。
    // 打开弹窗才挂载，带可见加载态、8s 超时与失败降级（重试 + 新窗口直链），
    // 任何网络条件下用户都有明确反馈和可完成的提交路径。
    // ----------------------------------------------------------------------
    var tallyMountSeq = 0;

    window.mountTallyIframe = function (container, url, opts) {
        if (!container || !url) return null;
        opts = opts || {};

        // 每次挂载发一个 token：语言切换/重复打开时，迟到的 onload/超时回调
        // 不能覆盖新一次挂载（这正是「刷新后时好时坏」的竞态来源）
        var token = 'tally-' + (++tallyMountSeq);
        container.setAttribute('data-tally-token', token);
        function isCurrent() {
            return container.getAttribute('data-tally-token') === token && container.isConnected;
        }

        container.innerHTML = '';

        var loading = document.createElement('div');
        loading.className = 'tally-state';
        loading.setAttribute('style', 'padding:32px 16px;text-align:center;color:var(--text-muted,#64748b);font-size:0.9rem;line-height:1.7;');
        loading.innerHTML = '<span class="zh-inline">表单加载中，请稍候…</span><span class="en-inline">Loading form, please wait…</span>';

        var iframe = document.createElement('iframe');
        iframe.title = opts.title || 'Form';
        iframe.loading = 'eager';
        iframe.width = '100%';
        iframe.height = String(opts.height || 800);
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('marginheight', '0');
        iframe.setAttribute('marginwidth', '0');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        iframe.setAttribute('style', 'display:block;width:100%;border:0;');

        var settled = false;
        var timer = null;

        function finish() {
            if (settled || !isCurrent()) return;
            settled = true;
            if (timer) clearTimeout(timer);
            if (loading.parentNode === container) container.removeChild(loading);

            // 跨域 iframe 加载失败（网络错误页）时浏览器同样会触发 onload，
            // 无法与真实加载区分。因此不销毁 iframe，而是把常驻备用条升级为
            // 醒目的重试提示，保证用户永远不会面对「纯白 + 无任何指引」。
            var bk = container.querySelector('.tally-backup');
            if (!bk) return;
            bk.setAttribute('style', 'margin:8px 12px 12px;padding:12px;border-radius:12px;background:rgba(127,127,127,0.08);text-align:center;font-size:0.85rem;color:var(--text-muted,#64748b);');
            bk.innerHTML = '<div><span class="zh-inline">表单已加载。若下方没有显示，可重试或在新窗口打开填写。</span>' +
                '<span class="en-inline">Form request finished. If nothing appears below, retry or open it in a new tab.</span></div>';
            var again = document.createElement('button');
            again.type = 'button';
            again.className = 'tally-retry';
            again.setAttribute('style', 'margin-top:8px;border:0;border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer;');
            again.innerHTML = '<span class="zh-inline">重新加载</span><span class="en-inline">Retry</span>';
            again.addEventListener('click', function () {
                window.mountTallyIframe(container, url, opts);
            });
            bk.appendChild(again);
        }

        function fail() {
            if (settled || !isCurrent()) return;
            settled = true;
            if (timer) clearTimeout(timer);
            container.innerHTML = '';

            var box = document.createElement('div');
            box.className = 'tally-state tally-fallback';
            box.setAttribute('style', 'padding:32px 18px;text-align:center;color:var(--text-muted,#64748b);font-size:0.9rem;line-height:1.8;');

            var desc = document.createElement('div');
            desc.innerHTML = '<span class="zh-inline">表单加载失败或网络较慢，可重试，或在新窗口直接打开填写（提交同样有效）。</span>' +
                '<span class="en-inline">The form could not load or is too slow. Retry, or open it in a new tab — submissions work the same way.</span>';
            box.appendChild(desc);

            var actions = document.createElement('div');
            actions.setAttribute('style', 'margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;');

            var retry = document.createElement('button');
            retry.type = 'button';
            retry.className = 'btn btn-primary';
            retry.setAttribute('style', 'border:0;border-radius:12px;padding:10px 16px;font-weight:700;cursor:pointer;');
            retry.innerHTML = '<span class="zh-inline">重新加载</span><span class="en-inline">Retry</span>';
            retry.addEventListener('click', function () {
                window.mountTallyIframe(container, url, opts);
            });
            actions.appendChild(retry);

            var link = document.createElement('a');
            link.href = url;                 // 用 DOM 属性赋值，避免拼接 URL 造成注入
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = 'btn';
            link.setAttribute('style', 'border-radius:12px;padding:10px 16px;font-weight:700;text-decoration:none;display:inline-block;');
            link.innerHTML = '<span class="zh-inline">在新窗口打开表单 ↗</span><span class="en-inline">Open form in new tab ↗</span>';
            actions.appendChild(link);

            box.appendChild(actions);
            container.appendChild(box);
        }

        // 跨域 iframe 加载失败时部分浏览器仍会触发 onload（渲染错误页），
        // 因此常驻一条不遮挡表单的备用入口：即使误判成功，用户也一定能提交。
        var backup = document.createElement('div');
        backup.className = 'tally-backup';
        backup.setAttribute('style', 'padding:10px 12px;text-align:center;font-size:0.8rem;color:var(--text-muted,#64748b);');
        backup.innerHTML = '<span class="zh-inline">表单显示不出来？</span><span class="en-inline">Form not showing? </span>';
        var backupLink = document.createElement('a');
        backupLink.href = url;
        backupLink.target = '_blank';
        backupLink.rel = 'noopener noreferrer';
        backupLink.innerHTML = '<span class="zh-inline">在新窗口打开填写 ↗</span><span class="en-inline">Open in a new tab ↗</span>';
        backup.appendChild(backupLink);

        container.appendChild(loading);
        container.appendChild(iframe);
        container.appendChild(backup);
        iframe.onload = finish;
        iframe.onerror = fail;
        iframe.src = url;                    // 关键：直接赋 src，不依赖 embed.js
        timer = setTimeout(fail, opts.timeout || 8000);
        return token;
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
