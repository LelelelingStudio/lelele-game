// ==================== 全局工具函数 ====================
// 兜底：本地保留 escapeHtml / getFavorites / saveFavorites，避免 Cloudflare 缓存旧版 common.js 时本页调用未定义函数而整页崩溃
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getFavorites() {
    try { return JSON.parse(localStorage.getItem('lelele_favs') || '[]'); } catch (e) { return []; }
}

function saveFavorites(favs) {
    try { localStorage.setItem('lelele_favs', JSON.stringify(favs)); } catch (e) {}
}

window.openModal = function(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
};

window.closeModal = function(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
};

// ==================== 收藏夹逻辑 ====================
// getFavorites / saveFavorites 见 common.js（window.getFavorites / window.saveFavorites）

window.removeFavorite = function(id, event) {
    if (event) event.stopPropagation();
    let favs = getFavorites();
    favs = favs.filter(f => f !== String(id));
    saveFavorites(favs);
    renderFavoritesList();
    
    // 取消收藏埋点已移除
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
        container.innerHTML = `<div class="status-message"><span class="zh-inline">你还没有收藏任何游戏哦，快去逛逛吧！</span><span class="en-inline">You have no favorites yet.</span></div>`;
        return;
    }

    const favGames = gameData.filter(g => favs.includes(String(g.id)));

    if (favGames.length === 0) {
        container.innerHTML = `<div class="status-message"><span class="zh-inline">收藏的游戏似乎已下架。</span><span class="en-inline">Favorited games seem to be removed.</span></div>`;
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

// ==================== 游戏数据与渲染 ====================
let gameData = [];
let authorsData = [];
let currentType = 'all';
let currentCategory = 'all';
let searchKeyword = '';
let searchTimer = null;
let searchScope = 'all';
let searchPage = 1;

// 共享目录数据缓存：首页 loadGames 与排行榜共用同一份 lelegame_data.json，避免重复请求
let _catalogPromise = null;
function getCatalog() {
    if (!_catalogPromise) {
        _catalogPromise = fetch('lelegame_data.json', { cache: 'no-store' })
            .then(r => r.ok ? r.json() : [])
            .catch(() => []);
    }
    return _catalogPromise;
}

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
        // 游戏主数据走共享缓存（与排行榜复用同一次 fetch），仅作者映射表单独请求
        const [gamesJson, resAuthors] = await Promise.all([
            getCatalog(),
            fetch('https://authors.surge.sh/authors.json?t=' + Date.now()).catch(() => null)
        ]);

        gameData = Array.isArray(gamesJson) ? gamesJson : [];
        if (!gameData.length) throw new Error('empty catalog');

        if (resAuthors && resAuthors.ok) {
            authorsData = await resAuthors.json();
        }

        // 将作者 ID 转换为真实名字，便于后续搜索和展示
        gameData = gameData.map(g => {
            if (typeof g.author === 'number' || /^\d+$/.test(g.author)) {
                const authorObj = authorsData.find(a => String(a.id) === String(g.author));
                if (authorObj) {
                    return { 
                        ...g, 
                        authorId: g.author, 
                        author: authorObj.name_zh || authorObj.name_en || 'Unknown',
                        author_en: authorObj.name_en || authorObj.name_zh || 'Unknown'
                    };
                }
            }
            return g;
        });

    } catch (e) {
        grid.innerHTML = '';
        status.style.display = 'block';
        status.innerHTML = `<span class="zh-inline">数据加载失败，请刷新重试。</span><span class="en-inline">Failed to load data.</span>`;
        return;
    }
    
    renderCategories();
    renderGames();
}

function renderCategories() {
    const isEn = document.documentElement.getAttribute('data-lang') === 'en';
    const catSet = new Set();
    
    gameData.forEach(g => {
        const cat = isEn ? g.category_en : g.category_zh;
        if (cat) catSet.add(cat);
    });

    const categoryNav = document.getElementById('categoryNav');
    const wrapper = document.getElementById('categoryNavWrapper');
    
    if (catSet.size === 0) {
        wrapper.style.display = 'none';
        return;
    }
    wrapper.style.display = 'block';

    let html = `<button class="category-btn ${currentCategory === 'all' ? 'active' : ''}" data-cat="all">
        <span class="zh-inline">全部分类</span><span class="en-inline">All Categories</span>
    </button>`;
    
    Array.from(catSet).forEach(cat => {
        html += `<button class="category-btn ${currentCategory === cat ? 'active' : ''}" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`;
    });
    
    categoryNav.innerHTML = html;
}

