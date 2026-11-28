/* ==========================================================================
 * lelele-game · .lgstore 离线包
 *
 * 目标：
 *   1) 只有 PWA（已安装到桌面/独立窗口）才提供「下载到本地」——普通网页点按钮
 *      只给一句很小的提示，不真的给文件。
 *   2) 存下来的东西是我们自己的格式 .lgstore：一个 JSON，里面是 base64 后的
 *      HTML（资源已经内联进去）。普通人用记事本打开只看到一坨 base64，
 *      不能直接拷走源码；真要还原得知道格式，门槛足够。
 *   3) 在 PWA 里点一下，除了给文件，还会自动存进本机的 CacheStorage，
 *      离线页（lgstore.html）能直接列出来玩，用户不用自己导入。
 *
 * 不做的事：不联网校验、不上传、不碰后端、不需要登录。
 * ========================================================================== */
(function () {
    'use strict';

    var CACHE_NAME = 'lelele-lgstore-v1';
    var KEY_PREFIX = '/__lgstore/';
    var MAX_BYTES = 24 * 1024 * 1024; // 24MB 上限，超了就老实说不支持
    var EXT = '.lgstore';

    function isEn() { return document.documentElement.getAttribute('data-lang') === 'en'; }
    function t(zh, en) { return isEn() ? en : zh; }

    function isPwa() {
        try {
            if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
            if (window.navigator.standalone === true) return true;
        } catch (e) {}
        return false;
    }

    // 只有「本站自托管」的游戏能打包（外站 iframe 拿不到源码）
    function isPackable(game) {
        return !!(game && typeof game.url === 'string' && /^\/game\//.test(game.url));
    }

    function u8ToB64(bytes) {
        var bin = '';
        var chunk = 0x8000;
        for (var i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(bin);
    }
    function b64ToU8(b64) {
        var bin = atob(b64);
        var out = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }
    function textToB64(text) { return u8ToB64(new TextEncoder().encode(text)); }
    function b64ToText(b64) { return new TextDecoder().decode(b64ToU8(b64)); }

    function mimeOf(path) {
        var ext = (path.split('?')[0].match(/\.([a-z0-9]+)$/i) || [])[1];
        ext = (ext || '').toLowerCase();
        var map = {
            png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
            webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon',
            css: 'text/css', js: 'text/javascript', json: 'application/json',
            mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', mp4: 'video/mp4',
            woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf'
        };
        return map[ext] || 'application/octet-stream';
    }

    function resolveUrl(ref, baseUrl) {
        try { return new URL(ref, new URL(baseUrl, window.location.origin)).href; } catch (e) { return ''; }
    }

    // 把同一站点内的资源抓下来内联成 data URI。抓不到的保持原样（联网时仍能显示）
    async function inlineAssets(html, entryUrl) {
        var refs = [];
        var re = /(\s(?:src|href)=)(["'])([^"']+)\2/g;
        var m;
        while ((m = re.exec(html)) !== null) {
            var raw = m[3];
            if (/^(data:|blob:|#|mailto:|javascript:)/i.test(raw)) continue;
            var abs = resolveUrl(raw, entryUrl);
            if (!abs) continue;
            if (!abs.startsWith(window.location.origin)) continue; // 外站资源不内联
            if (refs.indexOf(abs) === -1) refs.push(abs);
        }
        // 去重后逐个抓，最多 40 个，避免极端页面卡死
        refs = refs.slice(0, 40);
        var map = {};
        for (var i = 0; i < refs.length; i++) {
            try {
                var res = await fetch(refs[i], { credentials: 'same-origin' });
                if (!res.ok) continue;
                var buf = new Uint8Array(await res.arrayBuffer());
                map[refs[i]] = 'data:' + mimeOf(refs[i]) + ';base64,' + u8ToB64(buf);
            } catch (e) { /* 单个失败不影响整体 */ }
        }
        if (!Object.keys(map).length) return html;
        return html.replace(re, function (full, attr, q, ref) {
            var abs = resolveUrl(ref, entryUrl);
            if (abs && map[abs]) return attr + q + map[abs] + q;
            return full;
        });
    }

    async function pack(game) {
        var entryUrl = game.url;
        var res = await fetch(entryUrl, { credentials: 'same-origin' });
        if (!res.ok) throw new Error(t('这个游戏的文件没拿到', 'Could not fetch this game'));
        var html = await res.text();
        html = await inlineAssets(html, entryUrl);
        var payload = textToB64(html);
        if (payload.length > MAX_BYTES) throw new Error(t('这个游戏太大了，暂不支持存到本地', 'This game is too large to save'));
        return {
            v: 1,
            app: 'lelele-game',
            kind: 'lgstore',
            id: String(game.id),
            name_zh: game.name_zh || '',
            name_en: game.name_en || '',
            icon: game.icon || '🎮',
            entry: entryUrl,
            savedAt: new Date().toISOString(),
            // 代码本身就在 payload 里，外面只放元数据，方便列表页读取
            size: payload.length,
            payload: payload
        };
    }

    async function saveToCache(packObj) {
        if (!('caches' in window)) return false;
        var cache = await caches.open(CACHE_NAME);
        var meta = Object.assign({}, packObj);
        delete meta.payload; // 元数据与正文分两份存，列表页不用解 base64
        await cache.put(KEY_PREFIX + packObj.id, new Response(JSON.stringify(packObj), {
            headers: { 'Content-Type': 'application/json' }
        }));
        await cache.put(KEY_PREFIX + packObj.id + '.meta', new Response(JSON.stringify(meta), {
            headers: { 'Content-Type': 'application/json' }
        }));
        return true;
    }

    async function listSaved() {
        if (!('caches' in window)) return [];
        var cache = await caches.open(CACHE_NAME);
        var keys = await cache.keys();
        var out = [];
        for (var i = 0; i < keys.length; i++) {
            var url = keys[i].url;
            if (!url.includes(KEY_PREFIX) || url.endsWith('.meta')) continue;
            try {
                var r = await cache.match(keys[i]);
                var meta = await r.json();
                delete meta.payload;
                out.push(meta);
            } catch (e) {}
        }
        return out.sort(function (a, b) { return String(b.savedAt).localeCompare(String(a.savedAt)); });
    }

    async function getSaved(id) {
        if (!('caches' in window)) return null;
        var cache = await caches.open(CACHE_NAME);
        var r = await cache.match(KEY_PREFIX + id);
        if (!r) return null;
        try { return await r.json(); } catch (e) { return null; }
    }

    async function removeSaved(id) {
        if (!('caches' in window)) return false;
        var cache = await caches.open(CACHE_NAME);
        await cache.delete(KEY_PREFIX + id);
        await cache.delete(KEY_PREFIX + id + '.meta');
        return true;
    }

    function downloadBlob(packObj) {
        var blob = new Blob([JSON.stringify(packObj)], { type: 'application/octet-stream' });
        var a = document.createElement('a');
        var name = (packObj.name_zh || packObj.id).replace(/[\\/:*?"<>|]/g, '_');
        a.href = URL.createObjectURL(blob);
        a.download = name + EXT;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    }

    async function importFile(file) {
        var text = await file.text();
        var obj = JSON.parse(text);
        if (!obj || obj.kind !== 'lgstore' || !obj.id || !obj.payload) throw new Error('bad-file');
        await saveToCache(obj);
        return obj;
    }

    function toastSmall(msg) {
        if (typeof window.toast === 'function') { window.toast(msg, 2600); return; }
        var el = document.createElement('div');
        el.className = 'lgstore-tip';
        el.textContent = msg;
        document.body.appendChild(el);
        requestAnimationFrame(function () { el.classList.add('show'); });
        setTimeout(function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 300); }, 2600);
    }

    /* ---------------- 游戏页按钮 ---------------- */

    function mountButton() {
        if (document.body.getAttribute('data-lgstore-bound') === '1') return;
        document.body.setAttribute('data-lgstore-bound', '1');

        var actions = document.querySelector('.action-buttons');
        if (!actions) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-lgstore';
        btn.id = 'lgstoreBtn';
        btn.innerHTML = '<span class="zh-inline">📦 存到本地玩</span><span class="en-inline">📦 Save offline</span>';
        btn.style.display = 'none';
        actions.appendChild(btn);

        // 异步拿游戏信息：只对本站自托管的游戏显示按钮
        window.leleleFetch('/lelegame_data.json', {}, 6000)
            .then(function (r) { return r.ok ? r.json() : []; })
            .then(function (list) {
                var id = '';
                try { id = (new URLSearchParams(window.location.search).get('id') || '').trim(); } catch (e) {}
                var game = (Array.isArray(list) ? list : []).find(function (g) { return String(g.id) === id; });
                if (!game || !isPackable(game)) return; // 不支持的游戏：连按钮都不出现
                btn.style.display = '';
                btn.addEventListener('click', async function () {
                    if (!isPwa()) {
                        // 不是 PWA：只给一句很短的话，不给文件
                        toastSmall(t('存到本地要先安装成 App（浏览器菜单 → 安装 / 添加到主屏幕）', 'Install the app first (browser menu → Install / Add to Home Screen)'));
                        return;
                    }
                    if (btn.disabled) return;
                    var old = btn.innerHTML;
                    btn.disabled = true;
                    btn.textContent = t('打包中…', 'Packing…');
                    try {
                        var obj = await pack(game);
                        await saveToCache(obj);
                        downloadBlob(obj);
                        btn.innerHTML = '<span class="zh-inline">✅ 已存到本地</span><span class="en-inline">✅ Saved</span>';
                        toastSmall(t('已存进 App 的离线包，断网也能玩', 'Saved into the app — playable offline'));
                        setTimeout(function () { btn.innerHTML = old; btn.disabled = false; }, 2600);
                    } catch (err) {
                        btn.innerHTML = old;
                        btn.disabled = false;
                        toastSmall((err && err.message) || t('打包失败，稍后再试', 'Packing failed, try again later'));
                    }
                });
            })
            .catch(function () {});
    }

    window.LeleleStore = {
        isPwa: isPwa,
        isPackable: isPackable,
        pack: pack,
        saveToCache: saveToCache,
        listSaved: listSaved,
        getSaved: getSaved,
        removeSaved: removeSaved,
        importFile: importFile,
        downloadBlob: downloadBlob,
        b64ToText: b64ToText
    };

    function onReady(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
        else fn();
    }
    onReady(function () {
        if (document.querySelector('.action-buttons')) mountButton();
    });
})();
