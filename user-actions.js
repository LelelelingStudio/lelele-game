// ==================== 用户行为：评分 / 最近游玩 / 关注作者 ====================
// 依赖：supabase-client.js（window.supabaseClient）。
// 本模块只做“接口封装 + 登录态守卫 + 优雅降级”，不直接操作 DOM；
// 各页面在自己的脚本里调用 window.leleleUser.* 并渲染按钮/星级。
(function () {
    'use strict';

    function sbClient() {
        return (typeof supabaseClient !== 'undefined' && supabaseClient) ? supabaseClient : null;
    }

    function lang() {
        return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'zh';
    }

    function t(zh, en) { return lang() === 'en' ? en : zh; }

    // 读取当前登录会话；未登录 / 客户端缺席均返回 null，绝不抛错打断页面。
    async function getSession() {
        const sb = sbClient();
        if (!sb) return null;
        try {
            const { data } = await sb.auth.getSession();
            return (data && data.session) || null;
        } catch (e) {
            return null;
        }
    }

    // 统一调用 Edge Function。返回结构：{ ok, reason?, data?, error? }
    // reason: no-client | login-required | invoke-error | exception
    async function invoke(fnName, body) {
        const sb = sbClient();
        if (!sb) return { ok: false, reason: 'no-client' };
        const session = await getSession();
        if (!session) return { ok: false, reason: 'login-required' };
        try {
            const { data, error } = await sb.functions.invoke(fnName, { body: body || {} });
            if (error) return { ok: false, reason: 'invoke-error', error };
            return { ok: true, data };
        } catch (e) {
            return { ok: false, reason: 'exception', error: e };
        }
    }

    // ---------- 游戏注册表解析 ----------
    // 本地游戏清单用数字 id，Supabase games 表用 UUID。games 表补齐后，
    // 这里按名称（name_zh / name_en）把本地游戏解析成 games.id；
    // 若将来 games 表加了 slug / local_id 列，只需替换本函数的匹配逻辑。
    let gamesCache = null;
    let gamesCachePromise = null;

    async function loadGamesRegistry() {
        if (gamesCache) return gamesCache;
        if (gamesCachePromise) return gamesCachePromise;
        const sb = sbClient();
        if (!sb) { gamesCache = []; return gamesCache; }
        gamesCachePromise = sb.from('games')
            .select('id, name_zh, name_en')
            .then(({ data, error }) => {
                gamesCache = (!error && Array.isArray(data)) ? data : [];
                return gamesCache;
            })
            .catch(() => { gamesCache = []; return gamesCache; });
        return gamesCachePromise;
    }

    // 返回 games 表的 UUID；匹配不到（表为空 / 该游戏未入库）时返回 null。
    async function resolveGameUuid(game) {
        if (!game) return null;
        const registry = await loadGamesRegistry();
        if (!registry || !registry.length) return null;
        const zh = String(game.name_zh || '').trim();
        const en = String(game.name_en || game.name || '').trim();
        const hit = registry.find(g =>
            (zh && g.name_zh && String(g.name_zh).trim() === zh) ||
            (en && g.name_en && String(g.name_en).trim() === en)
        );
        return hit ? hit.id : null;
    }

    // ---------- 对外行为接口 ----------

    // 提交评分（1~5）。game 传本地游戏对象（含 name_zh/name_en）。
    async function submitRating(game, score) {
        const gameId = await resolveGameUuid(game);
        if (!gameId) return { ok: false, reason: 'game-unregistered' };
        if (!Number.isInteger(score) || score < 1 || score > 5) {
            return { ok: false, reason: 'bad-score' };
        }
        return invoke('submit-game-rating', { game_id: gameId, score });
    }

    // 记录最近游玩（不阻塞页面跳转，调用方 fire-and-forget 即可）。
    async function recordRecentPlay(game) {
        const gameId = await resolveGameUuid(game);
        if (!gameId) return { ok: false, reason: 'game-unregistered' };
        return invoke('record-recent-play', { game_id: gameId });
    }

    // 关注 / 取消关注作者。authorUuid 来自 authors/index.json 的 uuid。
    async function toggleFollow(authorUuid, isFollowing) {
        if (!authorUuid) return { ok: false, reason: 'bad-author' };
        return invoke('toggle-follow-author', {
            author_id: authorUuid,
            is_following: !!isFollowing
        });
    }

    // 查询当前用户对某作者的最新关注状态。
    // 返回 { following: boolean, known: boolean }；known=false 表示查不到记录（视为未关注）。
    async function getFollowState(authorUuid) {
        const sb = sbClient();
        const session = await getSession();
        if (!sb || !session || !authorUuid) return { following: false, known: false };
        try {
            const { data, error } = await sb.from('follows')
                .select('is_following, op_date')
                .eq('follower_id', session.user.id)
                .eq('author_id', authorUuid)
                .order('op_date', { ascending: false })
                .limit(1);
            if (error || !data || !data.length) return { following: false, known: false };
            return { following: !!data[0].is_following, known: true };
        } catch (e) {
            return { following: false, known: false };
        }
    }

    // 查询当前用户对某游戏已打的分数；未打过返回 score=null。
    async function getMyRating(game) {
        const sb = sbClient();
        const session = await getSession();
        const gameId = await resolveGameUuid(game);
        if (!sb || !session || !gameId) return { score: null, known: false };
        try {
            const { data, error } = await sb.from('user_game_rating')
                .select('score')
                .eq('user_id', session.user.id)
                .eq('game_id', gameId)
                .limit(1);
            if (error || !data || !data.length) return { score: null, known: false };
            return { score: Number(data[0].score), known: true };
        } catch (e) {
            return { score: null, known: false };
        }
    }

    window.leleleUser = {
        get lang() { return lang(); },
        t,
        getSession,
        invoke,
        resolveGameUuid,
        submitRating,
        recordRecentPlay,
        toggleFollow,
        getFollowState,
        getMyRating
    };
})();
