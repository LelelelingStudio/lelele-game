(function() {
    'use strict';

    // ==================== 全局配置 ====================
    const GAME_PATH_KEY = '/game/';
    // 兼容外网游戏：如果在独立域名，强制认作游戏页
    const isGamePage = window.location.pathname.includes(GAME_PATH_KEY) || window.forceGamePage === true;
    const MAIN_SITE_URL = 'https://game.leleleling.site'; // 主站绝对地址

    // Tally 表单 ID 配置
    const TALLY_FEEDBACK_ID_ZH = 'EqkbqB';
    const TALLY_FEEDBACK_ID_EN = 'Eqkb54';

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

    // ==================== 【核心】全局多语言切换 ====================
    window.setLang = function(lang) {
        document.documentElement.setAttribute('data-lang', lang);
        document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
        
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.langBtn === lang);
        });
        
        try { localStorage.setItem('lelele_lang', lang); } catch (e) {}

        injectFooter();
        
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
        if (oldFooter) {
            oldFooter.replaceWith(footer);
        } else {
            document.body.appendChild(footer);
        }
    }

    // ==================== 悬浮工具注入 ====================
    function injectFloatingTools() {
        if (document.querySelector('.common-float-tools')) return;
        
        const container = document.createElement('div');
        container.className = 'common-float-tools';
        container.innerHTML = `
            <button class="common-float-btn" id="commonBtnFeedback" title="意见反馈">💬</button>
            <button class="common-float-btn" id="commonBtnTop" title="回到顶部">⬆️</button>
        `;
        document.body.appendChild(container);

        const btnTop = document.getElementById('commonBtnTop');
        const btnFeedback = document.getElementById('commonBtnFeedback');

        // 【修复】让反馈按钮默认一直显示在右下角
        btnFeedback.classList.add('show');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) btnTop.classList.add('show');
            else btnTop.classList.remove('show');
        });
        btnTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

        // 【修改】接入中英双语的 Tally 弹窗
        btnFeedback.onclick = () => {
            const lang = getLang();
            const tallyId = lang === 'en' ? TALLY_FEEDBACK_ID_EN : TALLY_FEEDBACK_ID_ZH;

            if (typeof Tally !== 'undefined') {
                Tally.openPopup(tallyId);
            } else {
                // 如果当前页面未加载 Tally SDK，则动态加载后打开
                const script = document.createElement('script');
                script.src = 'https://tally.so/widgets/embed.js';
                script.onload = () => {
                    if (typeof Tally !== 'undefined') Tally.openPopup(tallyId);
                };
                script.onerror = () => {
                    alert(lang === 'en' ? 'Failed to load feedback form.' : '反馈表单加载失败，请检查网络。');
                };
                document.body.appendChild(script);
            }
        };
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
            pwaBanner.style.cssText = `
                position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
                background: var(--card-bg); backdrop-filter: blur(10px);
                border: 1px solid var(--card-border); border-radius: 16px;
                padding: 16px 24px; display: flex; align-items: center; gap: 16px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 9999;
                animation: slideUp 0.4s ease; max-width: 90%; width: 400px;
            `;
            pwaBanner.innerHTML = `
                <div style="font-size: 1.8rem;">📱</div>
                <div style="flex: 1; text-align: left;">
                    <div style="font-weight: 700; color: var(--text-main); font-size: 1rem; margin-bottom: 4px;">
                        ${isEn ? 'Install lelele Game' : '安装了了了游'}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
                        ${isEn ? 'Add to home screen for a better experience.' : '添加到主屏幕，享受更沉浸的体验。'}
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button id="pwaInstallBtn" style="background: var(--primary); color: #fff; border: none; padding: 6px 12px; border-radius: 20px; font-weight: 600; cursor: pointer; font-size: 0.85rem;">
                        ${isEn ? 'Install' : '立即安装'}
                    </button>
                    <button id="pwaCloseBtn" style="background: transparent; color: var(--text-muted); border: none; padding: 4px; cursor: pointer; font-size: 0.8rem;">
                        ${isEn ? 'Dismiss' : '下次再说'}
                    </button>
                </div>
            `;
            document.body.appendChild(pwaBanner);

            document.getElementById('pwaInstallBtn').addEventListener('click', () => {
                pwaBanner.remove();
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
                }
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

        } catch (e) {
            console.warn('公告加载失败:', e);
        }
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
            listEl.innerHTML = `
                <div class="empty-announce-box">
                    <span class="zh-inline">暂时没有新公告，或者公告已经被您全部关上啦。</span>
                    <span class="en-inline">No new announcements, or you have closed all of them.</span>
                </div>
            `;
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
            autoCloseTimer = setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 15000);
        }

        document.getElementById('btnGoAnnounce').onclick = () => {
            const readList = getStorage('lelele_read_announcements', []);
            unreadIds.forEach(id => {
                if (!readList.includes(id)) readList.push(id);
            });
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
            return `
                <div class="common-announce-menu-item ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <div class="common-announce-menu-title">${escapeHtml(title)}</div>
                    <div class="common-announce-menu-date">${item.publishDate}</div>
                </div>
            `;
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
        initTheme();
        injectFooter();
        injectFloatingTools();
        initAnnouncements();
        
        const currentLang = getLang();
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.langBtn === currentLang);
        });
    });

    // ==================== 注册 PWA Service Worker ====================
    if ('serviceWorker' in navigator && window.location.hostname === 'game.leleleling.site') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then((reg) => {
                console.log('✅ PWA Service Worker 注册成功', reg.scope);
            }).catch((err) => {
                console.log('❌ PWA Service Worker 注册失败:', err);
            });
        });
    }

})();
