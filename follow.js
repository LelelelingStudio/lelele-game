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
            const { data } = await client.from('follows')
                .select('id, follower_id, is_following, day_op_count, op_date')
                .eq('author_id', authorUuid).eq('follower_id', uid);
            record = (data && data.find(r => r.is_following)) || (data && data[0]) || null;
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
            if (rec && rec.id) {
                const { error } = await client.from('follows').update(patch).eq('id', rec.id);
                if (error) throw error;
            } else {
                const { error } = await client.from('follows').insert(Object.assign({
                    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
                    created_at: new Date().toISOString()
                }, patch));
                if (error) throw error;
            }
            const after = await getState(authorUuid, uid);
            return { ok: true, following: next, count: after.count };
        } catch (e) {
            return { ok: false, reason: (e && e.message) || tr('操作失败，请重试', 'Failed, please retry') };
        }
    }

    // 把一个容器挂成关注组件；组件自己渲染按钮 + 粉丝数
    async function mount(container, authorNumericId, options) {
        if (!container) return;
        const opts = options || {};
        container.innerHTML = '<button type="button" class="follow-btn" disabled>' + tr('加载中…', 'Loading…') + '</button>' +
            '<span class="follow-count" hidden></span>';

        const uuid = await resolveUuid(authorNumericId);
        const session = await getSession();
        const uid = session && session.user && session.user.id;

        const render = (state) => {
            const btn = container.querySelector('.follow-btn');
            const cnt = container.querySelector('.follow-count');
            if (!btn || !cnt) return;
            btn.disabled = false;
            btn.textContent = state.following ? tr('✓ 已关注', '✓ Following') : tr('＋ 关注', '＋ Follow');
            btn.classList.toggle('following', !!state.following);
            cnt.hidden = false;
            cnt.textContent = state.count + tr(' 粉丝', ' followers');
        };

        const state = await getState(uuid, uid);
        render(state);

        container.querySelector('.follow-btn').addEventListener('click', async (e) => {
            e.preventDefault(); e.stopPropagation();
            if (!uid) {
                window.location.href = 'user-login.html?return=' + encodeURIComponent(window.location.pathname + window.location.search);
                return;
            }
            const btn = container.querySelector('.follow-btn');
            btn.disabled = true;
            const result = await toggle(uuid, uid);
            if (!result.ok) {
                btn.disabled = false;
                if (result.reason === 'auth-required') {
                    window.location.href = 'user-login.html?return=' + encodeURIComponent(window.location.pathname + window.location.search);
                    return;
                }
                window.alert(result.reason);
                return;
            }
            render({ following: result.following, count: result.count });
        });
    }

    window.FollowUI = { mount, toggle, getState, resolveUuid, getSession };
})();
