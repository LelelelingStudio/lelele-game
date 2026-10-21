(function() {
    'use strict';

    // ==================== 全局配置 ====================
    const GAME_PATH_KEY = '/game/';
    const isGamePage = window.location.pathname.includes(GAME_PATH_KEY);

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

    // ==================== 深色模式逻辑 ====================
    function initTheme() {
        const savedTheme = localStorage.getItem('lelele_theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark-mode');
        }

        // 提供全局切换接口
        window.toggleTheme = function() {
            const isDark = document.documentElement.classList.toggle('dark-mode');
            localStorage.setItem('lelele_theme', isDark ? 'dark' : 'light');
        };
    }

    // ==================== Footer 注入逻辑 ====================
    function injectFooter() {
        if (document.querySelector('.common-footer')) return; // 防止重复注入
        const lang = getLang();
        const suffix = lang === 'en' ? '?lang=en' : '';
        
        const footer = document.createElement('footer');
        footer.className = 'common-footer';
        footer.innerHTML = `
            © 2026 <span class="${lang === 'zh' ? 'zh-inline' : 'en-inline'}">了了了岭工作室 · 了了了游</span><span class="${lang === 'zh' ? 'en-inline' : 'zh-inline'}">Leleleling Studio · lelele Game</span> ｜
            <a href="game_rules.html${suffix}">${lang === 'zh' ? '游戏守则' : 'Rules'}</a> ｜
            <a href="privacy.html${suffix}">${lang === 'zh' ? '隐私政策' : 'Privacy'}</a> ｜
            <a href="copyright.html${suffix}">${lang === 'zh' ? '版权投诉' : 'Copyright'}</a>
        `;
        
        // 如果原本有 footer，就替换掉；没有就追加
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

        // 回到顶部逻辑
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) btnTop.classList.add('show');
            else btnTop.classList.remove('show');
        });
        btnTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

        // 反馈弹窗逻辑 (使用 Tally)
        btnFeedback.onclick = () => {
            if (typeof Tally !== 'undefined') {
                // 【注意】这里需要替换为你真实的 Tally 反馈表单 ID
                // 如果暂时没有，会弹出一个提示，并跳转到主页的反馈区
                try {
                    Tally.openPopup('你的反馈表单ID'); 
                } catch (e) {
                    alert(getLang() === 'en' ? 'Feedback form is being prepared.' : '反馈表单准备中，即将开放。');
                }
            } else {
                alert(getLang() === 'en' ? 'Feedback form loading...' : '反馈表单加载中，请稍后再试...');
            }
        };
    }

    // ==================== PWA 安装提示 ====================
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // 1分钟后提示安装
        setTimeout(() => {
            if (!deferredPrompt) return;
            
            // 检查是否已经提示过并点击了“不再提示”
            if (localStorage.getItem('lelele_pwa_dismissed') === 'true') return;

            const isEn = getLang() === 'en';
            
            // 动态创建一个底部悬浮的安装提示条
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

            // 处理安装点击
            document.getElementById('pwaInstallBtn').addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        pwaBanner.remove();
                    }
                    deferredPrompt = null;
                }
            });

            // 处理关闭点击
            document.getElementById('pwaCloseBtn').addEventListener('click', () => {
                pwaBanner.remove();
                localStorage.setItem('lelele_pwa_dismissed', 'true');
            });

        }, 60000);
    });

    // ==================== 公告核心逻辑 ====================
    let allValidAnnouncements = []; // 保存全局有效公告，方便切换语言时重新渲染

    async function initAnnouncements() {
        try {
            const res = await fetch('announcements.json');
            if (!res.ok) return;
            let allData = await res.json();
            
            const now = new Date().setHours(0, 0, 0, 0);
            
            // 1. 过滤出所有有效的公告
            allValidAnnouncements = allData.filter(item => {
                const pub = new Date(item.publishDate).getTime();
                const exp = new Date(item.expireDate).getTime();
                if (isNaN(pub) || isNaN(exp)) return false;
                return pub <= now && exp >= now;
            }).sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

            // 2. 取前 3 条作为首页展示和未读检测的标准
            const top3Data = allValidAnnouncements.slice(0, 3);

            // 3. 清理 LocalStorage 中的过期记录
            const readList = getStorage('lelele_read_announcements', []);
            const closedObj = getStorage('lelele_closed_announcements', {});
            const top3Ids = top3Data.map(a => a.id);

            // 如果已读列表里有不在前3的，清除掉
            const newReadList = readList.filter(id => top3Ids.includes(id));
            if (newReadList.length !== readList.length) {
                setStorage('lelele_read_announcements', newReadList);
            }

            // 清理关闭记录
            let closedChanged = false;
            for (let id in closedObj) {
                if (!top3Ids.includes(id)) {
                    delete closedObj[id];
                    closedChanged = true;
                }
            }
            if (closedChanged) setStorage('lelele_closed_announcements', closedObj);

            // 4. 渲染首页公告 (如果有对应的容器)
            renderIndexAnnouncements(top3Data, closedObj);

            // 5. 未读弹窗检测
            const hasUnread = top3Data.some(item => !newReadList.includes(item.id));
            if (hasUnread) {
                showUnreadModal(top3Ids);
            }

            // 6. 5分钟定时器：检查是否有关闭满 24 小时的公告
            setInterval(() => {
                const currentClosed = getStorage('lelele_closed_announcements', {});
                let changed = false;
                const nowTime = Date.now();
                
                for (let id in currentClosed) {
                    if (nowTime - currentClosed[id] > 24 * 60 * 60 * 1000) {
                        delete currentClosed[id];
                        changed = true;
                    }
                }
                if (changed) {
                    setStorage('lelele_closed_announcements', currentClosed);
                    // 重新渲染公告，让它重新出现
                    renderIndexAnnouncements(allValidAnnouncements.slice(0, 3), currentClosed);
                }
            }, 5 * 60 * 1000);

        } catch (e) {
            console.warn('公告加载失败:', e);
        }
    }

    // 单独抽离的首页公告渲染函数 (方便语言切换时调用)
    function renderIndexAnnouncements(top3Data, closedObj) {
        const listEl = document.getElementById('announcementsList');
        if (!listEl) return;
        
        // 确保容器状态
        const container = document.getElementById('announcementsContainer');
        
        const renderList = top3Data.filter(item => {
            const closeTime = closedObj[item.id];
            if (closeTime && (Date.now() - closeTime < 24 * 60 * 60 * 1000)) return false;
            return true;
        });

        if (renderList.length > 0) {
            if (container) container.style.display = 'block';
            const lang = getLang();
            
            listEl.innerHTML = renderList.map(item => {
                const titleZh = item.title_zh || item.title || '';
                const titleEn = item.title_en || item.title || titleZh;
                const contentZh = item.content_zh || item.content || '';
                const contentEn = item.content_en || item.content || contentZh;
                const title = lang === 'en' ? titleEn : titleZh;
                const content = lang === 'en' ? contentEn : contentZh;

                return `
                    <div class="announce-card" data-id="${item.id}">
                        <button class="announce-close" onclick="window.closeGlobalAnnounce('${item.id}', this)">×</button>
                        <div class="announce-top">
                            <div class="announce-name">${escapeHtml(title)}</div>
                            <div class="announce-date">${escapeHtml(item.publishDate)}</div>
                        </div>
                        <div class="announce-content">${escapeHtml(content)}</div>
                    </div>
                `;
            }).join('');
            
            // 增加“查看全部”按钮
            if (allValidAnnouncements.length > 0) {
                let viewAllBtn = document.getElementById('commonViewAllBtn');
                if (!viewAllBtn) {
                    viewAllBtn = document.createElement('button');
                    viewAllBtn.id = 'commonViewAllBtn';
                    viewAllBtn.className = 'common-btn-view-all';
                    viewAllBtn.onclick = () => openAllAnnounceModal(allValidAnnouncements);
                    listEl.parentNode.appendChild(viewAllBtn);
                }
                viewAllBtn.innerHTML = lang === 'en' ? 'View All Announcements ➔' : '查看全部公告 ➔';
            }
        } else {
            if (container) container.style.display = 'none';
        }
    }

    // ==================== 全局公告关闭逻辑 ====================
    window.closeGlobalAnnounce = function(id, btnEl) {
        const card = btnEl.closest('.announce-card');
        if (card) card.style.display = 'none';
        
        const closedObj = getStorage('lelele_closed_announcements', {});
        closedObj[id] = Date.now();
        setStorage('lelele_closed_announcements', closedObj);
    };

    // ==================== 未读弹窗逻辑 ====================
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

        // 游戏内15秒自动消失
        let autoCloseTimer;
        if (isGamePage) {
            autoCloseTimer = setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 15000);
        }

        document.getElementById('btnGoAnnounce').onclick = () => {
            // 记录已读
            const readList = getStorage('lelele_read_announcements', []);
            unreadIds.forEach(id => {
                if (!readList.includes(id)) readList.push(id);
            });
            setStorage('lelele_read_announcements', readList);
            
            // 如果不在首页，跳转新标签页
            if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
                window.open('index.html' + (isEn ? '?lang=en' : ''), '_blank');
            }
            overlay.parentNode.removeChild(overlay);
            clearTimeout(autoCloseTimer);
        };
    }

    // ==================== 全部公告弹窗 ====================
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
            const content = isEn ? (item.content_en || item.content) : (item.content_zh || item.content);
            detail.innerHTML = `
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(content)}</p>
            `;
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
        
        // 监听语言切换，重新注入 Footer 和 重新渲染公告
        const originalSetLang = window.setLang;
        window.setLang = function(lang) {
            if (originalSetLang) originalSetLang(lang);
            injectFooter();
            
            // 如果公告数据已加载，切换语言时重新渲染
            if (allValidAnnouncements.length > 0) {
                const closedObj = getStorage('lelele_closed_announcements', {});
                renderIndexAnnouncements(allValidAnnouncements.slice(0, 3), closedObj);
            }
        };
    });

    // ==================== 注册 PWA Service Worker ====================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then((reg) => {
                console.log('✅ PWA Service Worker 注册成功', reg.scope);
            }).catch((err) => {
                console.log('❌ PWA Service Worker 注册失败:', err);
            });
        });
    }

})();
