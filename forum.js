/* ==========================================================================
 * lelele-game · 社区讨论区
 *
 * 1) index.html  —— 全站论坛（cbox 聊天框），页面最底部一个公共讨论区。
 * 2) game.html   —— 每款游戏一个独立讨论区（Remarkbox），按游戏 id 划分话题：
 *                   thread_uri = https://game.leleleling.site/game.html?id=<id>
 *                   同一个游戏永远是同一个话题，换语言、带别的参数都不会串楼。
 *
 * 两个 iframe 都是「滚动到附近才开始加载」，不拖慢首屏；加载中/加载失败给的
 * 都是普通玩家看得懂的话，不出现任何配置、密钥、域名之类的技术提示。
 * ========================================================================== */
(function () {
    'use strict';

    var RB_OWNER_KEY = '293691f7-ea53-11f1-8000-040140774501';
    var SITE_FORUM_SRC = 'https://www3.cbox.ws/box/?boxid=3562489&boxtag=Lmijw3';
    var THREAD_ORIGIN = 'https://game.leleleling.site';
    var RESIZER_SRC = 'https://my.remarkbox.com/static/js/iframe-resizer/iframeResizer.min.js';
    var LOAD_TIMEOUT_MS = 20000;

    var resizerPromise = null;

    function isEn() {
        return document.documentElement.getAttribute('data-lang') === 'en';
    }

    function t(zh, en) {
        return isEn() ? en : zh;
    }

    /* ---------- 小工具 ---------- */

    function ready(fn) {
        if (typeof window.onReady === 'function') {
            window.onReady(fn);
        } else if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    function hideLoading(box) {
        var loading = box.querySelector('[data-forum-loading]');
        if (loading) loading.classList.add('forum-hidden');
    }

    function showLoading(box, html) {
        var loading = box.querySelector('[data-forum-loading]');
        if (!loading) return;
        loading.classList.remove('forum-hidden');
        loading.innerHTML = html;
    }

    // 只在容器接近视口时才真正挂 iframe
    function whenNearViewport(el, callback) {
        if (!('IntersectionObserver' in window)) {
            callback();
            return;
        }
        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    observer.disconnect();
                    callback();
                    return;
                }
            }
        }, { rootMargin: '600px 0px' });
        observer.observe(el);
    }

    function loadResizer() {
        if (typeof window.iFrameResize === 'function') return Promise.resolve();
        if (resizerPromise) return resizerPromise;
        resizerPromise = new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.src = RESIZER_SRC;
            script.async = true;
            script.onload = function () { resolve(); };
            script.onerror = function () {
                resizerPromise = null;
                reject(new Error('resizer-unavailable'));
            };
            document.head.appendChild(script);
        });
        return resizerPromise;
    }

    // 加载失败时给玩家的兜底：一句人话 + 一个重试按钮，不暴露任何技术细节
    function showRetry(box, retry) {
        showLoading(
            box,
            '<span style="font-size:1.6rem">💬</span>' +
            '<p style="margin:0">' +
            '<span class="zh-inline">讨论区暂时没能加载出来，检查一下网络再试试。</span>' +
            '<span class="en-inline">The discussion area did not load. Please check your connection and try again.</span>' +
            '</p>' +
            '<button type="button" class="forum-retry" style="margin-top:4px;padding:8px 18px;border-radius:999px;border:1px solid rgba(79,70,229,.35);background:#4f46e5;color:#fff;font-size:.85rem;font-weight:600;cursor:pointer;">' +
            '<span class="zh-inline">重新加载</span><span class="en-inline">Reload</span>' +
            '</button>'
        );
        var btn = box.querySelector('.forum-retry');
        if (btn) btn.addEventListener('click', function () { retry(); });
    }

    /* ---------- 通用挂载 ---------- */

    function attach(box, src, title, onReady) {
        var iframe = document.createElement('iframe');
        iframe.setAttribute('title', title);
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('scrolling', 'auto');
        iframe.setAttribute('allow', 'autoplay');
        iframe.src = src;

        var settled = false;
        var timer = setTimeout(function () {
            if (!settled) showRetry(box, function () { remount(); });
        }, LOAD_TIMEOUT_MS);

        iframe.addEventListener('load', function () {
            settled = true;
            clearTimeout(timer);
            hideLoading(box);
        });

        function remount() {
            clearTimeout(timer);
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
            attach(box, src, title, onReady);
        }

        box.appendChild(iframe);
        if (onReady) onReady(iframe, remount);
        return iframe;
    }

    /* ---------- 全站论坛（cbox） ---------- */

    function mountSiteForum(section) {
        var box = section.querySelector('[data-forum-frame]');
        if (!box || box.dataset.forumState === 'mounted') return;
        box.dataset.forumState = 'mounted';

        var iframe = attach(box, SITE_FORUM_SRC, t('了了了游 · 全站论坛', 'lelele Game · Site forum'));
        iframe.style.height = '480px';
        iframe.style.minHeight = '380px';
        box.style.minHeight = '480px';
    }

    /* ---------- 游戏讨论区（Remarkbox） ---------- */

    function currentGameId() {
        try {
            var id = new URLSearchParams(window.location.search).get('id');
            return id ? String(id).trim() : '';
        } catch (e) {
            return '';
        }
    }

    function currentGameName() {
        var el = document.getElementById('gameTitle');
        if (el && el.textContent) {
            var name = el.textContent.trim();
            if (name) return name;
        }
        return '';
    }

    // 详情页的标题是数据拿到后才填进去的：等它出现再挂讨论区，
    // 否则话题标题会拿成站名（话题本身按 id 走，不会开错楼，但名字会难看）
    function waitForGameName(callback) {
        var name = currentGameName();
        if (name) { callback(name); return; }

        var waited = 0;
        var timer = setInterval(function () {
            waited += 200;
            var got = currentGameName();
            if (got || waited >= 10000) {
                clearInterval(timer);
                callback(got || '');
            }
        }, 200);
    }

    function mountGameForum(section) {
        var box = section.querySelector('[data-forum-frame]');
        if (!box || box.dataset.forumState === 'mounted') return;

        var gameId = currentGameId();
        if (!gameId) {
            section.setAttribute('hidden', 'hidden');
            return;
        }

        waitForGameName(function (name) {
            box.dataset.forumState = 'mounted';
            renderGameForum(section, box, gameId, name || t('游戏 ' + gameId, 'Game ' + gameId));
        });
    }

    function renderGameForum(section, box, gameId, initialName) {
        var gameName = initialName;
        // 让标题里出现游戏名，读起来更像「这一款的讨论区」；中英各写各的，切语言不用重建
        function syncSubject() {
            var zh = section.querySelector('[data-forum-subject-zh]');
            var en = section.querySelector('[data-forum-subject-en]');
            if (zh) zh.textContent = '关于《' + gameName + '》的一切，都可以在这里聊。';
            if (en) en.textContent = 'Everything about “' + gameName + '” — talk here.';
        }
        syncSubject();

        var threadUri = THREAD_ORIGIN + '/game.html?id=' + encodeURIComponent(gameId);
        var src = 'https://my.remarkbox.com/embed' +
            '?rb_owner_key=' + encodeURIComponent(RB_OWNER_KEY) +
            '&thread_title=' + encodeURIComponent(gameName) +
            '&thread_uri=' + encodeURIComponent(threadUri) +
            '&mode=light';

        attach(
            box,
            src,
            t(gameName + ' · 游戏讨论区', gameName + ' · Game discussion'),
            function (frame) {
                frame.style.height = '460px';
                loadResizer().then(function () {
                    try {
                        window.iFrameResize({
                            checkOrigin: ['https://my.remarkbox.com'],
                            inPageLinks: true,
                            initCallback: function (e) {
                                frame.setAttribute('scrolling', 'no');
                                try { e.iFrameResizer.moveToAnchor(window.location.hash || ''); } catch (err) {}
                            }
                        }, frame);
                    } catch (err) {
                        frame.style.height = '560px';
                        frame.setAttribute('scrolling', 'auto');
                    }
                }).catch(function () {
                    // 自动高度脚本没拿到：给个固定高度，内容仍可上下滚动查看
                    frame.style.height = '560px';
                    frame.setAttribute('scrolling', 'auto');
                });
                // 切语言后重新取一次游戏名（中英文名不同），只改副标题，iframe 不重建，楼层不丢
                window.addEventListener('langChanged', function () {
                    var newName = currentGameName();
                    if (!newName) return;
                    gameName = newName;
                    syncSubject();
                });
            }
        );
    }

    /* ---------- 启动 ---------- */

    ready(function () {
        var sections = document.querySelectorAll('[data-forum-type]');
        for (var i = 0; i < sections.length; i++) {
            (function (section) {
                var type = section.getAttribute('data-forum-type');
                if (type !== 'site' && type !== 'game') return;
                whenNearViewport(section, function () {
                    if (type === 'site') mountSiteForum(section);
                    else mountGameForum(section);
                });
            })(sections[i]);
        }
    });

    window.LeleleForum = Object.freeze({
        currentGameId: currentGameId,
        mountGameForum: mountGameForum,
        mountSiteForum: mountSiteForum
    });
})();
