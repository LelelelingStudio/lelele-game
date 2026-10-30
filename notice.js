/* ==========================================================================
 * 开发者定向告示弹窗  notice.js
 * 数据源：/noticetodeveloper.json
 * 仅当「已登录」且「登录账号对应的作者 ID」与告示的 author 匹配时才显示。
 * 作者 ID 映射：Supabase session.user.id (uuid) -> authors.surge.sh/authors.json 的 id
 * 支持内容：标题 / 正文 / 图片 / 视频（直链或 B站、YouTube、Vimeo 链接）/ 按钮
 * ========================================================================== */
(function () {
    'use strict';

    const NOTICE_URL = 'noticetodeveloper.json';
    const AUTHORS_URL = 'https://authors.surge.sh/authors.json';
    const SEEN_PREFIX = 'lelele_notice_seen_';
    const AUTO_OPEN_DELAY = 800;

    const VIDEO_FILE_RE = /\.(mp4|webm|ogv|ogg|mov|m4v|m3u8)(?:$|[?#])/i;

    function getLang() {
        if (typeof window.getLang === 'function') { try { return window.getLang(); } catch (e) {} }
        const attr = document.documentElement.getAttribute('data-lang');
        if (attr) return attr;
        try {
            const saved = localStorage.getItem('lelele_lang');
            if (saved) return saved;
        } catch (e) {}
        return (navigator.language || 'zh').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
    }

    function esc(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function pick(obj, base) {
        const en = getLang() === 'en';
        if (en) return obj[base + '_en'] || obj[base + '_zh'] || obj[base] || '';
        return obj[base + '_zh'] || obj[base + '_en'] || obj[base] || '';
    }

    function isDirectVideo(url) {
        return !!url && typeof url === 'string' && VIDEO_FILE_RE.test(url.trim());
    }

    // 把平台链接转成可内嵌的地址
    function toEmbedUrl(url) {
        if (!url) return '';
        let u;
        try { u = new URL(url, location.href); } catch (e) { return ''; }
        const host = u.hostname.replace(/^www\./, '').toLowerCase();
        if (host === 'player.bilibili.com') return u.href;
        if (host === 'bilibili.com' || host === 'm.bilibili.com' || host === 'b23.tv') {
            const bv = u.pathname.match(/\/video\/(BV[0-9A-Za-z]+)/);
            const av = u.pathname.match(/\/video\/av(\d+)/i);
            const bvid = bv ? bv[1] : (u.searchParams.get('bvid') || '');
            const aid = av ? av[1] : (u.searchParams.get('aid') || '');
            if (bvid) return '//player.bilibili.com/player.html?bvid=' + bvid + '&high_quality=1&autoplay=0';
            if (aid) return '//player.bilibili.com/player.html?aid=' + aid + '&high_quality=1&autoplay=0';
            return '';
        }
        if (host === 'youtu.be' || host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
            let id = '';
            if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
            else if (u.pathname === '/watch') id = u.searchParams.get('v') || '';
            else { const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([0-9A-Za-z_-]+)/); id = m ? m[1] : ''; }
            return id ? 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?rel=0' : '';
        }
        if (host === 'vimeo.com' || host === 'player.vimeo.com') {
            const m = u.pathname.match(/(\d+)/);
            return m ? 'https://player.vimeo.com/video/' + m[1] : '';
        }
        return '';
    }

    // ---------- 作者身份解析 ----------
    async function resolveAuthorId(session) {
        try {
            const res = await fetch(AUTHORS_URL + '?t=' + Date.now(), { cache: 'no-store' });
            if (!res.ok) return null;
            const list = await res.json();
            const me = list.find(a => a.uuid && String(a.uuid) === String(session.user.id));
            return me ? String(me.id) : null;
        } catch (e) {
            console.warn('[notice] authors 映射拉取失败', e);
            return null;
        }
    }

    // ---------- 匹配规则 ----------
    function matchAuthor(noticeAuthor, myId) {
        if (noticeAuthor === undefined || noticeAuthor === null || noticeAuthor === '') return false;
        const targets = Array.isArray(noticeAuthor) ? noticeAuthor : [noticeAuthor];
        return targets.some(t => {
            const s = String(t);
            return s === '*' || s.toLowerCase() === 'all' || s === String(myId);
        });
    }

    function inTimeWindow(n) {
        const now = Date.now();
        if (n.startAt) {
            const t = Date.parse(n.startAt);
            if (!isNaN(t) && now < t) return false;
        }
        if (n.endAt) {
            const t = Date.parse(n.endAt);
            if (!isNaN(t) && now > t) return false;
        }
        return true;
    }

    function alreadySeen(n) {
        if (n.oncePerUser === false) return false;
        try { return localStorage.getItem(SEEN_PREFIX + n.id) === '1'; } catch (e) { return false; }
    }

    function markSeen(n) {
        try { localStorage.setItem(SEEN_PREFIX + n.id, '1'); } catch (e) {}
    }

    // ---------- 样式 ----------
    function injectStyles() {
        if (document.getElementById('lelele-notice-style')) return;
        const s = document.createElement('style');
        s.id = 'lelele-notice-style';
        s.textContent = `
        .llnotice-mask{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(6px);
            -webkit-backdrop-filter:blur(6px);z-index:99990;display:flex;align-items:center;justify-content:center;
            padding:20px;opacity:0;transition:opacity .25s;}
        .llnotice-mask.show{opacity:1;}
        .llnotice{width:100%;max-width:560px;max-height:88vh;overflow-y:auto;background:var(--card-bg,#fff);
            color:var(--text-main,#1f2937);border:1px solid var(--card-border,rgba(148,163,184,.25));
            border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.28);padding:26px 24px;position:relative;
            transform:translateY(14px) scale(.98);transition:transform .25s;font-family:inherit;}
        .llnotice-mask.show .llnotice{transform:none;}
        .llnotice h3{margin:0 0 4px;font-size:1.28rem;line-height:1.35;padding-right:34px;}
        .llnotice .llnotice-badge{display:inline-block;font-size:.72rem;font-weight:700;letter-spacing:.04em;
            color:#4f46e5;background:rgba(79,70,229,.1);padding:3px 9px;border-radius:20px;margin-bottom:10px;}
        .llnotice .llnotice-body{font-size:.95rem;line-height:1.75;color:var(--text-muted,#475569);
            white-space:pre-wrap;margin:12px 0 0;}
        .llnotice .llnotice-media{margin-top:16px;display:flex;flex-direction:column;gap:12px;}
        .llnotice .llnotice-media img,.llnotice .llnotice-media video{width:100%;border-radius:12px;display:block;
            background:#000;max-height:300px;object-fit:contain;}
        .llnotice .llnotice-media iframe{width:100%;aspect-ratio:16/9;border:0;border-radius:12px;background:#000;}
        .llnotice .llnotice-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;}
        .llnotice .llnotice-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;
            padding:11px 22px;border-radius:28px;font-size:.94rem;font-weight:700;text-decoration:none;
            cursor:pointer;border:none;font-family:inherit;transition:transform .15s,opacity .15s;}
        .llnotice .llnotice-btn:hover{transform:translateY(-1px);opacity:.92;}
        .llnotice .llnotice-btn.primary{background:#4f46e5;color:#fff;box-shadow:0 6px 16px rgba(79,70,229,.3);}
        .llnotice .llnotice-btn.ghost{background:rgba(148,163,184,.16);color:var(--text-main,#1f2937);}
        .llnotice .llnotice-close{position:absolute;top:12px;right:14px;background:none;border:none;
            font-size:1.6rem;line-height:1;color:var(--text-muted,#94a3b8);cursor:pointer;padding:4px 8px;
            border-radius:8px;font-family:inherit;}
        .llnotice .llnotice-close:hover{background:rgba(148,163,184,.15);color:var(--text-main,#1f2937);}
        .llnotice .llnotice-progress{font-size:.8rem;color:var(--text-muted,#94a3b8);margin-top:14px;text-align:right;}
        @media(max-width:520px){.llnotice{padding:22px 18px;max-height:92vh;}.llnotice h3{font-size:1.12rem;}}
        `;
        document.head.appendChild(s);
    }

    // ---------- 渲染 ----------
    function renderMedia(media) {
        if (!Array.isArray(media)) return '';
        return media.map(m => {
            if (!m || !m.src) return '';
            const src = esc(m.src);
            if (m.type === 'video') {
                if (isDirectVideo(m.src)) {
                    return '<video controls playsinline preload="metadata"' + (m.poster ? ' poster="' + esc(m.poster) + '"' : '') + ' src="' + src + '"></video>';
                }
                const emb = toEmbedUrl(m.src);
                return emb ? '<iframe src="' + esc(emb) + '" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>' : '';
            }
            if (m.type === 'embed') {
                const emb = toEmbedUrl(m.src) || m.src;
                return '<iframe src="' + esc(emb) + '" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
            }
            // 默认视为图片
            return '<img src="' + src + '" alt="' + esc(m.alt || '') + '" loading="lazy">';
        }).join('');
    }

    function showNotice(notice, queue, index) {
        injectStyles();
        const en = getLang() === 'en';
        const mask = document.createElement('div');
        mask.className = 'llnotice-mask';
        const dismissible = notice.dismissible !== false;

        const buttons = (Array.isArray(notice.buttons) ? notice.buttons : []).filter(b => b && b.url).map(b => {
            const style = b.style === 'ghost' ? 'ghost' : 'primary';
            const target = b.target || '_blank';
            const rel = target === '_blank' ? ' rel="noopener noreferrer"' : '';
            return '<a class="llnotice-btn ' + style + '" href="' + esc(b.url) + '" target="' + esc(target) + '"' + rel + '>' + esc(pick(b, 'text')) + '</a>';
        }).join('');

        const total = queue.length;
        const progress = total > 1 ? '<div class="llnotice-progress">' + (index + 1) + ' / ' + total + '</div>' : '';

        mask.innerHTML =
            '<div class="llnotice" role="dialog" aria-modal="true" aria-label="' + esc(pick(notice, 'title')) + '">' +
            (dismissible ? '<button class="llnotice-close" type="button" aria-label="Close">&times;</button>' : '') +
            '<div class="llnotice-badge">' + (en ? 'NOTICE FOR YOU' : '开发者专属告示') + '</div>' +
            '<h3>' + esc(pick(notice, 'title')) + '</h3>' +
            '<div class="llnotice-body">' + esc(pick(notice, 'body')) + '</div>' +
            (notice.media && notice.media.length ? '<div class="llnotice-media">' + renderMedia(notice.media) + '</div>' : '') +
            (buttons ? '<div class="llnotice-actions">' + buttons + '</div>' : '') +
            progress +
            '</div>';

        document.body.appendChild(mask);
        requestAnimationFrame(() => mask.classList.add('show'));

        const close = () => {
            markSeen(notice);
            mask.classList.remove('show');
            setTimeout(() => {
                mask.remove();
                if (queue[index + 1]) setTimeout(() => showNotice(queue[index + 1], queue, index + 1), 260);
            }, 240);
        };

        if (dismissible) {
            mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
            const btn = mask.querySelector('.llnotice-close');
            if (btn) btn.addEventListener('click', close);
            document.addEventListener('keydown', function onKey(e) {
                if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); close(); }
            });
        }
    }

    // ---------- 入口 ----------
    async function init() {
        // 游戏 iframe 页面（/game/xxx/）不注入，避免干扰游戏本体
        if (location.pathname.indexOf('/game/') === 0) return;
        if (!window.supabaseClient) return;

        let session = null;
        try {
            const { data } = await window.supabaseClient.auth.getSession();
            session = data ? data.session : null;
        } catch (e) { return; }
        if (!session) return; // 未登录：整站不显示任何告示

        const myId = await resolveAuthorId(session);
        if (!myId) return;

        let payload = null;
        try {
            const res = await fetch(NOTICE_URL + '?t=' + Date.now(), { cache: 'no-store' });
            if (!res.ok) return;
            payload = await res.json();
        } catch (e) { return; }

        const list = Array.isArray(payload) ? payload : (payload.notices || []);
        const mine = list
            .filter(n => n && n.enabled !== false)
            .filter(n => matchAuthor(n.author, myId))
            .filter(inTimeWindow)
            .filter(n => !alreadySeen(n))
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        if (!mine.length) return;

        window.leleleShowNotices = () => { if (mine[0]) showNotice(mine[0], mine, 0); };
        setTimeout(() => window.leleleShowNotices(), AUTO_OPEN_DELAY);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
