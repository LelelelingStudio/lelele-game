/**
 * 了了了游 - 前端核心逻辑 (最终修复版)
 * 包含：多语言、数据加载、公告展示、快捷弹窗、收藏夹、投稿流程、Tally 双语完美预填
 */

// ==================== 全局工具函数 ====================
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

window.openModal = function(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
};

window.closeModal = function(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
};

// ==================== 多语言切换 ====================
window.setLang = function(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.langBtn === lang);
    });
    
    try {
        localStorage.setItem('lelele_lang', lang);
    } catch (e) {}

    // 更新页脚协议链接
    const suffix = lang === 'en' ? '?lang=en' : '';
    if (document.getElementById('linkRules')) document.getElementById('linkRules').href = 'game_rules.html' + suffix;
    if (document.getElementById('linkPrivacy')) document.getElementById('linkPrivacy').href = 'privacy.html' + suffix;
    if (document.getElementById('linkCopyright')) document.getElementById('linkCopyright').href = 'copyright.html' + suffix;
};

function initLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const storedLang = localStorage.getItem('lelele_lang');
    
    if (urlLang === 'en' || urlLang === 'zh') setLang(urlLang);
    else if (storedLang === 'en' || storedLang === 'zh') setLang(storedLang);
}

// ==================== 收藏夹逻辑 ====================
function getFavorites() {
    try { return JSON.parse(localStorage.getItem('lelele_favs') || '[]'); } 
    catch (e) { return []; }
}

function saveFavorites(favs) {
    try { localStorage.setItem('lelele_favs', JSON.stringify(favs)); } catch (e) {}
}

window.removeFavorite = function(id, event) {
    if (event) event.stopPropagation();
    let favs = getFavorites();
    favs = favs.filter(f => f !== String(id));
    saveFavorites(favs);
    renderFavoritesList();
};

document.getElementById('openFavBtn').addEventListener('click', () => {
    renderFavoritesList();
    openModal('favoritesModal');
});

function renderFavoritesList() {
    const container = document.getElementById('favListContainer');
    const favs = getFavorites();
    
    if (favs.length === 0) {
        container.innerHTML = `
            <div class="status-message">
                <span class="zh-inline">你还没有收藏任何游戏哦，快去逛逛吧！</span>
                <span class="en-inline">You have no favorites yet.</span>
            </div>
        `;
        return;
    }

    const favGames = gameData.filter(g => favs.includes(String(g.id)));

    if (favGames.length === 0) {
        container.innerHTML = `<div class="status-message">收藏的游戏似乎已下架。</div>`;
        return;
    }

    container.innerHTML = `<div class="fav-list">
        ${favGames.map(game => `
            <div class="fav-item" onclick="window.location.href='game.html?id=${game.id}'">
                <div class="fav-item-icon">${game.icon || '🎮'}</div>
                <div class="fav-item-info">
                    <div class="fav-item-name">${escapeHtml(game.name)}</div>
                    <div class="fav-item-cat">${escapeHtml(game.category || '未分类')}</div>
                </div>
                <button class="fav-item-remove" onclick="removeFavorite('${game.id}', event)" title="取消收藏">×</button>
            </div>
        `).join('')}
    </div>`;
}

// ==================== 公告加载 ====================
async function loadAnnouncements() {
    try {
        const res = await fetch('announcements.json');
        if (!res.ok) return;
        let data = await res.json();
        
        const now = new Date().setHours(0, 0, 0, 0);
        
        data = data.filter(item => {
            const pub = new Date(item.publishDate).getTime();
            const exp = new Date(item.expireDate).getTime();
            if (isNaN(pub) || isNaN(exp)) return false;
            return pub <= now && exp >= now;
        });
        
        data.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
        data = data.slice(0, 3);
        
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

// ==================== 游戏数据与渲染 ====================
let gameData = [];
let currentType = 'local';
let searchKeyword = '';
let searchTimer = null;

async function loadGames() {
    const grid = document.getElementById('gamesGrid');
    const status = document.getElementById('statusMessage');
    
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
        status.innerHTML = `<span class="zh-inline">数据加载失败，请刷新重试。</span><span class="en-inline">Failed to load data.</span>`;
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
        status.innerHTML = `<span class="zh-inline">暂无游戏，敬请期待 ✨</span><span class="en-inline">No games yet ✨</span>`;
    } else {
        status.style.display = 'none';
        filtered.forEach(g => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.setAttribute('tabindex', '0');
            card.innerHTML = `
                <div class="game-icon">${g.icon || '🎮'}</div>
                <div class="game-name">${escapeHtml(g.name)}</div>
            `;
            card.onclick = () => showPreview(g);
            card.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPreview(g); }
            };
            grid.appendChild(card);
        });
    }
}

