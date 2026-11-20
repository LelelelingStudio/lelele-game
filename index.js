// 4.0.12：初始化不再死等 DOMContentLoaded（外部 defer 脚本曾把它无限推迟）。
// defer 脚本执行时 DOM 已解析完，readyState 非 loading 即可立即初始化。
function leleleOnReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else { fn(); }
}
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
    if (typeof window.getFavGroups === 'function') {
        const groups = window.getFavGroups();
        Object.keys(groups).forEach(k => { groups[k] = (groups[k] || []).filter(x => String(x) !== String(id)); });
        window.saveFavGroups(groups);
    }
    renderFavoritesList();
    if (typeof window.trackFavorite === 'function') window.trackFavorite(id, 'unfav');
};

document.getElementById('openFavBtn').addEventListener('click', () => {
    renderFavoritesList();
    openModal('favoritesModal');
});

let _activeFavGroup = '全部';
function renderFavoritesList() {
    const container = document.getElementById('favListContainer');
    const tabsEl = document.getElementById('favGroupTabs');
    const favs = getFavorites();
    const isEn = document.documentElement.getAttribute('data-lang') === 'en';
    const langSuffix = isEn ? '&lang=en' : '';

    if (favs.length === 0) {
        if (tabsEl) tabsEl.innerHTML = '';
        container.innerHTML = `<div class="status-message"><span class="zh-inline">你还没有收藏任何游戏哦，快去逛逛吧！</span><span class="en-inline">You have no favorites yet.</span></div>`;
        return;
    }

    // 分组 tab：全部 + 已建分组 + 默认
    const groups = (typeof window.getFavGroups === 'function' ? window.getFavGroups() : {});
    const groupNames = ['全部', '默认', ...Object.keys(groups).filter(n => n !== '默认')];
    if (groupNames.indexOf(_activeFavGroup) < 0) _activeFavGroup = '全部';
    if (tabsEl) {
        tabsEl.innerHTML = groupNames.map(n => `<button type="button" class="fav-group-tab${n === _activeFavGroup ? ' active' : ''}" data-fav-group="${escapeHtml(n)}">${n === '全部' ? (isEn ? 'All' : '全部') : escapeHtml(n)}</button>`).join('') +
            `<button type="button" class="fav-group-add" id="favGroupAdd" title="${isEn ? 'New group' : '新建分组'}">＋${isEn ? 'Group' : '分组'}</button>`;
        tabsEl.querySelectorAll('[data-fav-group]').forEach(btn => btn.addEventListener('click', () => { _activeFavGroup = btn.getAttribute('data-fav-group'); renderFavoritesList(); }));
        const addBtn = document.getElementById('favGroupAdd');
        if (addBtn) addBtn.addEventListener('click', () => {
            const name = (window.prompt(isEn ? 'New group name:' : '新分组名称：') || '').trim();
            if (!name || name === '全部') return;
            const g = (typeof window.getFavGroups === 'function' ? window.getFavGroups() : {});
            if (!Array.isArray(g[name])) g[name] = [];
            if (typeof window.saveFavGroups === 'function') window.saveFavGroups(g);
            _activeFavGroup = name; renderFavoritesList();
        });
    }

    // 按当前分组过滤 id（保持 lelele_favs 的既有顺序 = 用户拖动后的顺序）
    let visibleIds = favs.slice();
    if (_activeFavGroup !== '全部' && typeof window.getFavGroupOf === 'function') {
        visibleIds = favs.filter(id => window.getFavGroupOf(id) === _activeFavGroup);
    }
    const favGames = gameData.filter(g => visibleIds.includes(String(g.id)));

    if (favGames.length === 0) {
        container.innerHTML = `<div class="status-message"><span class="zh-inline">该分组还没有收藏。</span><span class="en-inline">No favorites in this group.</span></div>`;
        return;
    }

    container.innerHTML = `<div class="fav-list" id="favSortable">
        ${favGames.map((game, idx) => {
            const gameName = isEn ? (game.name_en || game.name_zh || game.name) : (game.name_zh || game.name_en || game.name);
            const gameCat = isEn ? (game.category_en || game.category_zh || game.category || 'Uncategorized') : (game.category_zh || game.category_en || game.category || '未分类');
            const grp = (typeof window.getFavGroupOf === 'function' ? window.getFavGroupOf(game.id) : '默认');
            return `
            <div class="fav-item" draggable="true" data-fav-id="${game.id}" data-drag-index="${idx}" onclick="window.location.href='game.html?id=${game.id}${langSuffix}'">
                <span class="fav-drag" title="${isEn ? 'Drag to reorder' : '拖动排序'}">⋮⋮</span>
                <div class="fav-item-icon">${game.icon || '🎮'}</div>
                <div class="fav-item-info">
                    <div class="fav-item-name">${escapeHtml(gameName)}</div>
                    <div class="fav-item-cat">${escapeHtml(gameCat)}</div>
                </div>
                <select class="fav-group-select" data-fav-group-select="${game.id}" onclick="event.stopPropagation()" title="${isEn ? 'Move to group' : '移动到分组'}">
                    ${groupNames.filter(n => n !== '全部').map(n => `<option value="${escapeHtml(n)}"${n === grp ? ' selected' : ''}>${escapeHtml(n)}</option>`).join('')}
                </select>
                <button class="fav-item-remove" onclick="removeFavorite('${game.id}', event)" title="取消收藏">×</button>
            </div>
        `}).join('')}
    </div>`;
    // 分组下拉
    container.querySelectorAll('[data-fav-group-select]').forEach(sel => sel.addEventListener('change', () => {
        if (typeof window.setFavGroup === 'function') window.setFavGroup(sel.getAttribute('data-fav-group-select'), sel.value);
        renderFavoritesList();
    }));
    // 拖动排序：只重排 lelele_favs 顺序（可见子集的相对顺序写回全局列表）
    initFavDragSort(container);
}

