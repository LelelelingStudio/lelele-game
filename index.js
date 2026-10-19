/**
 * 了了了游 - 前端核心逻辑
 * 包含：多语言切换、公告加载、游戏数据渲染、快捷弹窗、收藏系统、投稿流程
 */

// ==================== 全局工具函数 ====================

/**
 * 防止 XSS 注入的 HTML 转义函数
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * 弹窗控制
 */
window.openModal = function(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
};

window.closeModal = function(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
};

// ==================== 多语言切换逻辑 ====================

window.setLang = function(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
    
    // 更新按钮激活状态
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.langBtn === lang);
    });
    
    // 存储到本地
    try {
        localStorage.setItem('lelele_lang', lang);
    } catch (e) {
        console.warn('无法保存语言设置', e);
    }

    // 更新页脚各协议链接的语言参数
    const suffix = lang === 'en' ? '?lang=en' : '';
    const linkRules = document.getElementById('linkRules');
    const linkPrivacy = document.getElementById('linkPrivacy');
    const linkCopyright = document.getElementById('linkCopyright');
    
    if (linkRules) linkRules.href = 'game_rules.html' + suffix;
    if (linkPrivacy) linkPrivacy.href = 'privacy.html' + suffix;
    if (linkCopyright) linkCopyright.href = 'copyright.html' + suffix;
};

// 页面初始化时检查语言状态
function initLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const storedLang = localStorage.getItem('lelele_lang');
    
    if (urlLang === 'en' || urlLang === 'zh') {
        setLang(urlLang);
    } else if (storedLang === 'en' || storedLang === 'zh') {
        setLang(storedLang);
    }
}

// ==================== 公告板块逻辑 ====================

async function loadAnnouncements() {
    try {
        const res = await fetch('announcements.json');
        if (!res.ok) return;
        let data = await res.json();
        
        const now = new Date().setHours(0, 0, 0, 0); // 今天 00:00:00
        
        // 1. 过滤有效公告（已发布且未过期）
        data = data.filter(item => {
            const pub = new Date(item.publishDate).getTime();
            const exp = new Date(item.expireDate).getTime();
            if (isNaN(pub) || isNaN(exp)) return false;
            return pub <= now && exp >= now;
        });
        
        // 2. 按发布时间倒序排列
        data.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
        
        // 3. 截取最多 3 条
        data = data.slice(0, 3);
        
        // 4. 渲染或隐藏
        if (data.length > 0) {
            renderAnnouncements(data);
        }
    } catch (e) {
        console.warn('公告加载失败:', e);
    }
}

function renderAnnouncements(list) {
    const container = document.getElementById('announcementsContainer');
    const listEl = document.getElementById('announcementsList');
    
    listEl.innerHTML = list.map(item => {
        const titleZh = item.title_zh || item.title || '';
        const titleEn = item.title_en || item.title || titleZh;
        const contentZh = item.content_zh || item.content || '';
        const contentEn = item.content_en || item.content || contentZh;
        
        return `
            <div class="announce-card">
                <div class="announce-top">
                    <div class="announce-name">
                        <span class="zh-inline">${escapeHtml(titleZh)}</span>
                        <span class="en-inline">${escapeHtml(titleEn)}</span>
                    </div>
                    <div class="announce-date">${escapeHtml(item.publishDate)}</div>
                </div>
                <div class="announce-content">
                    <span class="zh-inline">${escapeHtml(contentZh)}</span>
                    <span class="en-inline">${escapeHtml(contentEn)}</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.style.display = 'block';
}

// ==================== 游戏数据加载与渲染 ====================

let gameData = [];
let currentType = 'local';
let searchKeyword = '';
let searchTimer = null;

async function loadGames() {
    const grid = document.getElementById('gamesGrid');
    const status = document.getElementById('statusMessage');
    
    // 显示骨架屏
    grid.innerHTML = Array.from({ length: 8 }).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-icon"></div>
            <div class="skeleton-line"></div>
        </div>
    `).join('');
    status.style.display = 'none';

    try {
        const res = await fetch('lelegame_data.json');
        if (res.ok) {
            gameData = await res.json();
        } else {
            throw new Error('HTTP ' + res.status);
        }
    } catch (e) {
        grid.innerHTML = '';
        status.style.display = 'block';
        status.innerHTML = `
            <span class="zh-inline">数据加载失败，请刷新重试。</span>
            <span class="en-inline">Failed to load data.</span>
        `;
        return;
    }
    
    renderGames();
}

function renderGames() {
    const grid = document.getElementById('gamesGrid');
    const status = document.getElementById('statusMessage');
    grid.innerHTML = '';

    const filtered = gameData.filter(g => {
        const matchType = g.type === currentType;
        const matchSearch = !searchKeyword || g.name.toLowerCase().includes(searchKeyword.toLowerCase());
        return matchType && matchSearch;
    });

    if (filtered.length === 0) {
        status.style.display = 'block';
        status.innerHTML = `
            <span class="zh-inline">暂无游戏，敬请期待 ✨</span>
            <span class="en-inline">No games yet ✨</span>
        `;
    } else {
        status.style.display = 'none';
        filtered.forEach(g => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.setAttribute('tabindex', '0'); // 支持键盘聚焦
            card.innerHTML = `
                <div class="game-icon">${g.icon || '🎮'}</div>
                <div class="game-name">${escapeHtml(g.name)}</div>
            `;
            card.onclick = () => showPreview(g);
            // 键盘支持：回车打开
            card.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    showPreview(g);
                }
            };
            grid.appendChild(card);
        });
    }
}

