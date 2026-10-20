// ==================== 全局工具 ====================
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
function applyLang(lang, save) {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
    document.title = lang === 'zh' ? '了了了游' : 'lelele Game';

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.langBtn === lang);
    });
    
    const suffix = lang === 'en' ? '?lang=en' : '';
    if (document.getElementById('linkRules')) document.getElementById('linkRules').href = 'game_rules.html' + suffix;
    if (document.getElementById('linkPrivacy')) document.getElementById('linkPrivacy').href = 'privacy.html' + suffix;
    if (document.getElementById('linkCopyright')) document.getElementById('linkCopyright').href = 'copyright.html' + suffix;

    if (save) {
        try { localStorage.setItem('lelele_lang', lang); } catch (e) {}
    }

    // 切换语言时，重新渲染游戏列表和收藏夹，以更新文字
    if (typeof gameData !== 'undefined' && gameData.length > 0) {
        renderGames();
    }
    if (document.getElementById('favoritesModal').classList.contains('active')) {
        renderFavoritesList();
    }
}

window.setLang = function(lang) {
    applyLang(lang, true);
};

function initLanguage() {
    const currentLang = document.documentElement.getAttribute('data-lang') || 'zh';
    applyLang(currentLang, false);
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
    const isEn = document.documentElement.getAttribute('data-lang') === 'en';
    const langSuffix = isEn ? '&lang=en' : '';
    
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
        container.innerHTML = `
            <div class="status-message">
                <span class="zh-inline">收藏的游戏似乎已下架。</span>
                <span class="en-inline">Favorited games seem to be removed.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = `<div class="fav-list">
        ${favGames.map(game => {
            const gameName = isEn ? (game.name_en || game.name_zh || game.name) : (game.name_zh || game.name_en || game.name);
            const gameCat = isEn ? (game.category_en || game.category_zh || game.category || 'Uncategorized') : (game.category_zh || game.category_en || game.category || '未分类');
            
            return `
            <div class="fav-item" onclick="window.location.href='game.html?id=${game.id}${langSuffix}'">
                <div class="fav-item-icon">${game.icon || '🎮'}</div>
                <div class="fav-item-info">
                    <div class="fav-item-name">${escapeHtml(gameName)}</div>
                    <div class="fav-item-cat">${escapeHtml(gameCat)}</div>
                </div>
                <button class="fav-item-remove" onclick="removeFavorite('${game.id}', event)" title="取消收藏">×</button>
            </div>
        `}).join('')}
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

    const isEn = document.documentElement.getAttribute('data-lang') === 'en';

    const filtered = gameData.filter(g => {
        const matchType = g.type === currentType;
        const targetName = isEn ? (g.name_en || g.name_zh || g.name || '') : (g.name_zh || g.name_en || g.name || '');
        const matchSearch = !searchKeyword || targetName.toLowerCase().includes(searchKeyword.toLowerCase());
        return matchType && matchSearch;
    });

    if (filtered.length === 0) {
        status.style.display = 'block';
        status.innerHTML = `<span class="zh-inline">暂无游戏，敬请期待 ✨</span><span class="en-inline">No games yet ✨</span>`;
    } else {
        status.style.display = 'none';
        filtered.forEach(g => {
            const gameName = isEn ? (g.name_en || g.name_zh || g.name) : (g.name_zh || g.name_en || g.name);
            
            const card = document.createElement('div');
            card.className = 'game-card';
            card.setAttribute('tabindex', '0');
            card.innerHTML = `
                <div class="game-icon">${g.icon || '🎮'}</div>
                <div class="game-name">${escapeHtml(gameName)}</div>
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
    const isEn = document.documentElement.getAttribute('data-lang') === 'en';
    
    const gameName = isEn ? (game.name_en || game.name_zh || game.name) : (game.name_zh || game.name_en || game.name);
    const gameCat = isEn ? (game.category_en || game.category_zh || game.category) : (game.category_zh || game.category_en || game.category);
    const gameAge = isEn ? (game.ageRating_en || game.ageRating_zh || game.ageRating) : (game.ageRating_zh || game.ageRating_en || game.ageRating);
    
    document.getElementById('prevIcon').textContent = game.icon || '🎮';
    document.getElementById('prevName').textContent = gameName;
    
    let tagsHtml = '';
    if (gameCat) tagsHtml += `<span class="preview-tag">${escapeHtml(gameCat)}</span>`;
    if (gameAge) tagsHtml += `<span class="preview-tag age">${escapeHtml(gameAge)}</span>`;
    document.getElementById('prevTags').innerHTML = tagsHtml;
    
    document.getElementById('btnDetail').onclick = () => {
        const langSuffix = isEn ? '&lang=en' : '';
        window.location.href = `game.html?id=${game.id}${langSuffix}`;
    };
    
        // 【修改】在直接进入游戏的点击事件中增加 Edgemetry 事件上报
    document.getElementById('btnPlay').onclick = () => {
        if (typeof edgemetry !== 'undefined') {
            edgemetry('play-game', { 
                props: {
                    gameId: String(game.id), 
                    gameName: game.name_zh || game.name 
                }
            });
        }
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
        btn.innerHTML = '<span class="zh-inline">🌟 已收藏</span><span class="en-inline">🌟 Favorited</span>';
        btn.classList.add('fav-active');
    } else {
        btn.innerHTML = '<span class="zh-inline">⭐ 收藏</span><span class="en-inline">⭐ Favorite</span>';
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

// ==================== 投稿流程逻辑 ====================
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
        document.getElementById('chkAuth').checked = false;
        document.getElementById('chkAuthEn').checked = false;
        document.getElementById('btnToTally').disabled = true;
        openModal('stepAuth');
    };

    document.getElementById('chkAuth').onchange = document.getElementById('chkAuthEn').onchange = (e) => {
        document.getElementById('btnToTally').disabled = !e.target.checked;
    };
    
    document.getElementById('btnToTally').onclick = () => {
        if (document.getElementById('btnToTally').disabled) return;
        
        const isEn = document.documentElement.getAttribute('data-lang') === 'en';
        const baseUrl = isEn ? 'https://tally.so/embed/xVx8XG' : 'https://tally.so/embed/7XlY69';
        const finalUrl = `${baseUrl}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`;
        
        document.getElementById('tallyContainer').innerHTML = `
            <iframe data-tally-src="${finalUrl}" loading="lazy" width="100%" height="800" frameborder="0"></iframe>
        `;
        
        if (typeof Tally !== 'undefined') Tally.loadEmbeds();
        closeModal('stepAuth');
        openModal('stepTally');
    };
}

// ==================== Tally 提交监听 ====================
window.addEventListener("message", function(event) {
    if (event.data && event.data.type === "tally-form-submitted") {
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
