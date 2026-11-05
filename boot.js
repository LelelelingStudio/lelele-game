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

    // 第三方统计：首屏之后异步注入，失败完全无感（统计不属于功能）
    window.onReady(function () {
        setTimeout(function () {
            window.loadScript('https://analytics.leleleling.site/em.js', {
                'data-domain': 'game.leleleling.site'
            }).catch(function () {});
        }, 0);
    });
})();