function initFavDragSort(container) {
    const list = container.querySelector('#favSortable');
    if (!list) return;
    let dragId = null;
    list.querySelectorAll('.fav-item[draggable]').forEach(item => {
        item.addEventListener('dragstart', e => { dragId = item.getAttribute('data-fav-id'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (err) {} });
        item.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
        item.addEventListener('drop', e => {
            e.preventDefault();
            const targetId = item.getAttribute('data-fav-id');
            if (!dragId || dragId === targetId) return;
            const favs = getFavorites().slice();
            const from = favs.indexOf(dragId), to = favs.indexOf(targetId);
            if (from < 0 || to < 0) return;
            favs.splice(to, 0, favs.splice(from, 1)[0]);
            saveFavorites(favs);
            dragId = null;
            renderFavoritesList();
        });
        item.addEventListener('dragend', () => { dragId = null; });
    });
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
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        _catalogPromise = fetch('lelegame_data.json', { signal: ctrl.signal })
            .then(r => { clearTimeout(timer); return r.ok ? r.json() : []; })
            .catch(() => { clearTimeout(timer); return []; });
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
            window.fetchAuthors().catch(() => null)
        ]);

        gameData = Array.isArray(gamesJson) ? gamesJson : [];
        if (!gameData.length) throw new Error('empty catalog');

        if (resAuthors) {
            authorsData = resAuthors;
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
    // 本周更新轮播异步加载（不阻塞游戏列表）
    loadWeeklyCarousel().catch(() => {});
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
    renderTagNav();
}