window.renderGames = function() {
    const grid = document.getElementById('gamesGrid');
    const status = document.getElementById('statusMessage');
    const scopeBar = document.getElementById('searchScopeBar');
    const pagination = document.getElementById('searchPagination');
    if (!grid) return;
    grid.innerHTML = '';
    if (scopeBar) scopeBar.style.display = 'none';
    if (pagination) pagination.style.display = 'none';

    const isEn = document.documentElement.getAttribute('data-lang') === 'en';
    const isSearch = searchKeyword.trim() !== '';
    let filtered = [];

    if (isSearch) {
        if (searchScope === 'author') {
            const authorResults = window.leleleSearchAuthors(searchKeyword, authorsData, gameData);
            status.style.display = 'none';
            if (authorResults.length === 0) {
                status.style.display = 'block';
                status.innerHTML = `<span class="zh-inline">没有找到匹配的作者</span><span class="en-inline">No matching authors found</span>`;
                return;
            }
            if (scopeBar) renderSearchScopeBar(authorResults.length, true);
            authorResults.forEach(a => renderAuthorCard(a, isEn));
            return;
        }

        filtered = window.leleleSearch(searchKeyword, gameData, isEn, searchScope);

        if (filtered.length === 0) {
            status.style.display = 'block';
            status.innerHTML = `<span class="zh-inline">没有找到匹配的游戏</span><span class="en-inline">No matching games found</span>`;
            return;
        }

        const pageSize = 25;
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        if (searchPage > totalPages) searchPage = totalPages;
        if (searchPage < 1) searchPage = 1;
        const pageItems = filtered.slice((searchPage - 1) * pageSize, searchPage * pageSize);

        status.style.display = 'none';
        if (scopeBar) renderSearchScopeBar(filtered.length, false);
        if (pagination) renderSearchPagination(totalPages);
        pageItems.forEach(item => renderGameCard(item, isEn, true));
        return;
    }

    filtered = gameData.filter(g => {
        const matchType = (currentType === 'all') || (g.type === currentType);
        const cat = isEn ? g.category_en : g.category_zh;
        const matchCat = (currentCategory === 'all') || (cat === currentCategory);
        return matchType && matchCat;
    });

    if (filtered.length === 0) {
        status.style.display = 'block';
        status.innerHTML = `<span class="zh-inline">该分类下暂无游戏，敬请期待 ✨</span><span class="en-inline">No games in this category yet ✨</span>`;
        return;
    }

    status.style.display = 'none';
    filtered.forEach(item => renderGameCard(item, isEn, false));
};

function renderGameCard(item, isEn, showAuthor) {
    const grid = document.getElementById('gamesGrid');
    const g = item.game || item;
    const finalHtmlName = item.matchHtml || escapeHtml(isEn ? (g.name_en || g.name_zh || g.name) : (g.name_zh || g.name_en || g.name));
    let authorHtml = '';
    if (showAuthor && g.author) {
        authorHtml = `<div class="game-author">${escapeHtml(g.author)}</div>`;
    }
    const card = document.createElement('div');
    card.className = 'game-card';
    card.setAttribute('tabindex', '0');
    card.innerHTML = `
        <div class="game-icon">${g.icon || '🎮'}</div>
        <div class="game-name">${finalHtmlName}</div>
        ${authorHtml}
    `;
    card.onclick = () => showPreview(g);
    card.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPreview(g); }
    };
    grid.appendChild(card);
}

