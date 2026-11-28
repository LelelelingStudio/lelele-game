/* ==========================================================================
 * lelele-game · 分享卡图（纯前端 canvas）
 *
 * 为什么不是「动态 og:image」：
 *   微信 / Discord / 推特抓的是服务器返回的静态 HTML，**不会执行页面 JS**，
 *   所以每款游戏一个动态预览图在前端做不到（需要服务端按 id 生成）。
 *   折中：这里给玩家一张可以自己保存 / 发群里的 1200x630 卡图，
 *   页面的 og:image 用站点默认图兜底。
 * ========================================================================== */
(function () {
    'use strict';

    var W = 1200, H = 630;

    function isEn() { return document.documentElement.getAttribute('data-lang') === 'en'; }
    function t(zh, en) { return isEn() ? en : zh; }

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

    function drawCard(game) {
        var canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        var ctx = canvas.getContext('2d');
        var en = isEn();

        // 背景渐变
        var g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#4f46e5');
        g.addColorStop(1, '#0b1020');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // 装饰圆
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath(); ctx.arc(1010, 90, 240, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(1140, 560, 200, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath(); ctx.arc(90, 590, 170, 0, Math.PI * 2); ctx.fill();

        // 图标（衬一块半透明圆角底，避免 emoji 在深色渐变上糊掉）
        roundRect(ctx, 64, 66, 184, 184, 36);
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fill();
        ctx.font = '112px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(game.icon || '🎮', 156, 160);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // 游戏名（自动缩字号 + 折行）
        var name = en ? (game.name_en || game.name_zh || '') : (game.name_zh || game.name_en || '');
        var size = name.length > 12 ? 72 : 92;
        var fontFamily = '-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 ' + size + 'px ' + fontFamily;
        var lines = wrapText(ctx, name, W - 340);
        lines.slice(0, 2).forEach(function (line, i) {
            ctx.fillText(line, 280, 84 + i * (size + 12));
        });

        // 副标题：分类 + 作者
        var cat = en ? (game.category_en || '') : (game.category_zh || '');
        var sub = [cat, game.author ? t('作者 ', 'by ') + game.author : ''].filter(Boolean).join(' · ');
        ctx.font = '500 40px ' + fontFamily;
        ctx.fillStyle = 'rgba(199,210,254,0.95)';
        if (sub) ctx.fillText(sub, 280, 84 + Math.min(lines.length, 2) * (size + 12) + 8);

        // 标语
        ctx.font = '600 46px ' + fontFamily;
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(t('点开就能玩，不用注册', 'Play right away — no sign-up'), 80, 400);

        // 底部站点
        ctx.font = '600 34px ' + fontFamily;
        ctx.fillStyle = 'rgba(203,213,225,0.9)';
        ctx.fillText('game.leleleling.site', 80, 480);
        ctx.font = '700 30px ' + fontFamily;
        ctx.fillStyle = 'rgba(199,210,254,0.95)';
        ctx.fillText('了了了游 · lelele Game', 80, 530);

        return canvas;
    }

    function fileSafeName(s) {
        return String(s || 'game').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40);
    }

    function download(game) {
        var canvas = drawCard(game);
        canvas.toBlob(function (blob) {
            if (!blob) return;
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileSafeName(game.name_zh || game.name_en || game.id) + t('-分享图', '-share') + '.jpg';
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
                btn.style.display = '';
                btn.addEventListener('click', function () { download(game); });
            })
            .catch(function () {});
    }

    function onReady(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
        else fn();
    }
    onReady(mount);
})();