// 本周新游/更新轮播（#4）：从 game/data/<id>.json 的 updateLog 取近 7 天有更新的游戏
let _weeklyItems = null, _weeklyOffset = 0;
function normalizeDay(s) { return String(s || '').replace(/[.\/]/g, '-').slice(0, 10); }
async function loadWeeklyCarousel() {
    const wrap = document.getElementById('weeklyCarousel');
    if (!wrap || !gameData.length) return;
    if (_weeklyItems) { renderWeekly(); return; }
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    const items = [];
    // 并发上限 6，避免一次 32 个请求打爆
    const queue = gameData.slice();
    async function worker() {
        while (queue.length) {
            const g = queue.shift();
            try {
                const res = await fetch('game/data/' + encodeURIComponent(g.id) + '.json', { cache: 'no-store' });
                if (!res.ok) continue;
                const d = await res.json();
                const logs = [].concat(d.updateLog_zh || [], d.updateLog_en || []);
                const latest = logs.map(x => normalizeDay(x.date)).filter(Boolean).sort().pop();
                if (latest && new Date(latest + 'T00:00:00').getTime() >= cutoff) {
                    items.push({ ...g, updateDate: latest, updateText: (d.updateLog_zh || d.updateLog_en || [])[0]?.content || '' });
                }
            } catch (e) {}
        }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    items.sort((a, b) => String(b.updateDate).localeCompare(String(a.updateDate)));
    _weeklyItems = items;
    renderWeekly();
}
function renderWeekly() {
    const wrap = document.getElementById('weeklyCarousel');
    const track = document.getElementById('weeklyTrack');
    if (!wrap || !track) return;
    if (!_weeklyItems || !_weeklyItems.length) { wrap.hidden = true; return; }
    wrap.hidden = false;
    const isEn = document.documentElement.getAttribute('data-lang') === 'en';
    const perPage = 4;
    const start = ((_weeklyOffset % _weeklyItems.length) + _weeklyItems.length) % _weeklyItems.length;
    const shown = Array.from({ length: Math.min(perPage, _weeklyItems.length) }, (_, i) => _weeklyItems[(start + i) % _weeklyItems.length]);
    track.innerHTML = shown.map(g => {
        const name = isEn ? (g.name_en || g.name_zh) : (g.name_zh || g.name_en);
        return `<a class="weekly-card" href="game.html?id=${encodeURIComponent(g.id)}${isEn ? '&lang=en' : ''}">
            <span class="weekly-icon">${g.icon || '🎮'}</span>
            <span class="weekly-name">${escapeHtml(name)}</span>
            <span class="weekly-date">${escapeHtml(g.updateDate)}</span>
        </a>`;
    }).join('');
}
function bindWeeklyNav() {
    const p = document.getElementById('weeklyPrev'), n = document.getElementById('weeklyNext');
    if (p) p.addEventListener('click', () => { _weeklyOffset -= 4; renderWeekly(); });
    if (n) n.addEventListener('click', () => { _weeklyOffset += 4; renderWeekly(); });
}

// 标签多选筛选（#5）
let selectedTags = [];
function renderTagNav() {
    const wrap = document.getElementById('tagNavWrapper');
    const nav = document.getElementById('tagNav');
    if (!wrap || !nav) return;
    const isEn = document.documentElement.getAttribute('data-lang') === 'en';
    const tagSet = new Set();
    gameData.forEach(g => {
        const arr = (g.tags && Array.isArray(g.tags[isEn ? 'en' : 'zh'])) ? g.tags[isEn ? 'en' : 'zh'] : [];
        arr.forEach(t => tagSet.add(t));
    });
    if (!tagSet.size) { wrap.hidden = true; return; }
    wrap.hidden = false;
    let html = '';
    if (selectedTags.length) html += `<button type="button" class="tag-chip clear" data-tag="__clear__">${isEn ? '✕ Clear tags' : '✕ 清除标签'}</button>`;
    Array.from(tagSet).forEach(tag => {
        html += `<button type="button" class="tag-chip${selectedTags.includes(tag) ? ' active' : ''}" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`;
    });
    nav.innerHTML = html;
    nav.querySelectorAll('[data-tag]').forEach(btn => btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        if (tag === '__clear__') selectedTags = [];
        else {
            const i = selectedTags.indexOf(tag);
            if (i >= 0) selectedTags.splice(i, 1); else selectedTags.push(tag);
        }
        searchPage = 1;
        renderTagNav();
        renderGames();
    }));
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
        const gTags = (g.tags && Array.isArray(g.tags[isEn ? 'en' : 'zh'])) ? g.tags[isEn ? 'en' : 'zh'] : [];
        const matchTags = !selectedTags.length || selectedTags.every(t => gTags.includes(t));
        return matchType && matchCat && matchTags;
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
    // 分类 emoji 兜底（#32）
    const CAT_EMOJI = { '射击': '🔫', 'Shooter': '🔫', '益智': '🧩', 'Puzzle': '🧩', '冒险': '🗺️', 'Adventure': '🗺️', '动作': '⚔️', 'Action': '⚔️', '模拟经营': '🏗️', 'Simulation': '🏗️', '休闲': '🎯', 'Casual': '🎯' };
    const fallbackIcon = CAT_EMOJI[g.category_zh] || CAT_EMOJI[g.category_en] || '🎮';
    const card = document.createElement('div');
    card.className = 'game-card';
    card.setAttribute('tabindex', '0');
    card.innerHTML = `
        <div class="game-icon">${escapeHtml(g.icon || fallbackIcon)}</div>
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
    const avatar = a.avatar ? `<img class="author-avatar lazy-img" src="${escapeHtml(a.avatar)}" alt="" loading="lazy" onerror="this.style.display='none'; if(this.nextElementSibling)this.nextElementSibling.style.display='flex';"><div class="author-avatar author-avatar-fallback" style="display:none">🧑‍💻</div>` : '<div class="author-avatar author-avatar-fallback">🧑‍💻</div>';
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

const SEARCH_HISTORY_KEY = 'lelele_search_history';
function getSearchHistory() { try { const v = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
function pushSearchHistory(kw) {
    const k = String(kw || '').trim();
    if (!k) return;
    const list = getSearchHistory().filter(x => x !== k);
    list.unshift(k);
    try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(list.slice(0, 8))); } catch (e) {}
}
function renderSearchHistory() {
    const box = document.getElementById('searchHistory');
    if (!box) return;
    const list = getSearchHistory();
    if (!list.length || document.activeElement !== searchInput) { box.hidden = true; return; }
    const isEn = document.documentElement.getAttribute('data-lang') === 'en';
    box.innerHTML = `<div class="search-history-head"><span>${isEn ? 'Recent searches' : '搜索历史'}</span><button type="button" id="clearSearchHistory">${isEn ? 'Clear' : '清空'}</button></div>` +
        list.map(k => `<button type="button" class="search-history-item" data-kw="${escapeHtml(k)}">🔍 ${escapeHtml(k)}</button>`).join('');
    box.hidden = false;
    box.querySelectorAll('[data-kw]').forEach(b => b.addEventListener('mousedown', e => {
        e.preventDefault(); searchInput.value = b.getAttribute('data-kw'); searchKeyword = searchInput.value; searchPage = 1; box.hidden = true; renderGames();
    }));
    const clr = document.getElementById('clearSearchHistory');
    if (clr) clr.addEventListener('mousedown', e => { e.preventDefault(); try { localStorage.removeItem(SEARCH_HISTORY_KEY); } catch (err) {} box.hidden = true; });
}
searchInput.addEventListener('focus', renderSearchHistory);
searchInput.addEventListener('blur', () => { const box = document.getElementById('searchHistory'); if (box) setTimeout(() => { box.hidden = true; }, 150); });
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
        if (val.trim()) pushSearchHistory(val.trim());
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

// 搜索框占位符跟随语言（原先硬编码中文，切英文后仍是中文）
function updateSearchPlaceholder() {
    const el = document.getElementById('searchInput');
    if (!el) return;
    el.placeholder = document.documentElement.getAttribute('data-lang') === 'en'
        ? 'Search by name / category / author / pinyin…'
        : '搜索游戏名 / 分类 / 作者 / 拼音...';
}
updateSearchPlaceholder();

window.addEventListener('langChanged', () => {
    updateSearchPlaceholder();
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
            window.leleleTrack('play-game_' + game.id);
        }
        // 统一走独立播放器 play.html（与详情页「开始游戏」一致），不再 window.open 直链
        window.location.href = `play.html?id=${game.id}${isEn ? '&lang=en' : '&lang=zh'}`;
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
    
    const wasFav = favs.includes(gameId);
    if (wasFav) {
        favs = favs.filter(id => id !== gameId);
    } else {
        favs.push(gameId);
    }
    
    saveFavorites(favs);
    updateFavUI(gameId);
    if (typeof window.trackFavorite === 'function') window.trackFavorite(gameId, wasFav ? 'unfav' : 'fav');
};

// 排行榜卡片/弹窗的收藏按钮：按 id 切换，并就地更新所有同 id 按钮（独立于预览弹窗状态）
window.toggleRankFav = function(gameId) {
    const id = String(gameId == null ? '' : gameId);
    if (!id) return;
    let favs = getFavorites();
    const wasFav = favs.includes(id);
    favs = wasFav ? favs.filter(f => f !== id) : favs.concat([id]);
    saveFavorites(favs);
    // 同步预览弹窗按钮（若正打开同一游戏）
    if (currentPreviewGame && String(currentPreviewGame.id) === id) updateFavUI(id);
    // 就地更新排行榜里所有该 id 的收藏按钮
    document.querySelectorAll('[data-rank-fav="' + id + '"]').forEach(btn => {
        const nowFav = favs.includes(id);
        btn.classList.toggle('is-fav', nowFav);
        btn.setAttribute('aria-pressed', nowFav ? 'true' : 'false');
        btn.innerHTML = nowFav
            ? '<span class="zh-inline">🌟 已收藏</span><span class="en-inline">🌟 Favorited</span>'
            : '<span class="zh-inline">⭐ 收藏</span><span class="en-inline">⭐ Favorite</span>';
    });
    if (typeof window.trackFavorite === 'function') window.trackFavorite(id, wasFav ? 'unfav' : 'fav');
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
        
        // 4.0.14：直接把表单页赋给 iframe.src（原来只有 data-tally-src，
        // 且仅靠 Tally.loadEmbeds() 赋值，境外脚本挂起时弹窗永远纯白）
        const container = document.getElementById('tallyContainer');
        if (typeof window.mountTallyIframe === 'function') {
            window.mountTallyIframe(container, finalUrl, {
                title: isEn ? 'Lelele Game · Game Submission Form' : '了了了游 · 投稿表单',
                height: 1120
            });
        } else {
            container.innerHTML = `<iframe src="${finalUrl}" loading="eager" width="100%" height="1120" frameborder="0" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        }
        closeModal('stepAuth');
        openModal('stepTally');
    };
}

