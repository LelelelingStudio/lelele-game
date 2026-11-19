/* ==========================================================================
 * lelele-sdk.js — 了了了游 · 全服高分榜 SDK（零构建 / 零依赖）
 *
 * 在你的游戏里引入（游戏需在平台播放器打开）：
 *   <script src="https://game.leleleling.site/lelele-sdk.js"></script>
 *   <script>
 *     window.LeleleSDK.submitScore(1234);                  // 结算时上报分数
 *     window.LeleleSDK.submitScore(1234, { name: '小明' }); // 可选：自定义昵称
 *   </script>
 *
 * 本 SDK 不存储、不联网，只通过 postMessage 把分数交给外层播放器写入榜单。
 * 榜单为荣誉展示（客户端上报、不防作弊），未登录玩家也可参与（随机昵称）。
 * ========================================================================== */
(function () {
    'use strict';

    var MESSAGE_TYPE = 'lelele:score';

    function submitScore(score, options) {
        var n = Number(score);
        if (!isFinite(n) || n < 0) {
            if (typeof console !== 'undefined' && console.warn) console.warn('[LeleleSDK] score 必须是非负数字', score);
            return false;
        }
        if (window.parent === window) {
            if (typeof console !== 'undefined' && console.warn) console.warn('[LeleleSDK] 未在播放器 iframe 内运行，分数未上报');
            return false;
        }
        var opts = options || {};
        var name = (typeof opts.name === 'string' && opts.name.trim()) ? opts.name.trim().slice(0, 24) : null;
        window.parent.postMessage({ type: MESSAGE_TYPE, score: Math.floor(n), playerName: name }, '*');
        return true;
    }

    window.LeleleSDK = { submitScore: submitScore, version: '1.0.0' };
})();
