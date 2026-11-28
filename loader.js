/* ==========================================================================
 * loader.js — 了了了游统一加载动画（全站共用，零依赖）
 * 配套 loader.css。不依赖 boot.js / common.js，自带 DOM ready 判断。
 *
 * 自动接管：给任意容器加 <div data-loader>原本的“加载中…”</div>，
 *   DOM ready 后自动替换为统一动画（logo + 🎮 进度条 + 百分比），并启动渐进 tick。
 *
 * 手动 API（window.LeleleLoader）：
 *   .html(opts?)        → 返回统一加载动画 HTML 字符串（供 innerHTML 注入）
 *   .show(el, opts?)    → 把容器切成加载态并启动进度（opts: {text, compact, diag}）
 *   .progress(pct)      → 全局推进进度（只增不减，封顶 90；finish() 收尾 100）
 *   .finish()           → 收尾到 100% 并停 tick
 *   .fail(el, opts?)    → 失败态：🎮 转圈摔下去 + 文案 + 重新加载按钮（opts:{text,onRetry,compact}）
 *   .hide(el)           → 收起，恢复 show() 前的原内容
 * ========================================================================== */
(function () {
    'use strict';
    var LOGO = '/lelelegame.svg';
    var state = { pct: 0, timer: null, current: null };

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function isEn() { return document.documentElement.getAttribute('data-lang') === 'en'; }
    function t(zh, en) { return isEn() ? en : zh; }
    function byId(id) { return typeof id === 'string' ? document.getElementById(id) : id; }

    // 统一加载动画 HTML。text 可省略（默认双语「正在加载 / Loading」）；diag 为可选诊断行。
    function html(opts) {
        opts = opts || {};
        var label = opts.text || t('正在加载', 'Loading');
        var compact = opts.compact ? ' ll-compact' : '';
        var diag = opts.diag ? '<div class="ll-diag">' + esc(opts.diag) + '</div>' : '';
        return '<div class="ll-loader' + compact + '" role="status" aria-live="polite">' +
            '<img class="ll-logo" src="' + LOGO + '" alt="lelele">' + diag +
            '<div class="ll-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
            '<div class="ll-fill"></div><span class="ll-runner">🎮</span></div>' +
            '<div class="ll-status"><span class="ll-text">' + esc(label) + '</span><span class="ll-pct">0%</span></div>' +
            '</div>';
    }

    function setProgress(pct) {
        state.pct = Math.max(state.pct, Math.min(100, Number(pct) || 0));
        var root = state.current;
        if (!root) return state.pct;
        var fill = root.querySelector('.ll-fill');
        var runner = root.querySelector('.ll-runner');
        var pctEl = root.querySelector('.ll-pct');
        var track = root.querySelector('.ll-track');
        if (fill) fill.style.width = state.pct + '%';
        if (runner) runner.style.left = state.pct + '%';
        if (pctEl) pctEl.textContent = state.pct + '%';
        if (track) track.setAttribute('aria-valuenow', String(state.pct));
        return state.pct;
    }
    function startTick() {
        if (state.timer) return;
        state.timer = setInterval(function () {
            if (state.pct >= 90) { stopTick(); return; }
            setProgress(state.pct + 3 + Math.random() * 4);
        }, 180);
    }
    function stopTick() { if (state.timer) { clearInterval(state.timer); state.timer = null; } }
    function finish() { stopTick(); return setProgress(100); }

    // 显示加载态：保存原内容到 dataset，便于 hide() 恢复
    function show(el, opts) {
        el = byId(el);
        if (!el) return;
        stopTick();
        state.pct = 0;
        if (el.getAttribute('data-ll-orig') == null) {
            el.setAttribute('data-ll-orig', el.innerHTML);
        }
        el.innerHTML = html(opts);
        state.current = el.querySelector('.ll-loader');
        startTick();
        return el;
    }

    // 失败态：🎮 转圈后摔下去 + 文案 + 重新加载按钮
    function fail(el, opts) {
        el = byId(el);
        if (!el) return;
        opts = opts || {};
        stopTick();
        var compact = opts.compact ? ' ll-compact' : '';
        var label = opts.text || t('加载失败', 'Loading failed');
        var retryLabel = t('重新加载', 'Reload');
        el.innerHTML = '<div class="ll-fail' + compact + '" role="alert">' +
            '<span class="ll-fall" aria-hidden="true">🎮</span>' +
            '<div class="ll-fail-msg">' + esc(label) + '</div>' +
            '<button type="button" class="ll-retry">↻ ' + esc(retryLabel) + '</button>' +
            '</div>';
        var btn = el.querySelector('.ll-retry');
        if (btn) {
            btn.addEventListener('click', function () {
                if (typeof opts.onRetry === 'function') opts.onRetry();
                else if (opts.reload !== false) window.location.reload();
            });
        }
        return el;
    }

    // 收起：恢复 show() 前的原内容
    function hide(el) {
        el = byId(el);
        if (!el) return;
        stopTick();
        var orig = el.getAttribute('data-ll-orig');
        if (orig != null) { el.innerHTML = orig; el.removeAttribute('data-ll-orig'); }
        state.current = null;
        return el;
    }

    // 自动接管：DOM ready 后扫描 [data-loader]，换成统一动画
    function autoMount(root) {
        var scope = root || document;
        if (!scope.querySelectorAll) return;
        var list = scope.querySelectorAll('[data-loader]');
        Array.prototype.forEach.call(list, function (el) {
            if (el.getAttribute('data-ll-mounted')) return;
            var compact = el.getAttribute('data-loader-compact') === '1';
            var diag = el.getAttribute('data-loader-diag') || '';
            show(el, { compact: compact, diag: diag });
            el.setAttribute('data-ll-mounted', '1');
        });
    }
    function ready(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
        else fn();
    }

    window.LeleleLoader = {
        html: html, show: show, progress: setProgress, finish: finish,
        fail: fail, hide: hide, autoMount: autoMount, version: '1.0.0'
    };
    ready(function () { autoMount(document); });
})();
