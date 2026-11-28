/* ==========================================================================
 * lelele-game · 分享卡图（纯前端 canvas）
 *
 * 为什么不是「动态 og:image」：
 *   微信 / Discord / 推特抓的是服务器返回的静态 HTML，**不会执行页面 JS**，
 *   所以每款游戏一个动态预览图在前端做不到（需要服务端按 id 生成）。
 *   折中：这里给玩家一张可以自己保存 / 发群里的 1200x630 卡图，
 *   页面的 og:image 用站点默认图兜底。
 *
 * 4.7.5 更新：
 *   1) 作者不再直接印数字 id（以前会印出「作者 1」），改成查 authors/index.json
 *      拿昵称（id=1 → 了了了岭工作室），查不到就不显示作者，而不是印一个数字。
 *   2) 下载前可以选配色（6 套），卡图右下角固定带「了了了游」水印 + 域名。
 * ========================================================================== */
(function () {
    'use strict';

    var W = 1200, H = 630;

    /* 配色：from→to 是竖向渐变，ink 正文色，sub 副标题色，badge 水印牌底色 */
    var THEMES = [
        {
            id: 'midnight', zh: '紫夜', en: 'Midnight',
            from: '#4f46e5', to: '#0b1020', ink: '#ffffff', sub: 'rgba(199,210,254,0.95)',
            faint: 'rgba(148,163,184,0.85)', badge: 'rgba(255,255,255,0.14)', badgeInk: '#ffffff'
        },
        {
            id: 'ocean', zh: '深海', en: 'Ocean',
            from: '#0ea5e9', to: '#08243f', ink: '#ffffff', sub: 'rgba(186,230,253,0.95)',
            faint: 'rgba(186,230,253,0.8)', badge: 'rgba(255,255,255,0.14)', badgeInk: '#ffffff'
        },
        {
            id: 'jade', zh: '青玉', en: 'Jade',
            from: '#0d9488', to: '#042f2e', ink: '#ffffff', sub: 'rgba(153,246,228,0.95)',
            faint: 'rgba(153,246,228,0.8)', badge: 'rgba(255,255,255,0.14)', badgeInk: '#ffffff'
        },
        {
            id: 'forest', zh: '森野', en: 'Forest',
            from: '#22c55e', to: '#0b2e1a', ink: '#ffffff', sub: 'rgba(187,247,208,0.95)',
            faint: 'rgba(187,247,208,0.8)', badge: 'rgba(255,255,255,0.14)', badgeInk: '#ffffff'
        },
        {
            id: 'sunset', zh: '落日', en: 'Sunset',
            from: '#f97316', to: '#5c1a05', ink: '#ffffff', sub: 'rgba(254,215,170,0.95)',
            faint: 'rgba(254,215,170,0.8)', badge: 'rgba(255,255,255,0.16)', badgeInk: '#ffffff'
        },
        {
            id: 'paper', zh: '纸白', en: 'Paper',
            from: '#f8fafc', to: '#dbeafe', ink: '#0f172a', sub: '#3b4b6b',
            faint: 'rgba(71,85,105,0.75)', badge: 'rgba(79,70,229,0.12)', badgeInk: '#4338ca'
        }
    ];

    var DEFAULT_THEME = 'midnight';

    function isEn() { return document.documentElement.getAttribute('data-lang') === 'en'; }
    function t(zh, en) { return isEn() ? en : zh; }
    function themeLabel(th) { return isEn() ? th.en : th.zh; }
    function findTheme(id) {
        for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
        return THEMES[0];
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function wrapText(ctx, text, maxWidth) {
        // 中文没有空格，按字符折行；英文尽量按空格折
        var lines = [], line = '';
        var hasSpace = /\s/.test(text);
        var units = hasSpace ? text.split(/(\s+)/) : Array.from(text);
        for (var i = 0; i < units.length; i++) {
            var test = line + units[i];
            if (ctx.measureText(test).width > maxWidth && line) {
                lines.push(line);
                line = units[i].replace(/^\s+/, '');
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
        return lines;
    }

    var FONT = '-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';

    function drawCard(game, theme) {
        var th = theme || findTheme(DEFAULT_THEME);
        var canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        var ctx = canvas.getContext('2d');
        var en = isEn();

        // 背景渐变
        var g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, th.from);
        g.addColorStop(1, th.to);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // 装饰圆（纸白主题用淡紫，其它用白）
        var deco = th.id === 'paper' ? 'rgba(79,70,229,0.10)' : 'rgba(255,255,255,0.06)';
        ctx.fillStyle = deco;
        ctx.beginPath(); ctx.arc(1010, 90, 240, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(1140, 560, 200, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = th.id === 'paper' ? 'rgba(79,70,229,0.06)' : 'rgba(255,255,255,0.04)';
        ctx.beginPath(); ctx.arc(90, 590, 170, 0, Math.PI * 2); ctx.fill();

        // 图标（衬一块圆角底，避免 emoji 在深色渐变上糊掉）
        roundRect(ctx, 64, 66, 184, 184, 36);
        ctx.fillStyle = th.id === 'paper' ? 'rgba(79,70,229,0.10)' : 'rgba(255,255,255,0.14)';
        ctx.fill();
        ctx.font = '112px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(game.icon || '🎮', 156, 160);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // 游戏名（自动缩字号 + 最多两行）
        var name = en ? (game.name_en || game.name_zh || '') : (game.name_zh || game.name_en || '');
        var size = name.length > 12 ? 72 : 92;
        ctx.fillStyle = th.ink;
        ctx.font = '700 ' + size + 'px ' + FONT;
        var lines = wrapText(ctx, name, W - 340);
        lines.slice(0, 2).forEach(function (line, i) {
            ctx.fillText(line, 280, 84 + i * (size + 12));
        });

        // 副标题：分类 · 作者昵称（没有昵称就只留分类，绝不印数字 id）
        var cat = en ? (game.category_en || '') : (game.category_zh || '');
        var parts = [];
        if (cat) parts.push(cat);
        if (game.__authorName) parts.push((en ? 'by ' : '作者 ') + game.__authorName);
        var sub = parts.join(' · ');
        ctx.font = '500 40px ' + FONT;
        ctx.fillStyle = th.sub;
        if (sub) ctx.fillText(sub, 280, 84 + Math.min(lines.length, 2) * (size + 12) + 8);

        // 标语
        ctx.font = '600 46px ' + FONT;
        ctx.fillStyle = th.ink;
        ctx.fillText(t('点开就能玩，不用注册', 'Play right away — no sign-up'), 80, 400);

        // 底部域名
        ctx.font = '600 34px ' + FONT;
        ctx.fillStyle = th.faint;
        ctx.fillText('game.leleleling.site', 80, 470);
        ctx.font = '700 26px ' + FONT;
        ctx.fillStyle = th.sub;
        ctx.fillText('lelele Game', 80, 522);

        // 水印：右下角圆角牌 + 小方章，任何配色都固定带「了了了游」
        var badgeW = 236, badgeH = 78, bx = W - badgeW - 62, by = H - badgeH - 56;
        roundRect(ctx, bx, by, badgeW, badgeH, 18);
        ctx.fillStyle = th.badge;
        ctx.fill();
        // 印章感 logo：细边圆角方框 + 一个「了」字，比纯色方块更像 mark
        roundRect(ctx, bx + 20, by + 21, 36, 36, 9);
        ctx.strokeStyle = th.badgeInk;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = '700 23px ' + FONT;
        ctx.fillStyle = th.badgeInk;
        ctx.fillText('了', bx + 38, by + badgeH / 2 + 1);
        ctx.textAlign = 'left';
        ctx.font = '700 29px ' + FONT;
        ctx.fillText('了了了游', bx + 68, by + badgeH / 2 + 1);
        ctx.textBaseline = 'top';

        return canvas;
    }

    /* ---------- 作者 id → 昵称 ---------- */
    function resolveAuthorName(game) {
        var raw = game.author;
        if (!raw) return Promise.resolve('');
        var isNumeric = typeof raw === 'number' || /^\d+$/.test(String(raw));
        if (!isNumeric) return Promise.resolve(String(raw));
        var en = isEn();
        return fetch('/authors/index.json', { cache: 'force-cache' })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (list) {
                if (!Array.isArray(list)) return '';
                for (var i = 0; i < list.length; i++) {
                    if (String(list[i].id) === String(raw)) {
                        var nm = en ? (list[i].name_en || list[i].name_zh) : (list[i].name_zh || list[i].name_en);
                        return nm || '';
                    }
                }
                return '';
            })
            .catch(function () { return ''; });
    }

    /* ---------- 面板样式（自带，避免和其它页面的 CSS 打架） ---------- */
    var STYLE_ID = 'lelele-sharecard-style';
    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        var st = document.createElement('style');
        st.id = STYLE_ID;
        st.textContent = [
            '.sc-mask{position:fixed;inset:0;z-index:99998;background:rgba(15,23,42,.55);display:flex;',
            ' align-items:center;justify-content:center;padding:20px;box-sizing:border-box;',
            ' -webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);}',
            '.sc-panel{width:min(640px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;',
            ' padding:18px 18px 14px;box-sizing:border-box;box-shadow:0 20px 60px rgba(15,23,42,.35);',
            ' font-family:' + FONT + ';color:#0f172a;}',
            '.sc-panel h3{margin:0 0 4px;font-size:1rem;font-weight:800;}',
            '.sc-panel p{margin:0 0 12px;font-size:.8rem;color:#64748b;}',
            '.sc-preview{width:100%;border-radius:12px;display:block;background:#0b1020;',
            ' border:1px solid rgba(148,163,184,.25);}',
            '.sc-swatches{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 4px;}',
            '.sc-sw{border:2px solid transparent;border-radius:10px;padding:0;cursor:pointer;width:74px;height:44px;',
            ' display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;color:#fff;',
            ' text-shadow:0 1px 2px rgba(0,0,0,.45);box-shadow:0 2px 8px rgba(15,23,42,.12);}',
            '.sc-sw[data-on="1"]{border-color:#4338ca;box-shadow:0 0 0 3px rgba(67,56,202,.18);}',
            '.sc-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:14px;}',
            '.sc-btn{font:inherit;font-size:.86rem;font-weight:700;border-radius:10px;padding:9px 16px;',
            ' border:1px solid transparent;cursor:pointer;}',
            '.sc-btn--primary{background:#4f46e5;color:#fff;}',
            '.sc-btn--primary:hover{background:#4338ca;}',
            '.sc-btn--ghost{background:#f1f5f9;color:#334155;border-color:#e2e8f0;}',
            'html.dark-mode .sc-panel{background:#111827;color:#e2e8f0;}',
            'html.dark-mode .sc-panel p{color:#94a3b8;}',
            'html.dark-mode .sc-btn--ghost{background:#1f2937;color:#e2e8f0;border-color:#374151;}',
            '@media (max-width:520px){.sc-sw{width:58px;height:38px;font-size:.66rem;}}'
        ].join('\n');
        document.head.appendChild(st);
    }

    var currentThemeId = DEFAULT_THEME;
    try { currentThemeId = localStorage.getItem('lelele_share_card_theme') || DEFAULT_THEME; } catch (e) {}

    function openPanel(game) {
        injectStyle();
        var mask = document.createElement('div');
        mask.className = 'sc-mask';
        mask.innerHTML =
            '<div class="sc-panel" role="dialog" aria-modal="true" aria-label="' + t('分享图', 'Share card') + '">' +
            '<h3>' + t('分享图', 'Share card') + '</h3>' +
            '<p>' + t('选个配色，右下角一直带「了了了游」水印。', 'Pick a palette — the “了了了游” watermark stays on the card.') + '</p>' +
            '<canvas class="sc-preview" width="1200" height="630"></canvas>' +
            '<div class="sc-swatches" role="radiogroup"></div>' +
            '<div class="sc-actions">' +
            '<button type="button" class="sc-btn sc-btn--ghost" data-act="close">' + t('关闭', 'Close') + '</button>' +
            '<button type="button" class="sc-btn sc-btn--primary" data-act="save">' + t('下载图片', 'Download') + '</button>' +
            '</div></div>';

        var preview = mask.querySelector('.sc-preview');
        var pctx = preview.getContext('2d');
        var swWrap = mask.querySelector('.sc-swatches');

        function paint(id) {
            currentThemeId = id;
            try { localStorage.setItem('lelele_share_card_theme', id); } catch (e) {}
            pctx.clearRect(0, 0, W, H);
            pctx.drawImage(drawCard(game, findTheme(id)), 0, 0);
            Array.prototype.forEach.call(swWrap.children, function (b) {
                b.setAttribute('data-on', b.getAttribute('data-theme') === id ? '1' : '0');
            });
        }

        THEMES.forEach(function (theme) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'sc-sw';
            b.setAttribute('data-theme', theme.id);
            b.title = themeLabel(theme);
            b.style.background = 'linear-gradient(135deg,' + theme.from + ',' + theme.to + ')';
            if (theme.id === 'paper') b.style.color = '#4338ca';
            b.textContent = themeLabel(theme);
            b.addEventListener('click', function () { paint(theme.id); });
            swWrap.appendChild(b);
        });

        function close() {
            document.removeEventListener('keydown', onKey);
            if (mask.parentNode) mask.parentNode.removeChild(mask);
        }
        function onKey(e) { if (e.key === 'Escape') close(); }

        mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
        mask.querySelector('[data-act="close"]').addEventListener('click', close);
        mask.querySelector('[data-act="save"]').addEventListener('click', function () {
            download(game, findTheme(currentThemeId));
        });
        document.addEventListener('keydown', onKey);
        document.body.appendChild(mask);

        paint(currentThemeId);
    }

    function fileSafeName(s) {
        return String(s || 'game').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40);
    }

    function download(game, theme) {
        var th = theme || findTheme(DEFAULT_THEME);
        var canvas = drawCard(game, th);
        canvas.toBlob(function (blob) {
            if (!blob) return;
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileSafeName(game.name_zh || game.name_en || game.id) +
                t('-分享图-', '-share-') + th.id + '.jpg';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
            if (typeof window.toast === 'function') {
                window.toast(t('分享图已保存，可以直接发群里', 'Share card saved — post it anywhere'));
            }
        }, 'image/jpeg', 0.92); // JPEG：1200x630 渐变底用 PNG 要 780KB，JPEG 只要一百多 KB
    }

    function mount() {
        if (document.body.getAttribute('data-sharecard-bound') === '1') return;
        var actions = document.querySelector('.action-buttons');
        if (!actions) return;
        document.body.setAttribute('data-sharecard-bound', '1');

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-sharecard';
        btn.id = 'shareCardBtn';
        btn.title = t('生成一张 1200x630 的分享图', 'Make a 1200x630 share card');
        btn.innerHTML = '<span class="zh-inline">🖼️ 分享图</span><span class="en-inline">🖼️ Share card</span>';
        btn.style.display = 'none';
        actions.appendChild(btn);

        window.leleleFetch('/lelegame_data.json', {}, 6000)
            .then(function (r) { return r.ok ? r.json() : []; })
            .then(function (list) {
                var id = '';
                try { id = (new URLSearchParams(window.location.search).get('id') || '').trim(); } catch (e) {}
                var game = (Array.isArray(list) ? list : []).find(function (g) { return String(g.id) === id; });
                if (!game) return;
                return resolveAuthorName(game).then(function (name) {
                    game.__authorName = name || '';
                    btn.style.display = '';
                    btn.addEventListener('click', function () { openPanel(game); });
                });
            })
            .catch(function () {});
    }

    function onReady(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
        else fn();
    }
    onReady(mount);
})();
