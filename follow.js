/* ==========================================================================
 * follow.js — 作者关注（纯前端，走 Supabase follows 表 + 现有 RLS）
 *
 * 表结构（已在 Supabase 控制台确认）：
 *   follows(id uuid, author_id uuid, follower_id uuid, is_following boolean,
 *           day_op_count integer, op_date date, created_at timestamptz)
 * RLS：follows_read(SELECT true)、follows_insert(check follower_id=auth.uid())、
 *      follows_delete、public_select_follows、self_modify_follows(ALL)
 *   → 前端直接 select/insert/update 即可，无需改后端。
 *
 * 用法：页面引入本文件 + supabase-client.js，然后：
 *   window.FollowUI.mount(containerEl, authorNumericId, { compact:false });
 * 模块会自动按 authors/index.json 把数字 id 换成 uuid（关注表用的是 uuid）。
 * ========================================================================== */
(function () {
    'use strict';

    const DAILY_LIMIT = 3;
    // 每个容器只挂一个 click handler。页面重绘会多次调用 mount()，若每次都在 await
    // 之后 addEventListener，同一按钮会被绑 N 个 handler：早点是「点了没反应」，晚点
    // 是「一次点击弹 N 次上限 + day_op_count 被并发推满」。
    const mounted = new WeakMap();
    const AUTHORS_URL = '/authors/index.json';
    let authorsCache = null;

    function isEn() { return document.documentElement.getAttribute('data-lang') === 'en'; }
    function tr(zh, en) { return isEn() ? en : zh; }
    function today() { return new Date().toISOString().slice(0, 10); }
    function sb() { return (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) || null; }

    async function getAuthors() {
        if (authorsCache) return authorsCache;
        try {
            const res = await fetch(AUTHORS_URL, { cache: 'no-store' });
            authorsCache = res.ok ? await res.json() : [];
        } catch (e) { authorsCache = []; }
        return authorsCache;
    }

    async function getSession() {
        const client = sb();
        if (!client || !client.auth) return null;
        try { const { data } = await client.auth.getSession(); return (data && data.session) || null; }
        catch (e) { return null; }
    }

    async function resolveUuid(authorId) {
        if (!authorId) return null;
        const authors = await getAuthors();
        const a = authors.find(x => String(x.id) === String(authorId) || x.uuid === String(authorId));
        return a && a.uuid ? a.uuid : null;
    }

    async function getState(authorUuid, uid) {
        const client = sb();
        if (!client || !authorUuid || !uid) return { following: false, count: 0, record: null, uid: null };
        let count = 0, record = null;
        try {
            const { count: c } = await client.from('follows')
                .select('id', { count: 'exact', head: true })
                .eq('author_id', authorUuid).eq('is_following', true);
            count = c || 0;
        } catch (e) {}
        try {
            // 取本人对该作者的全部历史行，按 op_date 取最新一天（关注状态以当天为准）
            const { data } = await client.from('follows')
                .select('id, follower_id, is_following, day_op_count, op_date')
                .eq('author_id', authorUuid).eq('follower_id', uid)
                .order('op_date', { ascending: false });
            record = (data && data[0]) || null;
        } catch (e) {}
        return { following: !!(record && record.is_following), count, record, uid };
    }

    // 点击关注/取关。返回 { ok, following, count, reason? }
    async function toggle(authorUuid, uid) {
        const client = sb();
        if (!client) return { ok: false, reason: tr('登录组件未加载', 'Sign-in component unavailable') };
        if (!authorUuid) return { ok: false, reason: tr('该作者暂不支持关注（无绑定账号）', 'This author has no linked account') };
        if (!uid) return { ok: false, reason: 'auth-required' };

        const state = await getState(authorUuid, uid);
        const rec = state.record;
        const sameDay = rec && rec.op_date === today();
        const used = sameDay ? (Number(rec.day_op_count) || 0) : 0;
        if (used >= DAILY_LIMIT) {
            return { ok: false, reason: tr('今日关注操作已达上限，明天再来吧', 'Daily follow limit reached') };
        }
        const next = !state.following;
        const patch = {
            author_id: authorUuid,
            follower_id: uid,
            is_following: next,
            day_op_count: used + 1,
            op_date: today()
        };

        try {
            // 原子 upsert：表有唯一约束 (follower_id, author_id, op_date)，
            // 同一天同作者同关注者只能一行。原「先查再 INSERT」在查询无结果但行已存在时
            // 会撞 duplicate key；upsert 按唯一键冲突即改，彻底避免该错误。
            // id 永远新生成：rec 可能是昨天的行，复用它的 id 会在插今天新行时撞主键
            const row = Object.assign({
                id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
                created_at: new Date().toISOString()
            }, patch);
            const { error } = await client.from('follows')
                .upsert(row, { onConflict: 'follower_id,author_id,op_date' });
            if (error) throw error;
            const after = await getState(authorUuid, uid);
            return { ok: true, following: next, count: after.count };
        } catch (e) {
            return { ok: false, reason: (e && e.message) || tr('操作失败，请重试', 'Failed, please retry') };
        }
    }

    // 把一个容器挂成关注组件。关键：用 WeakMap 保证同一容器/同一作者只绑定一次，
    // 且 click handler 用闭包持有的 btn/uid/uuid，不再每次 querySelector + 依赖 await 闭包变量。
    async function mount(container, authorNumericId, options) {
        if (!container) return;
        const key = String(authorNumericId);
        const prev = mounted.get(container);
        // 同一容器同一作者：若已绑定则跳过（仅重绘状态），绝不再 addEventListener
        if (prev && prev.key === key) {
            // 若 DOM 被外部整体重建（如 game.html 重渲染作者栏），旧 btn 已脱离文档，需重挂
            if (container.contains(prev.btn)) return;
        }

        const opts = options || {};
        container.innerHTML = '<button type="button" class="follow-btn" disabled>' + tr('加载中…', 'Loading…') + '</button>' +
            '<span class="follow-count" hidden></span>';
        const btn = container.querySelector('.follow-btn');
        const cnt = container.querySelector('.follow-count');
        const ctx = { key, btn, busy: false, loading: true, uuid: null, uid: null };
        mounted.set(container, ctx);

        const render = (s) => {
            if (!container.contains(btn)) return;
            btn.disabled = ctx.busy;
            btn.textContent = s.following ? tr('✓ 已关注', '✓ Following') : tr('＋ 关注', '＋ Follow');
            btn.classList.toggle('following', !!s.following);
            cnt.hidden = false;
            cnt.textContent = s.count + tr(' 粉丝', ' followers');
        };

        // 绑定唯一 click handler：同步注册，不放在任何 await 之后，避免"第一次点击没反应"
        btn.addEventListener('click', async (e) => {
            e.preventDefault(); e.stopPropagation();
            if (ctx.loading || ctx.busy) return; // 加载中/处理中一律忽略（按钮此时也是 disabled）
            if (!ctx.uid) {
                window.location.href = 'user-login.html?return=' + encodeURIComponent(window.location.pathname + window.location.search);
                return;
            }
            ctx.busy = true;
            btn.disabled = true;
            const result = await toggle(ctx.uuid, ctx.uid);
            if (!result.ok) {
                ctx.busy = false;
                btn.disabled = false;
                if (result.reason === 'auth-required') {
                    window.location.href = 'user-login.html?return=' + encodeURIComponent(window.location.pathname + window.location.search);
                    return;
                }
                window.alert(result.reason);
                return;
            }
            render({ following: result.following, count: result.count });
            ctx.busy = false;
            btn.disabled = false;
        });

        // 异步拉取身份与状态（在 handler 绑定之后，UI 从"加载中"刷新）
        ctx.uuid = await resolveUuid(authorNumericId);
        const session = await getSession();
        ctx.uid = session && session.user && session.user.id;
        ctx.loading = false;
        render(await getState(ctx.uuid, ctx.uid));
    }

    window.FollowUI = { mount, toggle, getState, resolveUuid, getSession };
})();