// 搜索绑定
document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        searchKeyword = e.target.value;
        renderGames();
    }, 200);
});

// 分类切换绑定
document.getElementById('typeNav').addEventListener('click', (e) => {
    const btn = e.target.closest('.type-btn');
    if (!btn) return;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentType = btn.dataset.type;
    renderGames();
});

// ==================== 游戏预览弹窗与收藏 ====================

let currentPreviewGame = null;

function showPreview(game) {
    currentPreviewGame = game;
    
    // 填充数据
    document.getElementById('prevIcon').textContent = game.icon || '🎮';
    document.getElementById('prevName').textContent = game.name;
    
    let tagsHtml = '';
    if (game.category) {
        tagsHtml += `<span class="preview-tag">${escapeHtml(game.category)}</span>`;
    }
    if (game.ageRating) {
        tagsHtml += `<span class="preview-tag age">${escapeHtml(game.ageRating)}</span>`;
    }
    document.getElementById('prevTags').innerHTML = tagsHtml;
    
    // 绑定详情按钮
    document.getElementById('btnDetail').onclick = () => {
        window.location.href = `game.html?id=${game.id}`;
    };
    
    // 绑定直接游玩按钮
    document.getElementById('btnPlay').onclick = () => {
        if (game.url) {
            window.open(game.url, '_blank', 'noopener,noreferrer');
        } else {
            alert('该游戏暂无可用链接。');
        }
    };
    
    // 更新收藏按钮状态
    updateFavUI(game.id);
    openModal('gamePreview');
}

// 获取收藏列表
function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem('lelele_favs') || '[]');
    } catch (e) {
        return [];
    }
}

// 更新预览弹窗的收藏按钮 UI
function updateFavUI(gameId) {
    const favs = getFavorites();
    const isFav = favs.includes(String(gameId));
    const btn = document.getElementById('btnFav');
    
    if (isFav) {
        btn.innerHTML = '🌟 已收藏';
        btn.classList.add('fav-active');
    } else {
        btn.innerHTML = '⭐ 收藏';
        btn.classList.remove('fav-active');
    }
}

// 切换收藏状态
window.toggleFavFromPreview = function() {
    if (!currentPreviewGame) return;
    
    const gameId = String(currentPreviewGame.id);
    let favs = getFavorites();
    
    if (favs.includes(gameId)) {
        favs = favs.filter(id => id !== gameId);
    } else {
        favs.push(gameId);
    }
    
    try {
        localStorage.setItem('lelele_favs', JSON.stringify(favs));
    } catch (e) {
        console.warn('无法保存收藏', e);
    }
    
    updateFavUI(gameId);
};

// ==================== 投稿流程逻辑 ====================

