(function() {
    'use strict';

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
        fetch(`${MAIN_SITE_URL}/lelegame_data.json`)
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
    async function initMainSiteAuth() {
        if (isGamePage) return;
        if (typeof supabaseClient === 'undefined' || !supabaseClient) return;

        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            
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
                    const { data: profile } = await supabaseClient.from('profiles').select('avatar_url, display_name').eq('id', session.user.id).single();
                    
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
                    
                    if (profile && profile.avatar_url) {
                        userBtn.innerHTML = `<img src="${profile.avatar_url}" style="width:100%; height:100%; object-fit:cover;">`;
                    } else {
                        userBtn.innerHTML = '👤';
                        userBtn.style.fontSize = '1.2rem';
                        userBtn.style.background = 'var(--card-border)';
                    }
                    rightActions.insertBefore(userBtn, rightActions.firstChild);
                }
            }

            // 2. 拦截投稿按钮
            const submitBtn = document.getElementById('openSubmitGuide');
            if (submitBtn) {
                // 移除原有的 onclick 绑定，改用自定义拦截
                const originalOnclick = submitBtn.onclick;
                submitBtn.onclick = (e) => {
                    if (!session) {
                        e.preventDefault();
                        const isEn = getLang() === 'en';
                        alert(isEn ? 'Publishing games requires an account. Redirecting to login...' : '发布游戏需要先注册/登录开发者账号，正在跳转登录...');
                        window.location.href = 'login.html';
                        return;
                    }
                    if (originalOnclick) originalOnclick.call(submitBtn, e);
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
                const specRes = await fetch(`${MAIN_SITE_URL}/special_common.json?t=${Date.now()}`);
                if (specRes.ok) {
                    const specData = await specRes.json();
                    const host = window.location.hostname;
                    const path = window.location.pathname;
                    if (specData.skip_effects_domains && specData.skip_effects_domains.includes(host)) skipEffects = true;
                    if (specData.skip_effects_paths && specData.skip_effects_paths.some(p => path.includes(p))) skipEffects = true;
                }
            } catch (err) {}

            const res = await fetch(`${MAIN_SITE_URL}/activity_whole.json?t=${Date.now()}`);
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
            <a href="${MAIN_SITE_URL}/privacy.html${suffix}">${lang === 'zh' ? '隐私政策' : 'Privacy'}</a> ｜
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

    async function initAnnouncements() {
        try {
            const res = await fetch(`${MAIN_SITE_URL}/announcements.json`);
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
            if (hasUnread) showUnreadModal(top3Ids);

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
                const contentZh = item.content_zh || item.content || '';
                const contentEn = item.content_en || item.content || contentZh;
                const title = lang === 'en' ? titleEn : titleZh;
                const rawContent = lang === 'en' ? contentEn : contentZh;
                const formattedContent = rawContent ? rawContent.replace(/\n/g, '<br>') : '';
                return `
                    <div class="announce-card" data-id="${item.id}">
                        <button class="announce-close" onclick="window.closeGlobalAnnounce('${item.id}', this)">×</button>
                        <div class="announce-top">
                            <div class="announce-name">${escapeHtml(title)}</div>
                            <div class="announce-date">${escapeHtml(item.publishDate)}</div>
                        </div>
                        <div class="announce-content">${formattedContent}</div>
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

    // ==================== 初始化调用 ====================
    document.addEventListener('DOMContentLoaded', () => {
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

        const currentLang = getLang();
        document.querySelectorAll('.lang-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.langBtn === currentLang); });
    });

    // ==================== 注册 PWA Service Worker ====================
    if ('serviceWorker' in navigator && window.location.hostname === 'game.leleleling.site') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch((err) => {});
        });
    }

})();