document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { searchKeyword = e.target.value; renderGames(); }, 200);
});

document.getElementById('typeNav').addEventListener('click', (e) => {
    const btn = e.target.closest('.type-btn');
    if (!btn) return;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentType = btn.dataset.type;
    renderGames();
});

// ==================== 游戏快捷预览与收藏 ====================
let currentPreviewGame = null;

function showPreview(game) {
    currentPreviewGame = game;
    
    document.getElementById('prevIcon').textContent = game.icon || '🎮';
    document.getElementById('prevName').textContent = game.name;
    
    let tagsHtml = '';
    if (game.category) tagsHtml += `<span class="preview-tag">${escapeHtml(game.category)}</span>`;
    if (game.ageRating) tagsHtml += `<span class="preview-tag age">${escapeHtml(game.ageRating)}</span>`;
    document.getElementById('prevTags').innerHTML = tagsHtml;
    
    document.getElementById('btnDetail').onclick = () => {
        window.location.href = `game.html?id=${game.id}`;
    };
    
    document.getElementById('btnPlay').onclick = () => {
        if (game.url) window.open(game.url, '_blank', 'noopener,noreferrer');
    };
    
    updateFavUI(game.id);
    openModal('gamePreview');
}

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

window.toggleFavFromPreview = function() {
    if (!currentPreviewGame) return;
    
    const gameId = String(currentPreviewGame.id);
    let favs = getFavorites();
    
    if (favs.includes(gameId)) {
        favs = favs.filter(id => id !== gameId);
    } else {
        favs.push(gameId);
    }
    
    saveFavorites(favs);
    updateFavUI(gameId);
};

