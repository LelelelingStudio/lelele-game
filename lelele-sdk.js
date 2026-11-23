/* ==========================================================================
 * lelele-sdk.js — 了了了游开发者 SDK（零构建 / 零依赖）
 *
 * 在你的游戏里引入（游戏在平台播放器打开时生效）：
 *   <script src="https://game.leleleling.site/lelele-sdk.js"></script>
 *   <script>
 *     window.LeleleSDK.submitScore(1234, { name: '小明' }); // 上报分数
 *     window.LeleleSDK.submitRating(4.5);                    // 上报评分
 *     window.LeleleSDK.getLeaderboard().then(rows => {});   // 本游戏 Top10
 *     window.LeleleSDK.getPlayerName().then(name => {});    // 当前玩家昵称
 *     window.LeleleSDK.shareScore(1234).then(url => {});    // 生成成绩分享链接
 *   </script>
 *
 * 只需引入一个脚本，调用几个函数；平台负责存储、榜单、跳转与分享页。
 * 依赖上下文的函数返回 Promise，单独打开游戏页时 Promise 解析为 null / 空值，不会报错。
 * 榜单与评分为荣誉展示（客户端上报、不防作弊）。
 * ========================================================================== */
(function () {
    'use strict';

    var seq = 0;
    var pending = Object.create(null);

    function inPlatform() { return window.parent !== window; }
    function post(msg) { if (inPlatform()) { try { window.parent.postMessage(msg, '*'); } catch (e) {} } }

    // 请求宿主读取数据（跨源 iframe 同样可用）：返回 Promise，4s 超时降级为 null
    function request(action, payload) {
        return new Promise(function (resolve) {
            if (!inPlatform()) { resolve(null); return; }
            var id = 'r' + (++seq);
            pending[id] = resolve;
            post({ type: 'lelele:sdk:req', id: id, action: action, payload: payload || {} });
            setTimeout(function () { if (pending[id]) { delete pending[id]; resolve(null); } }, 4000);
        });
    }
    window.addEventListener('message', function (e) {
        var d = e.data;
        if (!d || d.type !== 'lelele:sdk:res') return;
        if (e.source !== window.parent) return;
        var cb = pending[d.id];
        if (cb) { delete pending[d.id]; cb(d.data); }
    });

    // ---------- 对外 API ----------
    function submitScore(score, options) {
        var n = Number(score);
        if (!isFinite(n) || n < 0) { warn('score 必须是非负数字', score); return false; }
        if (!inPlatform()) { warn('未在播放器内运行，分数未上报'); return false; }
        var opts = options || {};
        var name = (typeof opts.name === 'string' && opts.name.trim()) ? opts.name.trim().slice(0, 24) : null;
        post({ type: 'lelele:score', score: Math.floor(n), playerName: name });
        return true;
    }

    function submitRating(rating) {
        var n = Number(rating);
        if (!isFinite(n) || n < 0.5 || n > 5) { warn('rating 需在 0.5–5 之间', rating); return false; }
        if (!inPlatform()) { warn('未在播放器内运行，评分未上报'); return false; }
        post({ type: 'lelele:rating', rating: Math.round(n * 10) / 10 });
        return true;
    }

    function getLeaderboard() {
        return request('leaderboard').then(function (d) { return (d && Array.isArray(d.rows)) ? d.rows : []; });
    }

    function getPlayerName() {
        return request('playerName').then(function (d) { return (d && d.name) ? d.name : null; });
    }

    var isInPlatformApi = function () { return inPlatform(); };

    function nextGame(options) {
        var opts = options || {};
        var category = (typeof opts.category === 'string') ? opts.category.slice(0, 30) : null;
        if (!inPlatform()) { warn('未在播放器内运行'); return false; }
        post({ type: 'lelele:nextgame', category: category });
        return true;
    }

    function shareScore(score, text) {
        var n = Number(score);
        if (!isFinite(n) || n < 0) { warn('score 必须是非负数字', score); return Promise.resolve(null); }
        return request('shareInfo').then(function (info) {
            if (!info || !info.id) return null;
            var base = (info.origin || 'https://game.leleleling.site') + '/share.html';
            var q = 'id=' + encodeURIComponent(info.id)
                + '&name=' + encodeURIComponent(info.name || '玩家')
                + '&score=' + encodeURIComponent(Math.floor(n))
                + '&game=' + encodeURIComponent(info.gameName || '')
                + '&ts=' + Date.now();
            if (typeof text === 'string' && text.trim()) q += '&text=' + encodeURIComponent(text.trim().slice(0, 80));
            return base + '?' + q;
        });
    }

    function openDetail() {
        if (!inPlatform()) { warn('未在播放器内运行'); return false; }
        post({ type: 'lelele:opendetail' });
        return true;
    }

    function warn(msg, val) {
        if (typeof console !== 'undefined' && console.warn) console.warn('[LeleleSDK] ' + msg, val === undefined ? '' : val);
    }

    window.LeleleSDK = {
        submitScore: submitScore,
        submitRating: submitRating,
        getLeaderboard: getLeaderboard,
        getPlayerName: getPlayerName,
        isInPlatform: isInPlatformApi,
        nextGame: nextGame,
        shareScore: shareScore,
        openDetail: openDetail,
        version: '1.1.0'
    };
})();