function renderAuthorCard(authorResult, isEn) {
    const grid = document.getElementById('gamesGrid');
    const a = authorResult.author;
    const name = authorResult.matchHtml || escapeHtml(isEn ? (a.name_en || a.name_zh) : (a.name_zh || a.name_en));
    const count = authorResult.games.length;
    const avatar = a.avatar ? `<img class="author-avatar" src="${escapeHtml(a.avatar)}" alt="" onerror="this.style.display='none'">` : '<div class="author-avatar author-avatar-fallback">🧑‍💻</div>';
    const card = document.createElement('div');
    card.className = 'author-card';
    card.setAttribute('tabindex', '0');
    card.innerHTML = `
        ${avatar}
        <div class="author-meta">
            <div class="author-name">${name}</div>
            <div class="author-count">${count} ${isEn ? 'games' : '个作品'}</div>
        </div>
    `;
    const go = () => { window.location.href = `author.html?id=${encodeURIComponent(a.id)}`; };
    card.onclick = go;
    card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    grid.appendChild(card);
}

function renderSearchScopeBar(total, isAuthorView) {
    const bar = document.getElementById('searchScopeBar');
    if (!bar) return;
    bar.style.display = 'flex';
    const countEl = bar.querySelector('.scope-count');
    if (countEl) countEl.textContent = `(${total})`;
}

function renderSearchPagination(totalPages) {
    const p = document.getElementById('searchPagination');
    if (!p) return;
    if (totalPages <= 1) { p.style.display = 'none'; return; }
    p.style.display = 'flex';
    let html = `<button class="page-btn" data-page="${searchPage - 1}" ${searchPage <= 1 ? 'disabled' : ''} aria-label="上一页">‹</button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - searchPage) <= 1) {
            html += `<button class="page-btn ${i === searchPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        } else if (Math.abs(i - searchPage) === 2) {
            html += `<span class="page-ellipsis">…</span>`;
        }
    }
    html += `<button class="page-btn" data-page="${searchPage + 1}" ${searchPage >= totalPages ? 'disabled' : ''} aria-label="下一页">›</button>`;
    p.innerHTML = html;
}

const renderGames = window.renderGames;

const searchInput = document.getElementById('searchInput');
const searchClearBtn = document.getElementById('searchClearBtn');

searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (val.trim().length > 0) {
        searchClearBtn.classList.add('show');
    } else {
        searchClearBtn.classList.remove('show');
    }

    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { 
        searchKeyword = val; 
        searchPage = 1;
        renderGames(); 
    }, 200);
});

searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchKeyword = '';
    searchPage = 1;
    searchClearBtn.classList.remove('show');
    renderGames();
});

document.getElementById('typeNav').addEventListener('click', (e) => {
    const btn = e.target.closest('.type-btn');
    if (!btn) return;
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentType = btn.dataset.type;
    renderGames();
});

document.getElementById('categoryNav').addEventListener('click', (e) => {
    const btn = e.target.closest('.category-btn');
    if (!btn) return;
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.cat;
    renderGames();
});

// 搜索范围切换（全部 / 游戏 / 作者）
const searchScopeBar = document.getElementById('searchScopeBar');
if (searchScopeBar) {
    searchScopeBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.scope-btn');
        if (!btn) return;
        searchScopeBar.querySelectorAll('.scope-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        searchScope = btn.dataset.scope;
        searchPage = 1;
        renderGames();
    });
}

// 搜索分页
const searchPaginationEl = document.getElementById('searchPagination');
if (searchPaginationEl) {
    searchPaginationEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.page-btn');
        if (!btn || btn.disabled) return;
        const p = parseInt(btn.dataset.page, 10);
        if (!isNaN(p)) { searchPage = p; renderGames(); }
    });
}