function initSubmitFlow() {
    // 1. 须知
    document.getElementById('openSubmitGuide').onclick = () => {
        document.getElementById('chkGuide').checked = false;
        document.getElementById('chkGuideEn').checked = false;
        document.getElementById('btnToStep2').disabled = true;
        openModal('stepGuide');
    };
    
    // 两个复选框控制按钮状态
    const chkGuide = document.getElementById('chkGuide');
    const chkGuideEn = document.getElementById('chkGuideEn');
    const btnToStep2 = document.getElementById('btnToStep2');
    
    chkGuide.onchange = chkGuideEn.onchange = (e) => {
        btnToStep2.disabled = !e.target.checked;
    };
    
    btnToStep2.onclick = () => {
        closeModal('stepGuide');
        openModal('stepAuth');
    };

    // 2. 授权
    const chkAuth = document.getElementById('chkAuth');
    const chkAuthEn = document.getElementById('chkAuthEn');
    const btnToStep3 = document.getElementById('btnToStep3');
    
    chkAuth.onchange = chkAuthEn.onchange = (e) => {
        btnToStep3.disabled = !e.target.checked;
    };
    
    btnToStep3.onclick = () => {
        closeModal('stepAuth');
        openModal('stepForm');
        restoreDraft();
    };

    // 3. 表单交互
    document.querySelectorAll('.radio-group').forEach(group => {
        group.addEventListener('click', (e) => {
            if (e.target.classList.contains('radio-btn')) {
                group.querySelectorAll('.radio-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // 切换方式时显示/隐藏 URL 输入框
                if (group.id === 'radMethod') {
                    document.getElementById('groupUrl').style.display = e.target.dataset.val === 'link' ? 'block' : 'none';
                }
                saveDraft();
            }
        });
    });
    
    // 输入时保存草稿
    ['inName', 'inIcon', 'inAuthor', 'inEmail', 'inVersion', 'inIntro', 'inUrl'].forEach(id => {
        document.getElementById(id).addEventListener('input', saveDraft);
    });

    // 4. 跳转 Tally
    document.getElementById('btnToTally').onclick = () => {
        if (!document.getElementById('preForm').reportValidity()) return;
        
        const p = new URLSearchParams();
        p.append('you-xi-ming-cheng', document.getElementById('inName').value);
        p.append('you-xi-tu-biao', document.getElementById('inIcon').value);
        p.append('zuo-zhe-shu-ming', document.getElementById('inAuthor').value);
        p.append('lian-xi-you-xiang', document.getElementById('inEmail').value);
        p.append('ban-ben-hao', document.getElementById('inVersion').value);
        p.append('yi-ju-hua-jian-jie', document.getElementById('inIntro').value);
        p.append('you-xi-fen-lei', document.querySelector('#radCategory .active').dataset.val);
        p.append('shi-ling-fen-ji', document.querySelector('#radAge .active').dataset.val);
        p.append('tou-gao-fang-shi', document.querySelector('#radMethod .active').dataset.val);
        
        if (document.querySelector('#radMethod .active').dataset.val === 'link') {
            p.append('you-xi-lian-jie', document.getElementById('inUrl').value);
        }

        const finalUrl = `https://tally.so/embed/7XlY69?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1&${p.toString()}`;
        document.getElementById('tallyContainer').innerHTML = `
            <iframe data-tally-src="${finalUrl}" loading="lazy" width="100%" height="800" frameborder="0"></iframe>
        `;
        
        if (typeof Tally !== 'undefined') Tally.loadEmbeds();
        closeModal('stepForm');
        openModal('stepTally');
    };
}

// 保存草稿
function saveDraft() {
    const data = {
        name: document.getElementById('inName').value,
        icon: document.getElementById('inIcon').value,
        author: document.getElementById('inAuthor').value,
        email: document.getElementById('inEmail').value,
        version: document.getElementById('inVersion').value,
        intro: document.getElementById('inIntro').value,
        url: document.getElementById('inUrl').value,
        cat: document.querySelector('#radCategory .active').dataset.val,
        age: document.querySelector('#radAge .active').dataset.val,
        method: document.querySelector('#radMethod .active').dataset.val
    };
    try {
        localStorage.setItem('lelele_draft', JSON.stringify(data));
    } catch (e) {
        console.warn('无法保存草稿', e);
    }
}

// 恢复草稿
function restoreDraft() {
    const str = localStorage.getItem('lelele_draft');
    if (!str) return;
    
    try {
        const data = JSON.parse(str);
        if (data.name) document.getElementById('inName').value = data.name;
        if (data.icon) document.getElementById('inIcon').value = data.icon;
        if (data.author) document.getElementById('inAuthor').value = data.author;
        if (data.email) document.getElementById('inEmail').value = data.email;
        if (data.version) document.getElementById('inVersion').value = data.version;
        if (data.intro) document.getElementById('inIntro').value = data.intro;
        if (data.url) document.getElementById('inUrl').value = data.url;
        
        const setRad = (id, val) => {
            document.querySelectorAll(`#${id} .radio-btn`).forEach(b => {
                b.classList.toggle('active', b.dataset.val === val);
            });
        };
        
        if (data.cat) setRad('radCategory', data.cat);
        if (data.age) setRad('radAge', data.age);
        if (data.method) {
            setRad('radMethod', data.method);
            document.getElementById('groupUrl').style.display = data.method === 'link' ? 'block' : 'none';
        }
    } catch (e) {
        console.warn('草稿解析失败', e);
    }
}

// ==================== 页面加载完成后执行 ====================

document.addEventListener('DOMContentLoaded', () => {
    // 1. 处理 URL 参数（Tally 提交成功返回）
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('submitted') === '1') {
        localStorage.removeItem('lelele_draft');
        alert('提交成功！草稿已清理。\nSubmitted successfully! Draft cleared.');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // 2. 初始化多语言
    initLanguage();
    
    // 3. 加载数据
    loadGames();
    loadAnnouncements();
    
    // 4. 绑定投稿流程
    initSubmitFlow();
});