// 仅校验 origin 不够：另一个标签页可以拿到本站 window 引用并伪造消息。
// 必须确认消息来自本页实际嵌入的 Tally iframe。
function isOurTallyEmbedSource(source) {
    if (!source) return false;
    var frames = document.querySelectorAll('iframe[src*="tally.so/embed/"]');
    for (var i = 0; i < frames.length; i++) {
        if (frames[i].contentWindow === source) return true;
    }
    return false;
}

window.addEventListener("message", function(event) {
    var origin = event.origin || '';
    var host = '';
    try { host = new URL(origin).hostname.toLowerCase(); } catch (e) { return; }
    // 精确域：tally.so 或其子域；tally.so.evil.com 之类不算命中
    if (host !== 'tally.so' && host.slice(-9) !== '.tally.so') return;
    if (!isOurTallyEmbedSource(event.source)) return;
    var d = event.data;
    if (d && (d === 'tally-form-submitted' || (typeof d === 'object' && d.type === 'tally-form-submitted'))) {
        document.querySelectorAll('.modal-overlay.active').forEach(el => el.classList.remove('active'));
        alert('提交成功！我们将尽快审核.\nSubmitted successfully! We will review it soon.');
        window.location.href = window.location.pathname + "?submitted=1";
    }
});

// ==================== 排行榜逻辑 ====================
(function() {
    const rankLang = {
        zh: { title: '游戏排名', subtitle: '全站热度榜', more: '查看更多', modalTitle: '前 25 名排行', noData: '暂无数据', played: '次', favUnit: '收藏', points: '排行点', view: '查看详情', tabTotal: '总榜', tabFav: '收藏榜', tabPlay: '游玩榜' },
        en: { title: 'Top Games', subtitle: 'Global popularity ranking', more: 'View More', modalTitle: 'Top 25 Ranking', noData: 'No data available', played: 'plays', favUnit: 'favorites', points: 'rank points', view: 'Details', tabTotal: 'Overall', tabFav: 'Favorites', tabPlay: 'Plays' }
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

    // 排行榜卡片的收藏按钮（复用 getFavorites，data-rank-fav 供 toggleRankFav 就地刷新）
    function rankFavBtn(item) {
        if (!item.id) return '';
        const favs = getFavorites();
        const isFav = favs.includes(String(item.id));
        const id = String(item.id);
        return `<button type="button" class="rank-fav-btn${isFav ? ' is-fav' : ''}" data-rank-fav="${id}" aria-pressed="${isFav ? 'true' : 'false'}" aria-label="${escapeHtml(item.name || '')} - ${t('favUnit')}" title="${t('favUnit')}" onclick="event.stopPropagation(); window.toggleRankFav('${id}');"><span class="zh-inline">${isFav ? '🌟 已收藏' : '⭐ 收藏'}</span><span class="en-inline">${isFav ? '🌟 Favorited' : '⭐ Favorite'}</span></button>`;
    }
    // 可点击作者名（跳作者主页）
    function rankAuthor(item) {
        if (!item.authorName) return '';
        const label = '<span class="zh-inline">作者：</span><span class="en-inline">By </span>' + escapeHtml(item.authorName);
        // 外部原作者（字符串名）无作者主页：显示纯文本，不给死链
        if (!item.authorUrl) return `<span class="rank-author rank-author-plain">${label}</span>`;
        return `<a class="rank-author" href="${item.authorUrl}" onclick="event.stopPropagation();">${label}</a>`;
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
                <div class="rank-card rank-${rankLevel}" role="link" tabindex="0" onclick="window.location.href='${detailUrl}'" onkeydown="if(event.key==='Enter'){window.location.href='${detailUrl}'}">
                    <div class="rank-card-header"><div class="rank-medal">${medal}</div><div class="rank-tag">No.${rankLevel}</div></div>
                    <div class="rank-main"><div class="rank-icon">${item.icon || '🎮'}</div><div class="rank-name">${escapeHtml(name)}</div></div>
                    <div class="rank-author-row">${rankAuthor(item)}</div>
                    <div class="rank-meta"><div class="rank-count">${Number(item.count).toLocaleString()} <small>${t('points')}</small></div><div class="rank-actions">${rankFavBtn(item)}<a href="${detailUrl}" class="rank-link" onclick="event.stopPropagation();">${t('view')}</a></div></div>
                </div>
            `;
        }).join('');
    }

    function renderModal(items, unitKey) {
        const list = document.getElementById('rankModalList');
        if (!list) return;
        const unit = unitKey ? t(unitKey) : t('played');
        const top25 = items.slice(0, 25);
        list.innerHTML = top25.map((item, index) => {
            const detailUrl = item.url || '#';
            return `
                <li class="rank-modal-row">
                    <div class="rank-modal-index">${index + 1}</div>
                    <div class="rank-modal-game">
                        <div class="rank-modal-name">${escapeHtml(item.name || 'Unknown')}</div>
                        <div class="rank-modal-author">${rankAuthor(item)}</div>
                    </div>
                    <div class="rank-modal-count">${Number(item.count).toLocaleString()} <small>${unit}</small></div>
                    <div class="rank-modal-actions">${rankFavBtn(item)}<a href="${detailUrl}" class="rank-modal-link" onclick="event.stopPropagation();">${t('view')}</a></div>
                </li>
            `;
        }).join('');
    }

    function syncTexts() {
        const nodes = document.querySelectorAll('[data-i18n]');
        const map = { rankTitle: t('title'), rankSubtitle: t('subtitle'), rankMore: t('more'), rankModalTitle: t('modalTitle') };
        ['total', 'fav', 'play'].forEach(k => {
            const btn = document.querySelector('[data-rank-tab="' + k + '"]');
            if (btn) btn.textContent = t('tab' + k.charAt(0).toUpperCase() + k.slice(1));
        });
        nodes.forEach(node => { const key = node.getAttribute('data-i18n'); if (map[key]) node.textContent = map[key]; });
    }

    let _rankMapped = [];
    let _activeRankTab = 'total';
    function renderActiveRankModal() {
        const list = _activeRankTab === 'fav' ? _rankMapped.filter(x => x.fav > 0).map(x => ({ ...x, count: x.fav })).sort((a, b) => b.count - a.count)
            : _activeRankTab === 'play' ? _rankMapped.filter(x => x.play > 0).map(x => ({ ...x, count: x.play })).sort((a, b) => b.count - a.count)
            : _rankMapped;
        renderModal(list, _activeRankTab === 'fav' ? 'favUnit' : (_activeRankTab === 'play' ? 'played' : 'points'));
    }

    function bindModal() {
        const openBtn = document.getElementById('openRankModalBtn');
        const modal = document.getElementById('rankModalOverlay');
        const closeBtn = document.getElementById('rankModalCloseBtn');
        if (!openBtn || !modal || !closeBtn) return;

        openBtn.addEventListener('click', () => modal.classList.add('active'));
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.remove('active'); });
        document.querySelectorAll('[data-rank-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                _activeRankTab = btn.getAttribute('data-rank-tab');
                document.querySelectorAll('[data-rank-tab]').forEach(b => b.classList.toggle('active', b === btn));
                renderActiveRankModal();
            });
        });
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
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 8000);
                const res = await fetch(ANALYTICS_API, { signal: ctrl.signal, cache: 'no-store' });
                clearTimeout(timer);
                if (!res.ok) throw new Error('fetch failed');
                const json = await res.json();
                // 缓存原始事件：id→名称映射依赖游戏目录，必须在目录加载后统一归一化再合并
                _analyticsCache = json.breakdowns?.event || [];
                _analyticsTime = now;
            }

            if (!_analyticsCache.length) { _rankMapped = []; renderEmpty(); return; }

            if (!catalogCache.length) catalogCache = await fetchCatalog();
            // 作者名兜底：排行榜可能与 loadGames 并行启动，authorsData 尚未填充时单独拉一次
            if ((!authorsData || !authorsData.length) && typeof window.fetchAuthors === 'function') {
                try { authorsData = await window.fetchAuthors() || []; } catch (e) {}
            }

            const lookup = new Map();
            catalogCache.forEach(game => {
                // 注册当前名 + 历史旧名（previousNames）→ 游戏；旧名事件（play-game_<旧名>）
                // 与新 id 事件（play-game_<id>）都能归一到同一 id，改名不再丢失历史游玩数。
                const names = [game.name_zh, game.name_en, game.name, game.title]
                    .concat(Array.isArray(game.previousNames) ? game.previousNames : [])
                    .filter(Boolean);
                names.forEach(n => lookup.set(normalizeName(n), game));
                if (game.id) lookup.set(String(game.id), game);
            });

            // 核心修复：收藏事件用游戏 id，游玩事件用游戏名 —— 先都归一到同一「游戏 id」，再合并计数
            const playCounts = new Map(), favCounts = new Map();
            const keyOf = (raw) => {
                const g = lookup.get(String(raw)) || lookup.get(normalizeName(raw));
                return g ? String(g.id) : String(raw);
            };
            _analyticsCache.forEach(item => {
                const name = String(item?.name || '');
                const value = Number(item?.value || 0);
                if (/^play-game[_\s-]/i.test(name)) {
                    const raw = name.replace(/^play-game[_\s-]*/i, '').trim();
                    if (raw) { const k = keyOf(raw); playCounts.set(k, (playCounts.get(k) || 0) + value); }
                } else if (/^fav-game_/i.test(name)) {
                    const raw = name.slice(9);
                    if (raw) { const k = keyOf(raw); favCounts.set(k, (favCounts.get(k) || 0) + value); }
                } else if (/^unfav-game_/i.test(name)) {
                    const raw = name.slice(11);
                    if (raw) { const k = keyOf(raw); favCounts.set(k, (favCounts.get(k) || 0) - value); }
                }
            });
            const allKeys = new Set([...playCounts.keys(), ...favCounts.keys()]);
            const isEn = getCurrentLang() === 'en';
            const mapped = Array.from(allKeys).map(key => {
                const g = lookup.get(key);
                const fav = Math.max(0, favCounts.get(key) || 0);
                const play = Math.max(0, playCounts.get(key) || 0);
                const authorId = g ? (g.authorId || g.author) : null;
                const authorObj = authorId != null ? authorsData.find(a => String(a.id) === String(authorId)) : null;
                return {
                    id: g ? g.id : null,
                    name: g ? (isEn ? (g.name_en || g.name_zh || g.name) : (g.name_zh || g.name_en || g.name)) : key,
                    icon: g ? (g.icon || '🎮') : '🎮',
                    count: fav * 5 + play,
                    play, fav,
                    url: g ? getGameDetailUrl(g.id) : null,
                    authorId: authorId != null ? String(authorId) : null,
                    authorName: authorObj ? (isEn ? (authorObj.name_en || authorObj.name_zh) : (authorObj.name_zh || authorObj.name_en)) : (authorId != null ? String(authorId) : null),
                    // 外部原作者（字符串名，无平台作者档案）不生成死链，只显示纯文本
                    authorUrl: authorObj ? `author.html?id=${encodeURIComponent(authorObj.id)}${isEn ? '&lang=en' : ''}` : null
                };
            }).filter(item => item.name && item.url).sort((a, b) => b.count - a.count);

            _rankMapped = mapped;
            renderTop3(mapped);
            renderActiveRankModal();
        } catch (e) {
            console.warn('rank fetch failed', e);
            renderEmpty();
        }
    }

    function initRanking() {
        bindModal(); syncTexts(); refreshRankings();
        setInterval(refreshRankings, 10 * 60 * 1000);
    }

    leleleOnReady( initRanking);
    window.addEventListener('langChanged', () => { syncTexts(); refreshRankings(); });
})();

// ==================== 页面初始化 ====================
leleleOnReady( () => {
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

    bindWeeklyNav();

    // 随机游玩：从已加载的游戏数据中随机挑一个跳转到详情页
    const randomBtn = document.getElementById('randomPlayBtn');
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            if (!gameData || !gameData.length) { if (window.toast) window.toast('数据加载中…'); return; }
            const scope = (document.getElementById('randomFilter') || {}).value || 'all';
            const pool = scope === 'all' ? gameData : gameData.filter(g => g.type === scope);
            if (!pool.length) { if (window.toast) window.toast('该范围内暂无游戏'); return; }
            const item = pool[Math.floor(Math.random() * pool.length)];
            const isEn = document.documentElement.getAttribute('data-lang') === 'en';
            window.location.href = 'game.html?id=' + encodeURIComponent(item.id) + (isEn ? '&lang=en' : '');
        });
    }

});

// 返回顶部按钮（#33）
(function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    const sync = () => btn.classList.toggle('show', window.scrollY > 400);
    window.addEventListener('scroll', sync, { passive: true });
    sync();
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();
