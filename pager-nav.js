/* ==========================================================================
 * pager-nav.js — 游戏详情页 / 作者页共用的「上一个 · 下一个」循环导航
 *
 * 两页只负责提供数据与 URL 规则，本模块负责：
 *   1. id 全集去重排序；2. 计算前后邻居并首尾相接；3. 生成左右两枚圆钮；
 *   4. 点击 / 键盘左右键跳转；5. 幂等重挂载（作者清单首屏缓存 + 最新校正两阶段到达、
 *      语言切换重绘都会重复调用）；6. 数据不可用或只有一条时静默隐藏。
 *
 * 用法：
 *   window.LelelePager.mount({
 *     ids: [1, 2, 3], currentId: 1,
 *     urlFor: function (id) { return '/game.html?id=' + id; },
 *     nameFor: function (id) { return { zh: '中文名', en: 'English name' }; }
 *   });
 *   window.LelelePager.unmount();
 *
 * 目标名称一律用 textContent 写入；id 只接受正整数，杜绝从 URL 注入外链。
 * ========================================================================== */
(function () {
    'use strict';

    var CONTAINER_ID = 'lelelePagerNav';
    var links = null;          // { prev: url, next: url }
    var keyBound = false;

    function isEnNow() {
        return document.documentElement.getAttribute('data-lang') === 'en';
    }

    // 只保留正整数 id，去重后升序；未来出现下架缺口时按列表相邻自动跳过
    function normalizeIds(ids) {
        var seen = Object.create(null);
        var out = [];
        (ids || []).forEach(function (v) {
            var n = Number(v);
            if (!isFinite(n) || n <= 0 || Math.floor(n) !== n || seen[n]) return;
            seen[n] = 1;
            out.push(n);
        });
        return out.sort(function (a, b) { return a - b; });
    }

    function neighbors(ids, currentId) {
        var n = ids.length;
        if (n < 2) return null;
        var i = ids.indexOf(Number(currentId));
        if (i < 0) return null;
        return { prev: ids[(i - 1 + n) % n], next: ids[(i + 1) % n] };
    }

    function ensureDom() {
        var el = document.getElementById(CONTAINER_ID);
        if (el) return el;
        el = document.createElement('div');
        el.id = CONTAINER_ID;
        el.className = 'pager-nav';
        el.setAttribute('role', 'navigation');
        el.setAttribute('aria-label', 'Previous / Next');
        // 静态模板，不含任何外部数据
        el.innerHTML =
            '<a class="pager-nav-btn pager-prev" rel="prev">' +
                '<span class="pager-arrow" aria-hidden="true">‹</span>' +
                '<span class="pager-tip"></span>' +
            '</a>' +
            '<a class="pager-nav-btn pager-next" rel="next">' +
                '<span class="pager-arrow" aria-hidden="true">›</span>' +
                '<span class="pager-tip"></span>' +
            '</a>';
        document.body.appendChild(el);
        return el;
    }

    function fillTip(link, zhLabel, enLabel, name) {
        var tip = link.querySelector('.pager-tip');
        var zh = zhLabel + (name && name.zh ? '：' + name.zh : '');
        var en = enLabel + (name && name.en ? ': ' + name.en : '');
        tip.textContent = '';
        var z = document.createElement('span');
        z.className = 'zh-inline';
        z.textContent = zh;
        var e = document.createElement('span');
        e.className = 'en-inline';
        e.textContent = en;
        tip.appendChild(z);
        tip.appendChild(e);
        link.setAttribute('aria-label', isEnNow() ? en : zh);
    }

    function onKey(evt) {
        if (!links || evt.defaultPrevented || evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey) return;
        var t = evt.target;
        if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
        // 协议弹窗 / 灯箱 / 公告弹窗打开时不抢左右键
        if (document.querySelector('#legalModal.active, .lightbox.active, .common-modal-overlay.active, .llnotice-mask.show')) return;
        var url = evt.key === 'ArrowLeft' ? links.prev
            : (evt.key === 'ArrowRight' ? links.next : null);
        if (!url) return;
        evt.preventDefault();
        window.location.assign(url);
    }

    function bindKeys() {
        if (keyBound) return;
        document.addEventListener('keydown', onKey);
        keyBound = true;
    }

    function mount(opts) {
        opts = opts || {};
        var ids = normalizeIds(opts.ids);
        var nb = neighbors(ids, opts.currentId);
        if (!nb || typeof opts.urlFor !== 'function') { unmount(); return; }

        var prevUrl, nextUrl, prevName, nextName;
        try {
            prevUrl = String(opts.urlFor(nb.prev));
            nextUrl = String(opts.urlFor(nb.next));
            if (typeof opts.nameFor === 'function') {
                prevName = opts.nameFor(nb.prev) || null;
                nextName = opts.nameFor(nb.next) || null;
            }
        } catch (err) {
            unmount();
            return;
        }

        var el = ensureDom();
        var prev = el.querySelector('.pager-prev');
        var next = el.querySelector('.pager-next');
        prev.setAttribute('href', prevUrl);
        next.setAttribute('href', nextUrl);
        fillTip(prev, '上一个', 'Previous', prevName);
        fillTip(next, '下一个', 'Next', nextName);
        el.classList.add('is-visible');
        el.removeAttribute('aria-hidden');

        links = { prev: prevUrl, next: nextUrl };
        bindKeys();
    }

    function unmount() {
        var el = document.getElementById(CONTAINER_ID);
        if (el) {
            el.classList.remove('is-visible');
            el.setAttribute('aria-hidden', 'true');
        }
        links = null;
    }

    window.LelelePager = { mount: mount, unmount: unmount };
}());
