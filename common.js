// 4.0.15：统一 fetch 超时（与 boot.js 同款幂等守卫）。本文件可能被 game/ 子页
// 单独加载（不加载 boot.js），因此必须自带定义；已存在时不覆盖。
if (typeof window.leleleFetch !== 'function') {
    window.leleleFetch = function (url, opts, ms) {
        opts = opts || {};
        if (opts.signal || typeof AbortController !== 'function') return fetch(url, opts);
        var ctrl = new AbortController();
        var timer = setTimeout(function () { ctrl.abort(); }, ms || 8000);
        var merged = {};
        Object.keys(opts).forEach(function (k) { merged[k] = opts[k]; });
        merged.signal = ctrl.signal;
        return fetch(url, merged).finally(function () { clearTimeout(timer); });
    };
}

(function () {
    'use strict';

    // ----------------------------------------------------------------------
    // 4.0.15：可调日志 + 内联 onclick 提升器
    //
    // 全站曾有 100+ 处 `onclick="..."` 内联属性，结构与行为耦合且无法收紧 CSP。
    // 逐处改写成 addEventListener 会动到 20+ 个文件、风险极高，因此改为在引导层
    // 统一「提升」：直接复用浏览器已经编译好的 el.onclick 函数（含 event 形参、
    // this 绑定与 return false 语义），移除内联属性后挂到 addEventListener。
    // 行为完全等价，但 DOM 中不再存在内联事件属性。
    // 动态插入（innerHTML 模板）由 MutationObserver 增量提升，带节流。
    // ----------------------------------------------------------------------
    if (typeof window.leleleLog !== 'function') {
        window.leleleLog = function () {
            if (window.leleleDebug) {
                console.log.apply(console, arguments);
            }
        };
    }

    if (typeof window.leleleLiftInlineClicks !== 'function') {
        window.leleleLiftInlineClicks = function (root) {
            var scope = root && root.querySelectorAll ? root : document;
            var nodes = scope.querySelectorAll('[onclick]');
            for (var i = 0; i < nodes.length; i++) {
                (function (el) {
                    var fn = el.onclick;           // 浏览器编译好的处理函数
                    if (typeof fn !== 'function') { el.removeAttribute('onclick'); return; }
                    el.removeAttribute('onclick');
                    el.addEventListener('click', function (e) {
                        // 内联 return false 会阻止默认行为，addEventListener 需显式还原
                        if (fn.call(el, e) === false) e.preventDefault();
                    });
                })(nodes[i]);
            }
            // root 自身若带 onclick 也要提升
            if (root && root.nodeType === 1 && root.hasAttribute && root.hasAttribute('onclick')) {
                var selfFn = root.onclick;
                root.removeAttribute('onclick');
                if (typeof selfFn === 'function') {
                    root.addEventListener('click', function (e) {
                        if (selfFn.call(root, e) === false) e.preventDefault();
                    });
                }
            }
            return nodes.length;
        };

        var leleleLiftScheduled = false;
        function leleleScheduleLift() {
            if (leleleLiftScheduled) return;
            leleleLiftScheduled = true;
            setTimeout(function () {
                leleleLiftScheduled = false;
                window.leleleLiftInlineClicks(document);
            }, 60);
        }

        function leleleStartLiftWatcher() {
            window.leleleLiftInlineClicks(document);
            if (typeof MutationObserver === 'function') {
                new MutationObserver(function (records) {
                    for (var i = 0; i < records.length; i++) {
                        if (records[i].addedNodes && records[i].addedNodes.length) {
                            leleleScheduleLift();
                            break;
                        }
                    }
                }).observe(document.documentElement, { childList: true, subtree: true });
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', leleleStartLiftWatcher, { once: true });
        } else {
            leleleStartLiftWatcher();
        }
    }

})();

// 4.0.12：初始化不再死等 DOMContentLoaded（外部 defer 脚本曾把它无限推迟）。
// defer 脚本执行时 DOM 已解析完，readyState 非 loading 即可立即初始化。
function leleleOnReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else { fn(); }
}
(function() {
    'use strict';

    // ==================== 公共工具函数（统一出口，消除各页重复定义） ====================
    // 守卫：若页面已自行定义（如 about.html 的 escapeHtml 含 \n→<br> 专用处理），则不覆盖
    if (typeof window.escapeHtml !== 'function') {
        window.escapeHtml = function (str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };
    }
    if (typeof window.getFavorites !== 'function') {
        window.getFavorites = function () {
            try { return JSON.parse(localStorage.getItem('lelele_favs') || '[]'); } catch (e) { return []; }
        };
    }
    if (typeof window.saveFavorites !== 'function') {
        window.saveFavorites = function (favs) {
            try { localStorage.setItem('lelele_favs', JSON.stringify(favs)); } catch (e) {}
        };
    }

    // ==================== 全局配置 ====================
    const GAME_PATH_KEY = '/game/';
    const isGamePage = window.location.pathname.includes(GAME_PATH_KEY) || window.forceGamePage === true;
    const MAIN_SITE_URL = 'https://game.leleleling.site';

    const TALLY_FEEDBACK_ID_ZH = 'EqkbqB';
    const TALLY_FEEDBACK_ID_EN = 'Eqkb54';

    // ==================== 全局埋点接口 ====================
    window.leleleTrack = function(eventName, eventData) {
        if (typeof edgemetry !== 'undefined') {
            try { edgemetry(eventName, eventData); } catch(e) {}
        } else if (typeof umami !== 'undefined') {
            try { umami.track(eventName, eventData); } catch(e) {}
        }
    };

    // ==================== 作者认证徽章体系（新增） ====================
    // 等级 1-6：普通创作者 / 制作人 / 优质制作人 / 开发者 / 金牌开发者 / 开发团队
    const LELELE_AUTHOR_LEVELS = [
        { level: 1, zh: '普通创作者', en: 'Creator',          color: '#64748b', bg: '#f1f5f9',
          reqZh: '完成开发者注册即获此等级，可发布第一款游戏。', reqEn: 'Granted upon developer registration; can publish the first game.' },
        { level: 2, zh: '制作人',     en: 'Producer',         color: '#0ea5e9', bg: '#e0f2fe',
          reqZh: '已发布 ≥1 款游戏；资料完整（头像+简介）；至少绑定一种登录方式。', reqEn: '≥1 published game; complete profile (avatar + bio); ≥1 linked sign-in method.' },
        { level: 3, zh: '优质制作人', en: 'Premium Producer', color: '#8b5cf6', bg: '#ede9fe',
          reqZh: '累计发布 ≥3 款游戏；至少 1 款上架 ≥14 天且无严重违规；或被官方编辑推荐。', reqEn: '≥3 games; ≥1 live ≥14d with no serious violations; or editor-picked.' },
        { level: 4, zh: '开发者',     en: 'Developer',        color: '#4f46e5', bg: '#e0e7ff',
          reqZh: '累计发布 ≥3 款且至少 1 款上架 ≥30 天；通过内容合规复审；收到 ≥10 条有效玩家反馈。', reqEn: '≥3 games (≥1 live ≥30d); passed content compliance review; ≥10 valid player feedback.' },
        { level: 5, zh: '金牌开发者', en: 'Gold Developer',   color: '#d97706', bg: '#fef3c7',
          reqZh: '累计发布 ≥5 款；至少 2 款评分 ≥4.7 或总游玩 ≥10 万；无违规记录；经官方评定。', reqEn: '≥5 games; ≥2 rated ≥4.7 or total plays ≥100k; clean record; official verdict.' },
        { level: 6, zh: '开发团队',   en: 'Development Team',  color: '#059669', bg: '#d1fae5',
          reqZh: '以团队名义注册并绑定组织；≥5 款游戏；官方认证的组织实体；支持多人协作。', reqEn: 'Team/org account with org binding; ≥5 games; officially recognized org; multi-member.' }
    ];
    const LELELE_AUTHOR_OFFICIAL = { zh: '官方', en: 'Official' };
    const LELELE_AUTHOR_SPECIAL = { zh: '本站原创团队', en: 'Official Studio' };

    // 根据作者对象返回徽章 HTML（作者对象需含 authorlevel / official / studio_special）
    function leleleAuthorBadges(author, opts) {
        if (!author) author = {};
        const en = !!(opts && opts.en) || document.documentElement.getAttribute('data-lang') === 'en';
        const wrap = (href, inner) => '<a href="' + href + '" class="lelele-badge-link" title="' + (en ? 'View certification details' : '查看认证详情') + '">' + inner + '</a>';
        const out = [];
        if (author.studio_special) {
            out.push(wrap('AUTHOR_CERTIFICATION.html', '<span class="lelele-badge lelele-badge-special" title="' + (en ? 'This is the site’s own studio' : '本站官方原创团队') + '">★ ' + (en ? LELELE_AUTHOR_SPECIAL.en : LELELE_AUTHOR_SPECIAL.zh) + '</span>'));
        }
        if (author.official) {
            out.push(wrap('AUTHOR_CERTIFICATION.html', '<span class="lelele-badge lelele-badge-official">【' + (en ? LELELE_AUTHOR_OFFICIAL.en : LELELE_AUTHOR_OFFICIAL.zh) + '】</span>'));
        }
        const lvl = Number(author.authorlevel) || 1;
        const def = LELELE_AUTHOR_LEVELS.find(function (x) { return x.level === lvl; }) || LELELE_AUTHOR_LEVELS[0];
        out.push(wrap('authorlevel.html?level=' + def.level, '<span class="lelele-badge lelele-badge-level" style="--badge-color:' + def.color + ';--badge-bg:' + def.bg + '">' + (en ? def.en : def.zh) + '</span>'));
        return out.join('');
    }
    window.leleleAuthorBadges = leleleAuthorBadges;
    window.LELELE_AUTHOR_LEVELS = LELELE_AUTHOR_LEVELS;
    window.LELELE_AUTHOR_OFFICIAL = LELELE_AUTHOR_OFFICIAL;
    window.LELELE_AUTHOR_SPECIAL = LELELE_AUTHOR_SPECIAL;

    // ==================== 游戏直链访问探针（新增） ====================
    function initDirectLinkTracker() {
        if (!isGamePage) return;
        
        // 排除从详情页正常跳转过来的情况
        const referrer = document.referrer;
        if (referrer && (referrer.includes('game.html') || referrer.includes(MAIN_SITE_URL))) return;

        // 防止刷新重复计数
        const sessionKey = `lelele_visited_${window.location.pathname}`;
        if (sessionStorage.getItem(sessionKey)) return;

        // 异步去匹配游戏名并统计
        window.leleleFetch(`${MAIN_SITE_URL}/lelegame_data.json`)
            .then(res => res.json())
            .then(games => {
                const currentPath = window.location.pathname;
                // 模糊匹配路径
                const matchedGame = games.find(g => g.url && currentPath.includes(g.url.replace(/^\//, '')));
                
                if (matchedGame) {
                    const gameName = matchedGame.name_zh || matchedGame.name;
                    window.leleleTrack('play-game_' + gameName);
                    sessionStorage.setItem(sessionKey, '1');
                }
            })
            .catch(e => console.warn('Direct link tracking failed', e));
    }

    // ==================== 主站鉴权与 UI 注入（新增） ====================
    let captchaClientPromise = null;

    function loadCaptchaClient() {
        if (window.LeleleCaptcha) return Promise.resolve(window.LeleleCaptcha);
        if (captchaClientPromise) return captchaClientPromise;

        if (!document.querySelector('link[href$="recaptcha.css"]')) {
            const style = document.createElement('link');
            style.rel = 'stylesheet';
            style.href = '/recaptcha.css';
            document.head.appendChild(style);
        }

        const loadScript = (src, id) => new Promise((resolve, reject) => {
            const existing = document.getElementById(id);
            if (existing) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }
            const script = document.createElement('script');
            script.id = id;
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        captchaClientPromise = loadScript('/recaptcha-config.js', 'lelele-recaptcha-config')
            .then(() => loadScript('/recaptcha.js', 'lelele-recaptcha-client'))
            .then(() => {
                if (!window.LeleleCaptcha) throw new Error('Captcha client unavailable');
                return window.LeleleCaptcha;
            })
            .catch((error) => {
                captchaClientPromise = null;
                throw error;
            });
        return captchaClientPromise;
    }

    async function initMainSiteAuth() {
        if (isGamePage) return;
        if (typeof supabaseClient === 'undefined' || !supabaseClient) return;

        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            const sessionCaptchaClient = session ? loadCaptchaClient() : Promise.resolve(null);
            if (session) {
                sessionCaptchaClient
                    .then((client) => client.showReminderIfDue(session))
                    .catch(() => console.warn('Captcha reminder unavailable'));
            }
            
            // 1. 注入右上角头像和开发者面板按钮
            const rightActions = document.querySelector('.right-actions');
            if (rightActions) {
                // 插入开发者面板按钮
                const devPanelBtn = document.createElement('a');
                devPanelBtn.href = 'dashboard.html';
                devPanelBtn.className = 'action-btn';
                devPanelBtn.style.background = 'rgba(79, 70, 229, 0.1)';
                devPanelBtn.style.color = 'var(--primary)';
                devPanelBtn.innerHTML = '<span class="zh-inline">💻 开发者面板</span><span class="en-inline">💻 Dashboard</span>';
                rightActions.insertBefore(devPanelBtn, rightActions.firstChild);

                // 如果登录了，插入头像
                if (session) {
                    const userBtn = document.createElement('a');
                    userBtn.href = 'dashboard.html';
                    userBtn.className = 'action-btn';
                    userBtn.style.padding = '4px';
                    userBtn.style.borderRadius = '50%';
                    userBtn.style.overflow = 'hidden';
                    userBtn.style.width = '40px';
                    userBtn.style.height = '40px';
                    userBtn.style.display = 'flex';
                    userBtn.style.alignItems = 'center';
                    userBtn.style.justifyContent = 'center';
                    userBtn.innerHTML = '👤';
                    userBtn.style.fontSize = '1.2rem';
                    userBtn.style.background = 'var(--card-border)';
                    rightActions.insertBefore(userBtn, rightActions.firstChild);

                    supabaseClient.from('profiles').select('avatar_url, display_name').eq('id', session.user.id).single()
                        .then(({ data: profile }) => {
                            if (!profile || !profile.avatar_url) return;
                            const avatar = document.createElement('img');
                            avatar.src = profile.avatar_url;
                            avatar.alt = '';
                            avatar.style.cssText = 'width:100%; height:100%; object-fit:cover;';
                            userBtn.replaceChildren(avatar);
                            userBtn.style.background = 'transparent';
                        })
                        .catch(() => {});
                }
            }

            // 2. 拦截投稿按钮
            const submitBtn = document.getElementById('openSubmitGuide');
            if (submitBtn) {
                // 移除原有的 onclick 绑定，改用自定义拦截
                const originalOnclick = submitBtn.onclick;
                submitBtn.onclick = async (e) => {
                    e.preventDefault();
                    let currentSession = null;
                    try {
                        const { data } = await supabaseClient.auth.getSession();
                        currentSession = data?.session || null;
                    } catch (error) {}

                    if (!currentSession) {
                        const isEn = getLang() === 'en';
                        // 未登录：提供两条路径 —— 登录投稿 / 直接去推荐游戏（无需登录）
                        const goRecommend = confirm(isEn
                            ? 'Publishing a game requires a developer account. You will be redirected to login.\n\nOK = Recommend a game instead (no login needed)\nCancel = Go to login'
                            : '发布游戏需要先注册/登录开发者账号，将跳转到登录页。\n\n点「确定」= 我只想推荐游戏（无需登录，直接在首页打开推荐表单）\n点「取消」= 前往登录');
                        if (goRecommend) {
                            window.location.href = 'index.html?recommend=1';
                        } else {
                            window.location.href = 'login.html';
                        }
                        return;
                    }

                    submitBtn.disabled = true;
                    try {
                        const client = await loadCaptchaClient();
                        try {
                            await client.requireCurrentVerification(currentSession);
                        } catch (error) {
                            await client.showReverificationModal(currentSession);
                        }
                        if (originalOnclick) originalOnclick.call(submitBtn, e);
                    } catch (error) {
                        console.warn('Captcha gate unavailable');
                    } finally {
                        submitBtn.disabled = false;
                    }
                };
            }
        } catch (e) {
            console.warn('Auth check failed', e);
        }
    }


    // ==================== 智能游戏存档探针 ====================
    (function initAutoSaveManager() {
        if (!isGamePage) return;

        const pathPrefix = window.location.pathname.replace(/\/[^/]*$/, '/');
        const NS = `lelele_save_${pathPrefix}`;
        const AUTO_SAVE_KEY = `lelele_autosave_${pathPrefix}`;

        const originalSetItem = Storage.prototype.setItem;
        const originalGetItem = Storage.prototype.getItem;
        const originalRemoveItem = Storage.prototype.removeItem;

        let hasNativeSave = false; 

        Storage.prototype.setItem = function(key, value) {
            if (!key.startsWith('lelele_')) {
                hasNativeSave = true;
                return originalSetItem.call(this, NS + key, value);
            }
            return originalSetItem.apply(this, arguments);
        };
        Storage.prototype.getItem = function(key) {
            if (!key.startsWith('lelele_')) return originalGetItem.call(this, NS + key);
            return originalGetItem.apply(this, arguments);
        };
        Storage.prototype.removeItem = function(key) {
            if (!key.startsWith('lelele_')) return originalRemoveItem.call(this, NS + key);
            return originalRemoveItem.apply(this, arguments);
        };

        try {
            const backup = originalGetItem.call(localStorage, AUTO_SAVE_KEY);
            if (backup) {
                const parsed = JSON.parse(backup);
                if (parsed.state) window.state = parsed.state;
                if (parsed.gameState) window.gameState = parsed.gameState;
                if (parsed.data) window.data = parsed.data;
            }
        } catch(e) {}

        const safeStringify = (obj) => JSON.stringify(obj, (k, v) => {
            if (typeof v === 'function' || (typeof v === 'object' && v !== null && v.nodeType === 1)) return undefined;
            return v;
        });

        const doAutoSave = () => {
            if (hasNativeSave) return;
            try {
                const stateToSave = {};
                let hasState = false;

                if (window.state && typeof window.state === 'object') {
                    stateToSave.state = JSON.parse(safeStringify(window.state));
                    hasState = true;
                }
                if (window.gameState && typeof window.gameState === 'object') {
                    stateToSave.gameState = JSON.parse(safeStringify(window.gameState));
                    hasState = true;
                }
                if (window.data && typeof window.data === 'object' && !Array.isArray(window.data)) {
                    stateToSave.data = JSON.parse(safeStringify(window.data));
                    hasState = true;
                }

                if (hasState) {
                    originalSetItem.call(localStorage, AUTO_SAVE_KEY, JSON.stringify(stateToSave));
                }
            } catch (e) {}
        };

        const autoSaveTimer = setInterval(() => {
            if (hasNativeSave) {
                clearInterval(autoSaveTimer);
                return;
            }
            doAutoSave();
        }, 5000);

        window.addEventListener('beforeunload', doAutoSave);
    })();


    // ==================== 工具函数 ====================
    const getStorage = (key, defaultVal) => {
        try { return JSON.parse(localStorage.getItem(key)) || defaultVal; } 
        catch (e) { return defaultVal; }
    };
    const setStorage = (key, val) => {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
    };
    const escapeHtml = (str) => {
        if (str === null || str === undefined) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    };
    const getLang = () => document.documentElement.getAttribute('data-lang') || 'zh';

    // ==================== 全局多语言切换 ====================
    window.setLang = function(lang) {
        document.documentElement.setAttribute('data-lang', lang);
        document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
        
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.langBtn === lang);
        });
        
        try { localStorage.setItem('lelele_lang', lang); } catch (e) {}

        injectFooter();
        updateFloatingTooltips();
        
        if (typeof allValidAnnouncements !== 'undefined') {
            const closedObj = getStorage('lelele_closed_announcements', {});
            renderIndexAnnouncements(allValidAnnouncements.slice(0, 3), closedObj);
        }

        window.dispatchEvent(new Event('langChanged'));
    };

    // ==================== 深色模式逻辑 ====================
    function initTheme() {
        const savedTheme = localStorage.getItem('lelele_theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark-mode');
        }

        window.toggleTheme = function() {
            const isDark = document.documentElement.classList.toggle('dark-mode');
            localStorage.setItem('lelele_theme', isDark ? 'dark' : 'light');
        };
    }

    // ==================== 滑动提示浮窗逻辑 ====================
    function initSlideHint() {
        if (isGamePage) return;

        const pagePath = window.location.pathname;
        const storageKey = `lelele_slide_hint_${pagePath}`;
        const lastShowTime = getStorage(storageKey, 0);
        const now = Date.now();
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

        if (now - lastShowTime < THIRTY_DAYS) return;
        if (document.documentElement.scrollHeight <= window.innerHeight + 200) return;

        const hint = document.createElement('div');
        hint.className = 'common-slide-hint';
        hint.innerHTML = `
            <span class="zh-inline">👇 向下滑动可以查看更多</span>
            <span class="en-inline">👇 Scroll down to see more</span>
            <button id="slideHintBtn">
                <span class="zh-inline">知道了</span>
                <span class="en-inline">Got it</span>
            </button>
        `;
        document.body.appendChild(hint);

        setTimeout(() => hint.classList.add('show'), 100);

        let closeTimer = setTimeout(closeHint, 15000);

        function closeHint() {
            clearTimeout(closeTimer);
            hint.classList.remove('show');
            setStorage(storageKey, now);
            setTimeout(() => hint.remove(), 400);
        }

        document.getElementById('slideHintBtn').onclick = closeHint;
    }

    // ==================== 活动核心逻辑 ====================
    async function initActivityTheme() {
        try {
            let skipEffects = false;
            try {
                const specRes = await window.leleleFetch(`${MAIN_SITE_URL}/special_common.json?t=${Date.now()}`);
                if (specRes.ok) {
                    const specData = await specRes.json();
                    const host = window.location.hostname;
                    const path = window.location.pathname;
                    if (specData.skip_effects_domains && specData.skip_effects_domains.includes(host)) skipEffects = true;
                    if (specData.skip_effects_paths && specData.skip_effects_paths.some(p => path.includes(p))) skipEffects = true;
                }
            } catch (err) {}

            const res = await window.leleleFetch(`${MAIN_SITE_URL}/activity_whole.json?t=${Date.now()}`);
            if (!res.ok) return;
            const config = await res.json();

            const now = new Date();
            let isActive = config.forceEnable || false;

            if (!isActive && config.specialPeriod) {
                const start = new Date(config.specialPeriod.start);
                const end = new Date(config.specialPeriod.end);
                if (now >= start && now <= end) isActive = true;
            }

            if (!isActive && config.yearlyPeriod) {
                const currentYear = now.getFullYear();
                const startStr = `${currentYear}-${config.yearlyPeriod.start}`;
                let endStr = `${currentYear}-${config.yearlyPeriod.end}`;
                const start = new Date(startStr);
                let end = new Date(endStr);
                if (end < start) end = new Date(`${currentYear + 1}-${config.yearlyPeriod.end}`);
                if (now >= start && now <= end) isActive = true;
            }

            if (!isActive) return;

            document.documentElement.classList.add('activity-mode');

            let hasFavicon = false;
            document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach(favicon => {
                favicon.href = config.assets.favicon;
                hasFavicon = true;
            });
            if (!hasFavicon) {
                const link = document.createElement('link');
                link.rel = 'icon';
                link.href = config.assets.favicon;
                document.head.appendChild(link);
            }

            setTimeout(() => {
                document.querySelectorAll('img').forEach(img => {
                    if (img.src.includes('lelelegame') && !img.src.includes('-winter')) {
                        img.src = config.assets.logo;
                    }
                });
            }, 100);

            if (skipEffects) return; 

            if (!isGamePage) {
                const style = document.createElement('style');
                const bgUrl = config.assets.background;
                style.innerHTML = `
                    html.activity-mode body {
                        background: linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.1)), url('${bgUrl}') no-repeat center center fixed !important;
                        background-size: cover !important;
                    }
                    html.dark-mode.activity-mode body {
                        background: linear-gradient(rgba(15,23,42,0.85), rgba(15,23,42,0.85)), url('${bgUrl}') no-repeat center center fixed !important;
                        background-size: cover !important;
                    }
                `;
                document.head.appendChild(style);
            }

            if (document.getElementById('gamesGrid') && document.querySelector('.controls')) {
                if (!document.querySelector('.activity-banner-container')) {
                    const bannerDiv = document.createElement('div');
                    bannerDiv.className = 'activity-banner-container';
                    bannerDiv.innerHTML = `<img src="${config.assets.banner}" alt="Activity Banner">`;
                    const controls = document.querySelector('.controls');
                    controls.parentNode.insertBefore(bannerDiv, controls.nextSibling);
                }
            }

            if (!document.querySelector('.activity-sticker')) {
                const snowman = document.createElement('img');
                snowman.src = config.assets.snowman;
                snowman.className = 'activity-sticker snowman';
                const tree = document.createElement('img');
                tree.src = config.assets.tree;
                tree.className = 'activity-sticker tree';
                document.body.appendChild(snowman);
                document.body.appendChild(tree);
            }

            if (config.enableSnowfall) initSnowfall();

        } catch (e) {}
    }

    function initSnowfall() {
        if (document.getElementById('snowfall-canvas')) return;
        const canvas = document.createElement('canvas');
        canvas.id = 'snowfall-canvas';
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        const snowflakes = [];
        const maxSnowflakes = window.innerWidth < 768 ? 40 : 100; 
        
        for (let i = 0; i < maxSnowflakes; i++) {
            snowflakes.push({
                x: Math.random() * width, y: Math.random() * height,
                r: Math.random() * 3 + 1, d: Math.random() * maxSnowflakes,
                speedY: Math.random() * 1 + 0.5, speedX: Math.random() * 1 - 0.5
            });
        }
        
        function draw() {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            for (let i = 0; i < maxSnowflakes; i++) {
                const f = snowflakes[i];
                ctx.moveTo(f.x, f.y);
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
            }
            ctx.fill();
            update();
        }
        
        let angle = 0;
        function update() {
            angle += 0.01;
            for (let i = 0; i < maxSnowflakes; i++) {
                const f = snowflakes[i];
                f.y += Math.cos(angle + f.d) + f.speedY;
                f.x += Math.sin(angle) * 1.5 + f.speedX;
                if (f.y > height) { f.y = -5; f.x = Math.random() * width; }
                if (f.x > width) f.x = 0;
                if (f.x < 0) f.x = width;
            }
        }
        
        function loop() { draw(); requestAnimationFrame(loop); }
        loop();
        
        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });
    }

    // ==================== Footer 注入逻辑 ====================
    function injectFooter() {
        const existingFooter = document.querySelector('.common-footer');
        if (existingFooter) existingFooter.remove();
        
        const lang = getLang();
        const suffix = lang === 'en' ? '?lang=en' : '';
        
        const footer = document.createElement('footer');
        footer.className = 'common-footer';
        footer.innerHTML = `
            © 2026 <span class="${lang === 'zh' ? 'zh-inline' : 'en-inline'}">了了了岭工作室 · 了了了游</span><span class="${lang === 'zh' ? 'en-inline' : 'zh-inline'}">Leleleling Studio · lelele Game</span> ｜
            <a href="${MAIN_SITE_URL}/game_rules.html${suffix}">${lang === 'zh' ? '游戏守则' : 'Rules'}</a> ｜
            <a href="${MAIN_SITE_URL}/user_agreement.html${suffix}">${lang === 'zh' ? '用户协议' : 'User Agreement'}</a> ｜
            <a href="${MAIN_SITE_URL}/privacy.html${suffix}">${lang === 'zh' ? '隐私政策' : 'Privacy'}</a> ｜
            <a href="${MAIN_SITE_URL}/terms.html${suffix}">${lang === 'zh' ? '服务条款' : 'Terms'}</a> ｜
            <a href="${MAIN_SITE_URL}/copyright.html${suffix}">${lang === 'zh' ? '版权投诉' : 'Copyright'}</a>
        `;
        
        const oldFooter = document.querySelector('footer:not(.common-footer)');
        if (oldFooter) oldFooter.replaceWith(footer);
        else document.body.appendChild(footer);
    }

    // ==================== 悬浮工具注入 ====================
    function injectFloatingTools() {
        if (isGamePage) return;
        if (document.querySelector('.common-float-tools')) return;
        
        const container = document.createElement('div');
        container.className = 'common-float-tools';
        container.innerHTML = `
            <button class="common-float-btn" id="commonBtnFeedback" data-tooltip="意见反馈">💬</button>
            <button class="common-float-btn" id="commonBtnTop" data-tooltip="回到顶部">⬆️</button>
        `;
        document.body.appendChild(container);

        const btnTop = document.getElementById('commonBtnTop');
        const btnFeedback = document.getElementById('commonBtnFeedback');
        btnFeedback.classList.add('show');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) btnTop.classList.add('show');
            else btnTop.classList.remove('show');
        });
        btnTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

        btnFeedback.onclick = () => {
            const lang = getLang();
            const tallyId = lang === 'en' ? TALLY_FEEDBACK_ID_EN : TALLY_FEEDBACK_ID_ZH;
            if (typeof Tally !== 'undefined') {
                Tally.openPopup(tallyId);
            } else {
                const script = document.createElement('script');
                script.src = 'https://tally.so/widgets/embed.js';
                script.onload = () => { if (typeof Tally !== 'undefined') Tally.openPopup(tallyId); };
                script.onerror = () => { alert(lang === 'en' ? 'Failed to load feedback form.' : '反馈表单加载失败，请检查网络。'); };
                document.body.appendChild(script);
            }
        };

        updateFloatingTooltips();
    }

    function updateFloatingTooltips() {
        const lang = getLang();
        const fbBtn = document.getElementById('commonBtnFeedback');
        const topBtn = document.getElementById('commonBtnTop');
        if (fbBtn) fbBtn.setAttribute('data-tooltip', lang === 'en' ? 'Feedback' : '意见反馈');
        if (topBtn) topBtn.setAttribute('data-tooltip', lang === 'en' ? 'Back to Top' : '回到顶部');
    }

    // ==================== PWA 安装提示 ====================
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        setTimeout(() => {
            if (!deferredPrompt) return;
            if (localStorage.getItem('lelele_pwa_dismissed') === 'true') return;
            const isEn = getLang() === 'en';
            const pwaBanner = document.createElement('div');
            pwaBanner.className = 'common-pwa-banner';
            pwaBanner.style.cssText = `position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--card-bg); backdrop-filter: blur(10px); border: 1px solid var(--card-border); border-radius: 16px; padding: 16px 24px; display: flex; align-items: center; gap: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 9999; animation: slideUp 0.4s ease; max-width: 90%; width: 400px;`;
            pwaBanner.innerHTML = `
                <div style="font-size: 1.8rem;">📱</div>
                <div style="flex: 1; text-align: left;">
                    <div style="font-weight: 700; color: var(--text-main); font-size: 1rem; margin-bottom: 4px;">${isEn ? 'Install lelele Game' : '安装了了了游'}</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">${isEn ? 'Add to home screen for a better experience.' : '添加到主屏幕，享受更沉浸的体验。'}</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button id="pwaInstallBtn" style="background: var(--primary); color: #fff; border: none; padding: 6px 12px; border-radius: 20px; font-weight: 600; cursor: pointer; font-size: 0.85rem;">${isEn ? 'Install' : '立即安装'}</button>
                    <button id="pwaCloseBtn" style="background: transparent; color: var(--text-muted); border: none; padding: 4px; cursor: pointer; font-size: 0.8rem;">${isEn ? 'Dismiss' : '下次再说'}</button>
                </div>
            `;
            document.body.appendChild(pwaBanner);
            document.getElementById('pwaInstallBtn').addEventListener('click', () => {
                pwaBanner.remove();
                if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(() => { deferredPrompt = null; }); }
            });
            document.getElementById('pwaCloseBtn').addEventListener('click', () => {
                pwaBanner.remove();
                localStorage.setItem('lelele_pwa_dismissed', 'true');
            });
        }, 60000);
    });

    // ==================== 公告核心逻辑 ====================
    let allValidAnnouncements = [];

    // 公告弹窗 3 天缓存：3 天内除非出现真正的新公告，否则不再弹出
    const ANN_MODAL_KEY = 'lelele_ann_modal_cache';
    function getAnnModalCache() { return getStorage(ANN_MODAL_KEY, { lastShown: 0, ids: [] }); }
    function shouldShowAnnModal(ids) {
        const c = getAnnModalCache();
        const within = (Date.now() - (c.lastShown || 0)) < 3 * 24 * 60 * 60 * 1000;
        const hasNew = (ids || []).some(id => !(c.ids || []).includes(id));
        return !within || hasNew;
    }
    function setAnnModalCache(ids) { setStorage(ANN_MODAL_KEY, { lastShown: Date.now(), ids: ids }); }

    async function initAnnouncements() {
        try {
            const res = await window.leleleFetch(`${MAIN_SITE_URL}/announcements.json`);
            if (!res.ok) return;
            let allData = await res.json();
            const now = new Date().setHours(0, 0, 0, 0);
            
            allValidAnnouncements = allData.filter(item => {
                const pub = new Date(item.publishDate).getTime();
                const exp = new Date(item.expireDate).getTime();
                if (isNaN(pub) || isNaN(exp)) return false;
                return pub <= now && exp >= now;
            }).sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

            const top3Data = allValidAnnouncements.slice(0, 3);
            const readList = getStorage('lelele_read_announcements', []);
            const closedObj = getStorage('lelele_closed_announcements', {});
            const top3Ids = top3Data.map(a => a.id);

            const newReadList = readList.filter(id => top3Ids.includes(id));
            if (newReadList.length !== readList.length) setStorage('lelele_read_announcements', newReadList);

            let closedChanged = false;
            for (let id in closedObj) {
                if (!top3Ids.includes(id)) { delete closedObj[id]; closedChanged = true; }
            }
            if (closedChanged) setStorage('lelele_closed_announcements', closedObj);

            renderIndexAnnouncements(top3Data, closedObj);
            const hasUnread = top3Data.some(item => !newReadList.includes(item.id));
            if (hasUnread && shouldShowAnnModal(top3Ids)) {
                showUnreadModal(top3Ids);
                setAnnModalCache(top3Ids);
            }

            setInterval(() => {
                const currentClosed = getStorage('lelele_closed_announcements', {});
                let changed = false;
                const nowTime = Date.now();
                for (let id in currentClosed) {
                    if (nowTime - currentClosed[id] > 24 * 60 * 60 * 1000) { delete currentClosed[id]; changed = true; }
                }
                if (changed) {
                    setStorage('lelele_closed_announcements', currentClosed);
                    renderIndexAnnouncements(allValidAnnouncements.slice(0, 3), currentClosed);
                }
            }, 5 * 60 * 1000);
        } catch (e) {}
    }

    function renderIndexAnnouncements(top3Data, closedObj) {
        const listEl = document.getElementById('announcementsList');
        if (!listEl) return;
        
        const container = document.getElementById('announcementsContainer');
        if (container) container.style.display = 'block';

        const renderList = top3Data.filter(item => {
            const closeTime = closedObj[item.id];
            if (closeTime && (Date.now() - closeTime < 24 * 60 * 60 * 1000)) return false;
            return true;
        });

        const lang = getLang();

        if (renderList.length > 0) {
            listEl.innerHTML = renderList.map(item => {
                const titleZh = item.title_zh || item.title || '';
                const titleEn = item.title_en || item.title || titleZh;
                const title = lang === 'en' ? titleEn : titleZh;
                return `
                    <div class="announce-card" data-id="${item.id}">
                        <button class="announce-close" onclick="window.closeGlobalAnnounce('${item.id}', this)">×</button>
                        <div class="announce-top">
                            <div class="announce-name">${escapeHtml(title)}</div>
                            <div class="announce-date">${escapeHtml(item.publishDate)}</div>
                        </div>
                        <button class="announce-detail-btn" onclick="window.openAnnounceDetail('${item.id}')">${lang === 'en' ? 'View Details ➔' : '查看详情 ➔'}</button>
                    </div>
                `;
            }).join('');
        } else {
            listEl.innerHTML = `<div class="empty-announce-box"><span class="zh-inline">暂时没有新公告，或者公告已经被您全部关上啦。</span><span class="en-inline">No new announcements, or you have closed all of them.</span></div>`;
        }
        
        let viewAllBtn = document.getElementById('commonViewAllBtn');
        if (allValidAnnouncements.length > 0) {
            if (!viewAllBtn) {
                viewAllBtn = document.createElement('button');
                viewAllBtn.id = 'commonViewAllBtn';
                viewAllBtn.className = 'common-btn-view-all';
                viewAllBtn.onclick = () => openAllAnnounceModal(allValidAnnouncements);
                listEl.parentNode.appendChild(viewAllBtn);
            }
            viewAllBtn.innerHTML = lang === 'en' ? 'View All Announcements ➔' : '查看全部公告 ➔';
            viewAllBtn.style.display = 'inline-flex'; 
        } else {
            if (viewAllBtn) viewAllBtn.style.display = 'none'; 
        }
    }

    window.closeGlobalAnnounce = function(id, btnEl) {
        const card = btnEl.closest('.announce-card');
        if (card) card.style.display = 'none';
        const closedObj = getStorage('lelele_closed_announcements', {});
        closedObj[id] = Date.now();
        setStorage('lelele_closed_announcements', closedObj);
    };

    // 公告详情弹窗：侧栏仅显示标题，点此查看完整内容
    window.openAnnounceDetail = function(id) {
        const item = (allValidAnnouncements || []).find(a => a.id === id);
        if (!item) return;
        const isEn = getLang() === 'en';
        const title = isEn ? (item.title_en || item.title) : (item.title_zh || item.title);
        const rawContent = isEn ? (item.content_en || item.content) : (item.content_zh || item.content);
        const formattedContent = rawContent ? rawContent.replace(/\n/g, '<br>') : '';

        let overlay = document.getElementById('commonAnnounceDetailModal');
        if (overlay) overlay.remove();
        overlay = document.createElement('div');
        overlay.className = 'common-modal-overlay active';
        overlay.id = 'commonAnnounceDetailModal';
        overlay.innerHTML = `
            <div class="common-modal" style="max-width: 640px;">
                <button class="common-modal-close" onclick="document.getElementById('commonAnnounceDetailModal').remove()">×</button>
                <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.4rem;">${escapeHtml(title)}</h3>
                <div style="font-size: 0.78rem; color: #94a3b8; margin-bottom: 1rem;">${escapeHtml(item.publishDate || '')}</div>
                <div class="common-announce-detail-content">${formattedContent}</div>
            </div>
        `;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);

        const readList = getStorage('lelele_read_announcements', []);
        if (!readList.includes(id)) {
            readList.push(id);
            setStorage('lelele_read_announcements', readList);
        }
    };

    function showUnreadModal(unreadIds) {
        if (document.getElementById('commonUnreadModal')) return;
        const overlay = document.createElement('div');
        overlay.className = 'common-modal-overlay active';
        overlay.id = 'commonUnreadModal';
        const isEn = getLang() === 'en';
        overlay.innerHTML = `
            <div class="common-modal common-unread-modal">
                <div class="icon">📢</div>
                <h2>${isEn ? 'New Announcements' : '有新的平台公告'}</h2>
                <p>${isEn ? 'We have updated important information. Click below to view the latest announcements.' : '我们发布了新的重要信息，请点击下方按钮前往查看最新公告。'}</p>
                <button class="common-btn" id="btnGoAnnounce">${isEn ? 'View on Homepage' : '前往首页查看'}</button>
            </div>
        `;
        document.body.appendChild(overlay);

        let autoCloseTimer;
        if (isGamePage) {
            autoCloseTimer = setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 15000);
        }

        document.getElementById('btnGoAnnounce').onclick = () => {
            const readList = getStorage('lelele_read_announcements', []);
            unreadIds.forEach(id => { if (!readList.includes(id)) readList.push(id); });
            setStorage('lelele_read_announcements', readList);
            if (!window.location.pathname.endsWith('index.html') && window.location.hostname === 'game.leleleling.site' && window.location.pathname !== '/') {
                window.open(MAIN_SITE_URL + '/index.html' + (isEn ? '?lang=en' : ''), '_blank');
            } else if (window.location.hostname !== 'game.leleleling.site') {
                window.open(MAIN_SITE_URL + '/index.html' + (isEn ? '?lang=en' : ''), '_blank');
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            overlay.parentNode.removeChild(overlay);
            clearTimeout(autoCloseTimer);
        };
    }

    function openAllAnnounceModal(allData) {
        if (document.getElementById('commonAllAnnounceModal')) {
            document.getElementById('commonAllAnnounceModal').classList.add('active');
            return;
        }
        const overlay = document.createElement('div');
        overlay.className = 'common-modal-overlay active';
        overlay.id = 'commonAllAnnounceModal';
        const isEn = getLang() === 'en';
        overlay.innerHTML = `
            <div class="common-modal" style="max-width: 800px;">
                <button class="common-modal-close" onclick="document.getElementById('commonAllAnnounceModal').classList.remove('active')">×</button>
                <div class="modal-header" style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem;">${isEn ? '📢 All Announcements' : '📢 全部公告'}</div>
                <div class="common-announce-all-box">
                    <div class="common-announce-sidebar" id="commonAnnounceSidebar"></div>
                    <div class="common-announce-detail-area" id="commonAnnounceDetail"></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        const sidebar = document.getElementById('commonAnnounceSidebar');
        const detail = document.getElementById('commonAnnounceDetail');

        sidebar.innerHTML = allData.map((item, index) => {
            const title = isEn ? (item.title_en || item.title) : (item.title_zh || item.title);
            return `<div class="common-announce-menu-item ${index === 0 ? 'active' : ''}" data-index="${index}"><div class="common-announce-menu-title">${escapeHtml(title)}</div><div class="common-announce-menu-date">${item.publishDate}</div></div>`;
        }).join('');

        const renderDetail = (index) => {
            const item = allData[index];
            const title = isEn ? (item.title_en || item.title) : (item.title_zh || item.title);
            const rawContent = isEn ? (item.content_en || item.content) : (item.content_zh || item.content);
            const formattedContent = rawContent ? rawContent.replace(/\n/g, '<br>') : '';
            detail.innerHTML = `<h3>${escapeHtml(title)}</h3><div class="common-announce-detail-content">${formattedContent}</div>`;
        };
        renderDetail(0);
        sidebar.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.common-announce-menu-item');
            if (!menuItem) return;
            sidebar.querySelectorAll('.common-announce-menu-item').forEach(el => el.classList.remove('active'));
            menuItem.classList.add('active');
            renderDetail(parseInt(menuItem.dataset.index));
        });
    }

    // ==================== 灵动岛导航（紧凑版，仅首页） ====================
    function initIslandNav() {
        const bar = document.querySelector('.top-bar');
        const actions = document.getElementById('topRightActions');
        if (!bar || !actions) return;
        if (bar.dataset.islandBound) return;
        bar.dataset.islandBound = '1';

        // 复位搜索岛按钮图标
        function resetSearchBtn() {
            const b = actions.querySelector('.island-search-btn');
            if (b) { b.textContent = '🔍'; b.setAttribute('aria-label', getLang() === 'en' ? 'Search' : '搜索'); }
        }

        // 岛模式下的搜索按钮（平时隐藏）：点击在岛内就地展开「搜索岛」，不再跳回页面顶部
        if (!actions.querySelector('.island-search-btn')) {
            const sBtn = document.createElement('button');
            sBtn.type = 'button';
            sBtn.className = 'island-search-btn';
            sBtn.setAttribute('aria-label', getLang() === 'en' ? 'Search' : '搜索');
            sBtn.textContent = '🔍';
            sBtn.addEventListener('click', () => {
                const on = bar.classList.toggle('island-search-mode');
                if (on) {
                    sBtn.textContent = '×';
                    sBtn.setAttribute('aria-label', getLang() === 'en' ? 'Close search' : '关闭搜索');
                    // 等 morph 过渡稳定后再聚焦输入框
                    setTimeout(() => {
                        const si = document.getElementById('searchInput');
                        if (si) { si.focus(); si.scrollIntoView({ block: 'nearest' }); }
                    }, 220);
                } else {
                    resetSearchBtn();
                }
            });
            actions.appendChild(sBtn);
        }

        // Esc 退出搜索岛
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && bar.classList.contains('island-search-mode')) {
                bar.classList.remove('island-search-mode');
                resetSearchBtn();
            }
        });

        // 迟滞阈值 + 冷却，杜绝「滑到某个区间一阵一阵抽」
        const ENTER_THRESHOLD = 220;   // 滚过此高度「以上」才变岛
        const EXIT_THRESHOLD  = 140;   // 滚回此高度「以下」才还原（与进入形成迟滞带）
        const TOGGLE_COOLDOWN = 500;   // 两次切换之间至少间隔 0.5s
        let lastToggle = 0;

        let ticking = false;
        let islandOn = bar.classList.contains('island-mode');
        const update = () => {
            ticking = false;
            const y = window.scrollY;
            let target = islandOn;
            if (!islandOn && y > ENTER_THRESHOLD) target = true;
            else if (islandOn && y < EXIT_THRESHOLD) target = false;
            if (target !== islandOn) {
                const now = Date.now();
                if (now - lastToggle < TOGGLE_COOLDOWN) return; // 冷却期内忽略
                lastToggle = now;
                islandOn = target;
                bar.classList.toggle('island-mode', islandOn);
                // 退出灵动岛时同步收起搜索岛
                if (!islandOn) { bar.classList.remove('island-search-mode'); resetSearchBtn(); }
            }
        };
        window.addEventListener('scroll', () => {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });
        update();
    }

    // ==================== 「申请认证」按钮门控（仅登录作者可见） ====================
    // 仅已登录且拥有创作者身份（authorlevel>0）的用户可见，文案改为「为自己申请」；
    // 已登录但非创作者显示「成为创作者」引导；未登录则隐藏。普通访客无需看到该入口。
    function initApplyCertGating() {
        const targets = () => document.querySelectorAll('a[href="apply-certification.html"], #lvApplyBtn');
        // 鉴权结果：null=尚未决定；hide=隐藏；show=按标签展示
        let decided = null;
        const apply = () => {
            if (!decided) return;
            targets().forEach((el) => {
                if (decided.mode === 'hide') { el.style.display = 'none'; return; }
                el.style.display = '';
                const z = el.querySelector('.zh-inline');
                const e = el.querySelector('.en-inline');
                if (z && decided.zh) z.textContent = decided.zh;
                if (e && decided.en) e.textContent = decided.en;
            });
        };
        // 先隐藏当前已有入口，避免未登录/非作者看到
        targets().forEach((el) => { el.style.display = 'none'; });
        // 监听动态插入（如 dashboard 的「未认证」提示由 JS 注入）
        if (typeof MutationObserver !== 'undefined') {
            const mo = new MutationObserver(() => apply());
            mo.observe(document.body, { childList: true, subtree: true });
        }
        if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
        supabaseClient.auth.getSession().then(({ data }) => {
            const session = data && data.session;
            if (!session) { decided = { mode: 'hide' }; apply(); return; } // 未登录 → 隐藏
            supabaseClient.from('profiles').select('authorlevel, is_author').eq('id', session.user.id).single()
                .then(({ data: profile }) => {
                    const isAuthor = !!(profile && (Number(profile.authorlevel) > 0 || profile.is_author));
                    decided = isAuthor
                        ? { mode: 'show', zh: '🏅 为自己申请', en: '🏅 For Myself' }
                        : { mode: 'show', zh: '🏅 成为创作者', en: '🏅 Become Creator' };
                    apply();
                })
                .catch(() => { decided = { mode: 'hide' }; apply(); });
        }).catch(() => { decided = { mode: 'hide' }; apply(); });
    }

    // ==================== 设置面板 / 自定义背景 / 自定义排版（4.0.1） ====================
    function tr(zh, en) { return getLang() === 'en' ? en : zh; }
    function readJSON(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
    function toast(message, ms) {
        ms = ms || 3200;
        let el = document.getElementById('leleleToast');
        if (!el) { el = document.createElement('div'); el.id = 'leleleToast'; el.className = 'lelele-toast'; document.body.appendChild(el); }
        el.textContent = message; el.classList.add('active');
        clearTimeout(el._timer); el._timer = setTimeout(() => el.classList.remove('active'), ms);
    }

    const ACCENT_PRESETS = ['#4f46e5', '#0071e3', '#0a84ff', '#10b981', '#f59e0b', '#ff375f'];
    const BG_KEY = 'lelele_custom_bg';
    const BG_EXPIRY_DAYS = 14;
    const FONT_KEY = 'lelele_font_scale';
    const THEME_KEY = 'lelele_accent';

    // 作者数据：唯一定义处已移到 boot.js（head 同步加载，dashboard 等页也能用）。
    // 这里只在 boot.js 缺席时提供兼容实现——game/ 子目录页面通过绝对 URL 直接加载
    // common.js、不加载 boot.js，必须保证它们仍能拿到 fetchAuthors。
    // 契约不变：surge 权威主源（5s 超时）+ 同域 authors/index.json 兜底，返回数组或 null。
    if (typeof window.fetchAuthors !== 'function') {
        window.fetchAuthors = async function () {
            const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
            const timer = ctrl ? setTimeout(() => ctrl.abort(), 5000) : null;
            try {
                const r = await fetch('https://authors.surge.sh/authors.json', ctrl ? { signal: ctrl.signal } : {});
                if (r.ok) return await r.json();
            } catch (e) {} finally { if (timer) clearTimeout(timer); }
            try {
                const r = await window.leleleFetch('authors/index.json');
                if (r.ok) return await r.json();
            } catch (e) {}
            return null;
        };
    }
    // 首屏即时渲染 / 异步校正接口：同样只在缺席时补一份等价实现
    if (typeof window.fetchAuthorsLocal !== 'function') {
        window.fetchAuthorsLocal = async function () {
            try {
                const r = await window.leleleFetch('authors/index.json');
                return r.ok ? await r.json() : null;
            } catch (e) { return null; }
        };
    }
    if (typeof window.fetchAuthorsFresh !== 'function') {
        window.fetchAuthorsFresh = async function () {
            const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
            const timer = ctrl ? setTimeout(() => ctrl.abort(), 5000) : null;
            try {
                const r = await fetch('https://authors.surge.sh/authors.json', ctrl ? { signal: ctrl.signal } : {});
                return r.ok ? await r.json() : null;
            } catch (e) { return null; } finally { if (timer) clearTimeout(timer); }
        };
    }

    // 换色：同时驱动 --primary 与 --accent（站内两类令牌都在用，只改一个会"看起来没用"）
    function applyAccent(color) {
        if (!color) return;
        document.documentElement.style.setProperty('--primary', color);
        document.documentElement.style.setProperty('--accent', color);
    }
    function initAccent() { applyAccent(localStorage.getItem(THEME_KEY)); }

    // 字号：--ui-scale 令牌 + body zoom（站内文本多为 px 定值，zoom 保证立即生效）
    function getFontScale() { const v = parseFloat(localStorage.getItem(FONT_KEY)); return Number.isFinite(v) && v >= 0.85 && v <= 1.3 ? v : 1; }
    function applyFontScale(scale) {
        document.documentElement.style.setProperty('--ui-scale', String(scale));
        if (document.body) document.body.style.zoom = scale === 1 ? '' : String(scale);
    }
    function initFontScale() { applyFontScale(getFontScale()); }

    function removeBgLayer() { const el = document.getElementById('customBgLayer'); if (el) el.remove(); }
    function applyBgLayer(cfg) {
        removeBgLayer();
        const el = document.createElement('div'); el.id = 'customBgLayer';
        const dim = (typeof cfg.dim === 'number') ? cfg.dim : 0.45;
        const dark = document.documentElement.classList.contains('dark-mode');
        el.style.cssText = 'position:fixed;inset:0;z-index:-2;background:#0f172a url(\'' + cfg.dataUrl + '\') center/cover no-repeat;pointer-events:none;';
        if (!cfg.hasBorder) el.style.boxShadow = 'inset 0 0 0 1px rgba(148,163,184,0.22)';
        const overlay = document.createElement('div');
        const rgb = dark ? '15,23,42' : '245,245,247';
        const top = dark ? dim : Math.min(0.9, dim + 0.18);
        const bottom = dark ? Math.min(0.96, dim + 0.2) : 0.94;
        overlay.style.cssText = 'position:absolute;inset:0;background:linear-gradient(180deg, rgba(' + rgb + ',' + top + ') 0%, rgba(' + rgb + ',' + bottom + ') 100%);';
        el.appendChild(overlay); document.body.appendChild(el);
    }
    function analyzeImage(img) {
        const maxW = 1600;
        let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        const scale = Math.min(1, maxW / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        const s = document.createElement('canvas'); s.width = 64; s.height = 64;
        const sx = s.getContext('2d'); sx.drawImage(c, 0, 0, 64, 64);
        const d = sx.getImageData(0, 0, 64, 64).data;
        const lum = new Float64Array(4096); let sum = 0;
        for (let i = 0; i < d.length; i += 4) { const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; lum[i >> 2] = l; sum += l; }
        const mean = sum / 4096; let varSum = 0;
        for (let i = 0; i < 4096; i++) varSum += (lum[i] - mean) * (lum[i] - mean);
        const variance = varSum / 4096; let edge = 0;
        for (let y = 1; y < 63; y++) for (let x = 1; x < 63; x++) { const idx = y * 64 + x; const g = Math.abs(lum[idx - 1] - lum[idx + 1]) + Math.abs(lum[idx - 64] - lum[idx + 64]); if (g > 55) edge++; }
        const busy = Math.min(1, (variance / 120) * 1.6 + (edge / 3844) * 2.4);
        const dim = 0.22 + busy * 0.5;
        const get = (x, y) => lum[y * 64 + x];
        const ring = [], inner = [];
        for (let x = 0; x < 64; x++) { ring.push(get(x, 2), get(x, 61)); }
        for (let y = 0; y < 64; y++) { ring.push(get(2, y), get(61, y)); }
        for (let y = 10; y < 54; y++) for (let x = 10; x < 54; x++) inner.push(get(x, y));
        const avg = (a) => a.reduce((s2, v) => s2 + v, 0) / a.length;
        const sd = (a, m) => { let s2 = 0; for (const v of a) s2 += (v - m) * (v - m); return Math.sqrt(s2 / a.length); };
        const rAvg = avg(ring), iAvg = avg(inner);
        const hasBorder = Math.abs(rAvg - iAvg) > 22 && sd(ring, rAvg) < sd(inner, iAvg) * 1.4;
        return { dim, hasBorder, canvas: c };
    }
    function processCustomBg(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type || file.type.indexOf('image/') !== 0) return reject(new Error(tr('请上传图片文件', 'Please upload an image')));
            const reader = new FileReader();
            reader.onerror = () => reject(new Error(tr('读取失败', 'Failed to read file')));
            reader.onload = () => {
                const img = new Image();
                img.onerror = () => reject(new Error(tr('图片解析失败', 'Failed to decode image')));
                img.onload = () => {
                    try {
                        const r = analyzeImage(img);
                        const maxE = 1600; const sc = Math.min(1, maxE / Math.max(r.canvas.width, r.canvas.height));
                        const out = document.createElement('canvas'); out.width = Math.round(r.canvas.width * sc); out.height = Math.round(r.canvas.height * sc);
                        out.getContext('2d').drawImage(r.canvas, 0, 0, out.width, out.height);
                        const dataUrl = out.toDataURL('image/jpeg', 0.82);
                        const cfg = { dataUrl, hasBorder: r.hasBorder, dim: r.dim, setAt: Date.now() };
                        try { localStorage.setItem(BG_KEY, JSON.stringify(cfg)); } catch (e2) { reject(new Error(tr('本地存储空间不足', 'Local storage is full'))); return; }
                        applyBgLayer(cfg); resolve(cfg);
                    } catch (e3) { reject(e3); }
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }
    function initCustomBg() {
        const cfg = readJSON(BG_KEY);
        if (!cfg || !cfg.dataUrl) return;
        if (Date.now() - cfg.setAt > BG_EXPIRY_DAYS * 864e5) {
            try { localStorage.removeItem(BG_KEY); } catch (e) {}
            removeBgLayer();
            toast(tr('自定义背景已 14 天到期，已恢复默认背景', 'Your custom background expired (14 days) and was reset'));
            return;
        }
        applyBgLayer(cfg);
    }
    function clearCustomBg() { try { localStorage.removeItem(BG_KEY); } catch (e) {} removeBgLayer(); toast(tr('已恢复默认背景', 'Default background restored')); }

    function buildSettingsPanel() {
        let panel = document.getElementById('leleleSettings');
        if (panel) return panel;
        panel = document.createElement('div'); panel.id = 'leleleSettings'; panel.className = 'lelele-settings-panel';
        panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', tr('设置', 'Settings'));
        const scale = getFontScale();
        const sizeSlider = (k, label) => {
            let v = 1; try { v = parseFloat(localStorage.getItem('lelele_sz_' + k)); } catch (e) {}
            if (!Number.isFinite(v) || v < 0.8 || v > 1.4) v = 1;
            return '<div class="lelele-size-row"><span>' + label + '</span><input type="range" class="lelele-size-range" data-key="' + k + '" min="0.8" max="1.4" step="0.05" value="' + v + '"><span class="lelele-size-val">' + Math.round(v * 100) + '%</span></div>';
        };
        panel.innerHTML =
            '<div class="lelele-settings-backdrop"></div>' +
            '<div class="lelele-settings-card">' +
                '<div class="lelele-settings-head"><h3>' + tr('设置', 'Settings') + '</h3><button class="lelele-settings-close" aria-label="close">×</button></div>' +
                '<div class="lelele-settings-section">' +
                    '<div class="lelele-settings-label">' + tr('主题色', 'Accent color') + '</div>' +
                    '<div class="lelele-accent-row">' + ACCENT_PRESETS.map((c) => '<button class="lelele-accent-dot" data-accent="' + c + '" style="background:' + c + '" aria-label="' + c + '"></button>').join('') + '</div>' +
                '</div>' +
                '<div class="lelele-settings-section">' +
                    '<div class="lelele-settings-label"><span>' + tr('字号', 'Font size') + '</span><span class="lelele-font-val">' + Math.round(scale * 100) + '%</span></div>' +
                    '<div class="lelele-font-row">' +
                        '<button class="lelele-font-btn" data-step="-1">A−</button>' +
                        '<input type="range" class="lelele-font-range" min="0.85" max="1.3" step="0.05" value="' + scale + '">' +
                        '<button class="lelele-font-btn" data-step="1">A+</button>' +
                    '</div>' +
                '</div>' +
                '<div class="lelele-settings-section">' +
                    '<div class="lelele-settings-label">' + tr('自定义背景', 'Custom background') + '</div>' +
                    '<p class="lelele-settings-hint">' + tr('每 14 天需重新上传一次，过期自动恢复默认', 'Re-upload every 14 days; resets automatically after expiry') + '</p>' +
                    '<div class="lelele-bg-row">' +
                        '<label class="lelele-bg-upload">' + tr('上传图片', 'Upload image') + '<input type="file" accept="image/*" class="lelele-bg-input" hidden></label>' +
                        '<button class="lelele-bg-clear">' + tr('恢复默认', 'Reset') + '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="lelele-settings-section">' +
                    '<div class="lelele-settings-label">' + tr('游戏方块大小', 'Game card size') + '</div>' +
                    sizeSlider('card', tr('游戏方块', 'Game cards')) +
                '</div>' +
            '</div>';
        document.body.appendChild(panel);
        panel.querySelector('.lelele-settings-backdrop').addEventListener('click', closeSettings);
        panel.querySelector('.lelele-settings-close').addEventListener('click', closeSettings);
        panel.querySelectorAll('.lelele-accent-dot').forEach((dot) => dot.addEventListener('click', () => {
            applyAccent(dot.dataset.accent); localStorage.setItem(THEME_KEY, dot.dataset.accent);
            panel.querySelectorAll('.lelele-accent-dot').forEach((d) => d.classList.toggle('active', d === dot));
        }));
        const range = panel.querySelector('.lelele-font-range'); const val = panel.querySelector('.lelele-font-val');
        const setScale = (v) => {
            v = Math.min(1.3, Math.max(0.85, Math.round(v * 20) / 20));
            applyFontScale(v); localStorage.setItem(FONT_KEY, String(v));
            range.value = v; val.textContent = Math.round(v * 100) + '%';
        };
        range.addEventListener('input', () => setScale(parseFloat(range.value)));
        panel.querySelectorAll('.lelele-font-btn').forEach((b) => b.addEventListener('click', () => setScale(getFontScale() + (b.dataset.step === '1' ? 0.05 : -0.05))));
        panel.querySelector('.lelele-bg-input').addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0]; if (!file) return;
            try { await processCustomBg(file); toast(tr('背景已更新', 'Background updated')); }
            catch (err) { toast(err.message || tr('上传失败', 'Upload failed')); }
        });
        panel.querySelector('.lelele-bg-clear').addEventListener('click', clearCustomBg);
        panel.querySelectorAll('.lelele-size-range').forEach((r) => {
            r.addEventListener('input', () => {
                const key = r.dataset.key, v = parseFloat(r.value);
                document.documentElement.style.setProperty(SIZE_KEYS[key], String(v));
                try { localStorage.setItem('lelele_sz_' + key, String(v)); } catch (e) {}
                const lab = r.parentElement.querySelector('.lelele-size-val'); if (lab) lab.textContent = Math.round(v * 100) + '%';
            });
        });
        const cur = localStorage.getItem(THEME_KEY);
        if (cur) panel.querySelectorAll('.lelele-accent-dot').forEach((d) => d.classList.toggle('active', d.dataset.accent === cur));
        return panel;
    }
    function openSettings() { buildSettingsPanel().classList.add('active'); }
    function closeSettings() { const p = document.getElementById('leleleSettings'); if (p) p.classList.remove('active'); }
    function initSettings() {
        const btn = document.getElementById('openSettingsBtn'); if (btn) btn.addEventListener('click', openSettings);
        initAccent(); initFontScale();
        applySizes();
    }

    // ===== 板块大小（仅保留「游戏方块」可调，CSS 变量驱动）=====
    const SIZE_KEYS = { card: '--sz-card' };
    function applySizes() {
        Object.keys(SIZE_KEYS).forEach((k) => {
            let v = 1; try { v = parseFloat(localStorage.getItem('lelele_sz_' + k)); } catch (e) {}
            if (!Number.isFinite(v) || v < 0.8 || v > 1.4) v = 1;
            document.documentElement.style.setProperty(SIZE_KEYS[k], String(v));
        });
    }

    // ==================== 初始化调用 ====================
    leleleOnReady( () => {
        if (isGamePage) {
            document.body.classList.add('is-game-page');
        }
        initTheme();
        initActivityTheme();
        initSlideHint();
        injectFooter();
        injectFloatingTools();
        initAnnouncements();
        
        // 启动新增功能
        initDirectLinkTracker();
        initMainSiteAuth();
        initApplyCertGating();
        initIslandNav();
        initCustomBg();
        initSettings();

        const currentLang = getLang();
        document.querySelectorAll('.lang-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.langBtn === currentLang); });
    });

    // ==================== 注册 PWA Service Worker ====================
    // 4.0.12：不再挂在 window.load（外部脚本曾把它无限推迟，导致 SW 迟迟注册不上、
    // 旧缓存清不掉），改为 DOM 就绪即注册；并移除自动 location.reload() ——
    // 升版时反复刷新正是"刷新后页面卡住"的元凶之一。新 SW 用 skipWaiting +
    // clients.claim 立即接管，配合 stale-while-revalidate，无需刷新即可用上新缓存。
    if ('serviceWorker' in navigator && window.location.hostname === 'game.leleleling.site') {
        leleleOnReady(function () {
            navigator.serviceWorker.register('/sw.js').catch(function () {});
        });
    }

    // ==================== 鼠标跟随聚光（Spotlight，React Bits 风格） ====================
    (function initSpotlight() {
        document.addEventListener('pointermove', function (e) {
            const el = e.target && e.target.closest ? e.target.closest('.action-btn, .btn-primary, .fx-spotlight') : null;
            if (!el) return;
            const r = el.getBoundingClientRect();
            el.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
            el.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
        }, { passive: true });
    })();

})();