// ==================== 投稿流程逻辑 (含双语表单完美适配) ====================
function initSubmitFlow() {
    document.getElementById('openSubmitGuide').onclick = () => {
        document.getElementById('chkGuide').checked = false;
        document.getElementById('chkGuideEn').checked = false;
        document.getElementById('btnToStep2').disabled = true;
        openModal('stepGuide');
    };
    
    document.getElementById('chkGuide').onchange = document.getElementById('chkGuideEn').onchange = (e) => {
        document.getElementById('btnToStep2').disabled = !e.target.checked;
    };
    
    document.getElementById('btnToStep2').onclick = () => {
        closeModal('stepGuide');
        openModal('stepAuth');
    };

    document.getElementById('chkAuth').onchange = document.getElementById('chkAuthEn').onchange = (e) => {
        document.getElementById('btnToStep3').disabled = !e.target.checked;
    };
    
    document.getElementById('btnToStep3').onclick = () => {
        closeModal('stepAuth');
        openModal('stepForm');
        restoreDraft();
    };

    document.querySelectorAll('.radio-group').forEach(group => {
        group.addEventListener('click', (e) => {
            if (e.target.classList.contains('radio-btn')) {
                group.querySelectorAll('.radio-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                if (group.id === 'radMethod') {
                    document.getElementById('groupUrl').style.display = e.target.dataset.val === 'link' ? 'block' : 'none';
                }
                saveDraft();
            }
        });
    });
    
    ['inName', 'inIcon', 'inAuthor', 'inEmail', 'inVersion', 'inIntro', 'inUrl'].forEach(id => {
        document.getElementById(id).addEventListener('input', saveDraft);
    });

    document.getElementById('btnToTally').onclick = () => {
        if (!document.getElementById('preForm').reportValidity()) return;
        
        const isEn = document.documentElement.getAttribute('data-lang') === 'en';
        const p = new URLSearchParams();
        
        // 获取表单值
        const valName = document.getElementById('inName').value;
        const valIcon = document.getElementById('inIcon').value;
        const valAuthor = document.getElementById('inAuthor').value;
        const valEmail = document.getElementById('inEmail').value;
        const valVersion = document.getElementById('inVersion').value;
        const valIntro = document.getElementById('inIntro').value;
        const valCategory = document.querySelector('#radCategory .active').dataset.val;
        const valAge = document.querySelector('#radAge .active').dataset.val;
        const valMethod = document.querySelector('#radMethod .active').dataset.val;
        const valUrl = document.getElementById('inUrl').value;

        // ================= 核心修复：根据语言组装并映射正确的参数 =================
        if (isEn) {
            // 【英文版表单预填】
            p.append('game-name', valName);
            p.append('game-icon', valIcon);
            p.append('author-name', valAuthor);
            p.append('contact-email', valEmail);
            p.append('version', valVersion);
            p.append('short-description', valIntro);
            
            // 将中文分类映射为英文表单的文本选项，才能正确选中
            const catMap = { "休闲": "Casual", "益智": "Puzzle", "射击": "Shooter", "冒险": "Adventure", "其他": "Other" };
            p.append('game-category', catMap[valCategory] || valCategory); 
            
            // 将中文适龄映射为英文表单的文本选项
            const ageMap = { "全年龄": "All Ages", "6+": "6+", "12+": "12+", "16+": "16+", "18+": "18+" };
            p.append('age-rating', ageMap[valAge] || valAge);
            
            p.append('submission-method', valMethod); // Tally 后台选项值本身是 link / code
            if (valMethod === 'link') {
                p.append('game-url', valUrl);
            }
        } else {
            // 【中文版表单预填】（拼音 Slug）
            p.append('you-xi-ming-cheng', valName);
            p.append('you-xi-tu-biao', valIcon);
            p.append('zuo-zhe-shu-ming', valAuthor);
            p.append('lian-xi-you-xiang', valEmail);
            p.append('ban-ben-hao', valVersion);
            p.append('yi-ju-hua-jian-jie', valIntro);
            p.append('you-xi-fen-lei', valCategory);
            p.append('shi-ling-fen-ji', valAge);
            p.append('tou-gao-fang-shi', valMethod);
            if (valMethod === 'link') {
                p.append('you-xi-lian-jie', valUrl);
            }
        }

        // ================= 根据语言切换表单 ID =================
        // 中文表单: 7XlY69 | 英文表单: xVx8XG
        const baseUrl = isEn ? 'https://tally.so/embed/xVx8XG' : 'https://tally.so/embed/7XlY69';
        const finalUrl = `${baseUrl}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1&${p.toString()}`;
        
        document.getElementById('tallyContainer').innerHTML = `
            <iframe data-tally-src="${finalUrl}" loading="lazy" width="100%" height="800" frameborder="0"></iframe>
        `;
        
        if (typeof Tally !== 'undefined') Tally.loadEmbeds();
        closeModal('stepForm');
        openModal('stepTally');
    };
}

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
    try { localStorage.setItem('lelele_draft', JSON.stringify(data)); } catch (e) {}
}

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
            document.querySelectorAll(`#${id} .radio-btn`).forEach(b => b.classList.toggle('active', b.dataset.val === val));
        };
        if (data.cat) setRad('radCategory', data.cat);
        if (data.age) setRad('radAge', data.age);
        if (data.method) {
            setRad('radMethod', data.method);
            document.getElementById('groupUrl').style.display = data.method === 'link' ? 'block' : 'none';
        }
    } catch (e) {}
}

// ==================== Tally 提交监听（postMessage） ====================
window.addEventListener("message", function(event) {
    if (event.data && event.data.type === "tally-form-submitted") {
        try { localStorage.removeItem('lelele_draft'); } catch (e) {}
        document.querySelectorAll('.modal-overlay.active').forEach(el => el.classList.remove('active'));
        alert('提交成功！我们将尽快审核。\nSubmitted successfully! We will review it soon.');
        window.location.href = window.location.pathname + "?submitted=1";
    }
});

// ==================== 页面初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('submitted') === '1') {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    initLanguage();
    loadGames();
    loadAnnouncements();
    initSubmitFlow();
});