window.addEventListener('langChanged', () => {
    renderCategories();
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
    
    document.getElementById('btnPlay').onclick = () => {
        if (window.leleleTrack) {
            window.leleleTrack('play-game_' + (game.name_zh || game.name)); 
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
    
    // 收藏埋点已移除
};

// ==================== 投稿流程逻辑 ====================
function initSubmitFlow() {
    document.getElementById('openSubmitGuide').onclick = async () => {
        if (window.supabaseClient) {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (!session) {
                alert('发布游戏需要先注册成为开发者哦～\nPublishing games requires an account. Redirecting to login...');
                window.location.href = 'login.html';
                return;
            }
        } else {
            alert('无法连接到服务器，请稍后重试。\nCannot connect to server, please try again later.');
            return;
        }

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

window.addEventListener("message", function(event) {
    if (event.data && event.data.type === "tally-form-submitted") {
        document.querySelectorAll('.modal-overlay.active').forEach(el => el.classList.remove('active'));
        alert('提交成功！我们将尽快审核.\nSubmitted successfully! We will review it soon.');
        window.location.href = window.location.pathname + "?submitted=1";
    }
});

// ==================== 排行榜逻辑 ====================
(function() {
    const rankLang = {
        zh: { title: '游戏排名', subtitle: '全站热度榜', more: '查看更多', modalTitle: '前 25 名排行', noData: '暂无数据', played: '次', view: '查看详情' },
        en: { title: 'Top Games', subtitle: 'Global popularity ranking', more: 'View More', modalTitle: 'Top 25 Ranking', noData: 'No data available', played: 'plays', view: 'Details' }
    };
    const ANALYTICS_API = 'https://analytics.leleleling.site/api/breakdown?site=1&cmp=1&limit=1000&dim=path,referrer,event,country,device&range=30d';
    let catalogCache = []; 

    function getCurrentLang() { return document.documentElement.getAttribute('data-lang') || 'zh'; }
    function t(key) { const lang = getCurrentLang(); return (rankLang[lang] && rankLang[lang][key]) || rankLang.zh[key]; }
    function normalizeName(value) {
        if (!value) return '';
        return String(value).replace(/^play-game[_\s-]*/i, '').replace(/[_-]+/g, ' ').trim().toLowerCase();
    }

    async function fetchCatalog() { return getCatalog(); }

    function getGameDetailUrl(id) {
        const lang = getCurrentLang();
        return `game.html?id=${encodeURIComponent(id)}&lang=${lang}`;
    }

    function renderEmpty() {
        const top3 = document.getElementById('top3RankContainer');
        if (top3) top3.innerHTML = `<div class="rank-empty">${t('noData')}</div>`;
    }

    function renderTop3(items) {
        const container = document.getElementById('top3RankContainer');
        if (!container) return;
        if (!items || !items.length) { renderEmpty(); return; }

        const top3 = items.slice(0, 3);
        const medals = ['🥇', '🥈', '🥉'];
        
        container.innerHTML = top3.map((item, index) => {
            const medal = medals[index] || '🏅';
            const rankLevel = index + 1;
            const detailUrl = item.url || '#';
            const name = item.name || 'Unknown';
            return `
                <button class="rank-card rank-${rankLevel}" type="button" style="text-align:left;" onclick="window.location.href='${detailUrl}'">
                    <div class="rank-card-header"><div class="rank-medal">${medal}</div><div class="rank-tag">No.${rankLevel}</div></div>
                    <div class="rank-main"><div class="rank-icon">${item.icon || '🎮'}</div><div class="rank-name">${escapeHtml(name)}</div></div>
                    <div class="rank-meta"><div class="rank-count">${item.count} <small>${t('played')}</small></div><a href="${detailUrl}" class="rank-link" onclick="event.stopPropagation();">${t('view')}</a></div>
                </button>
            `;
        }).join('');
    }

    function renderModal(items) {
        const list = document.getElementById('rankModalList');
        if (!list) return;
        const top25 = items.slice(0, 25);
        list.innerHTML = top25.map((item, index) => {
            const detailUrl = item.url || '#';
            return `
                <li class="rank-modal-row">
                    <div class="rank-modal-index">${index + 1}</div>
                    <div class="rank-modal-name">${escapeHtml(item.name || 'Unknown')}</div>
                    <div class="rank-modal-count">${item.count}</div>
                    <div><a href="${detailUrl}" class="rank-modal-link" onclick="event.stopPropagation();">${t('view')}</a></div>
                </li>
            `;
        }).join('');
    }

    function syncTexts() {
        const nodes = document.querySelectorAll('[data-i18n]');
        const map = { rankTitle: t('title'), rankSubtitle: t('subtitle'), rankMore: t('more'), rankModalTitle: t('modalTitle') };
        nodes.forEach(node => { const key = node.getAttribute('data-i18n'); if (map[key]) node.textContent = map[key]; });
    }

    function bindModal() {
        const openBtn = document.getElementById('openRankModalBtn');
        const modal = document.getElementById('rankModalOverlay');
        const closeBtn = document.getElementById('rankModalCloseBtn');
        if (!openBtn || !modal || !closeBtn) return;

        openBtn.addEventListener('click', () => modal.classList.add('active'));
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.remove('active'); });
    }

    // analytics 结果内存缓存：10 分钟内切语言只重渲染、不重拉接口；轮询周期同步放宽
    let _analyticsCache = null;
    let _analyticsTime = 0;
    const ANALYTICS_TTL = 10 * 60 * 1000;

    async function refreshRankings() {
        const now = Date.now();
        try {
            let rawList = _analyticsCache;
            if (!rawList || now - _analyticsTime > ANALYTICS_TTL) {
                const res = await fetch(ANALYTICS_API, { cache: 'no-store' });
                if (!res.ok) throw new Error('fetch failed');
                const json = await res.json();
                const events = json.breakdowns?.event || [];
                rawList = events
                    .filter(item => typeof item?.name === 'string' && item.name.toLowerCase().startsWith('play-game_'))
                    .map(item => ({ name: String(item.name).replace(/^play-game[_\s-]*/i, '').trim(), count: Number(item.value || 0) }))
                    .filter(item => item.name)
                    .sort((a, b) => b.count - a.count);
                _analyticsCache = rawList;
                _analyticsTime = now;
            }

            if (!rawList.length) { renderEmpty(); return; }

            if (!catalogCache.length) catalogCache = await fetchCatalog();

            const lookup = new Map();
            catalogCache.forEach(game => {
                const names = [game.name_zh, game.name_en, game.name, game.title].filter(Boolean);
                names.forEach(n => lookup.set(normalizeName(n), game));
                if (game.id) lookup.set(String(game.id), game);
            });

            const isEn = getCurrentLang() === 'en';
            const mapped = rawList.map(entry => {
                const normalized = normalizeName(entry.name);
                const matchedGame = lookup.get(normalized) || lookup.get(entry.name);
                return {
                    id: matchedGame ? matchedGame.id : null,
                    name: matchedGame ? (isEn ? (matchedGame.name_en || matchedGame.name_zh || matchedGame.name) : (matchedGame.name_zh || matchedGame.name_en || matchedGame.name)) : entry.name,
                    icon: matchedGame ? (matchedGame.icon || '🎮') : '🎮',
                    count: entry.count,
                    url: matchedGame ? getGameDetailUrl(matchedGame.id) : null
                };
            }).filter(item => item.name && item.url);

            renderTop3(mapped);
            renderModal(mapped);
        } catch (e) {
            console.warn('rank fetch failed', e);
            renderEmpty();
        }
    }

    function initRanking() {
        bindModal(); syncTexts(); refreshRankings();
        setInterval(refreshRankings, 10 * 60 * 1000);
    }

    document.addEventListener('DOMContentLoaded', initRanking);
    window.addEventListener('langChanged', () => { syncTexts(); refreshRankings(); });
})();

// ==================== 页面初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('submitted') === '1') {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    loadGames();
    initSubmitFlow();

    const aboutBtn = document.getElementById('linkAbout');
    if (aboutBtn) {
        aboutBtn.addEventListener('click', function(e) {
            const currentLang = document.documentElement.getAttribute('data-lang');
            if (currentLang === 'en') this.href = 'about.html?lang=en';
            else this.href = 'about.html';
        });
    }

    // 随机游玩：从已加载的游戏数据中随机挑一个跳转到详情页
    const randomBtn = document.getElementById('randomPlayBtn');
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            if (!gameData || !gameData.length) { if (window.toast) window.toast('数据加载中…'); return; }
            const item = gameData[Math.floor(Math.random() * gameData.length)];
            const isEn = document.documentElement.getAttribute('data-lang') === 'en';
            window.location.href = 'game.html?id=' + encodeURIComponent(item.id) + (isEn ? '&lang=en' : '');
        });
    }

});
