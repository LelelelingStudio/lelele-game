/* ==========================================================================
 * theme-init.js · 深色模式「提前应用」补丁
 *
 * 问题：站点有三套外观键
 *   lelele_theme_mode = 'auto' | 'light' | 'dark'（设置面板用，新）
 *   lelele_theme      = 'dark' | 'light'            （旧版切换按钮用）
 * common.js 会把它们应用到 <html class="dark-mode">，但 profile.html /
 * user-login.html 这些页面自己写了深色样式、却没引到那段逻辑，
 * 结果就是：在首页切了深色，点进个人中心又变回白的。
 *
 * 这个脚本只做两件事，不改变颜色：
 *   1) 在 <head> 里同步判断当前该不该深色，提前给 html 加 class（避免闪白）；
 *   2) 跟随系统配色变化（仅当模式是 auto）。
 *
 * 它不接管切换按钮，只是兜底；common.js 加载后照旧覆盖，两边结果一致。
 * ========================================================================== */
(function () {
    'use strict';

    function readMode() {
        try {
            var mode = localStorage.getItem('lelele_theme_mode');
            if (mode === 'dark' || mode === 'light') return mode;
            var legacy = localStorage.getItem('lelele_theme');
            if (legacy === 'dark') return 'dark';
            if (legacy === 'light') return 'light';
        } catch (e) {}
        return 'auto';
    }

    function prefersDark() {
        return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    function apply() {
        var mode = readMode();
        var dark = mode === 'dark' || (mode === 'auto' && prefersDark());
        var root = document.documentElement;
        root.classList.toggle('dark-mode', dark);
        // 让原生控件（滚动条、输入框、日期选择器）跟着变深
        root.style.colorScheme = dark ? 'dark' : 'light';
    }

    apply();

    if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        var onChange = function () { if (readMode() === 'auto') apply(); };
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else if (mq.addListener) mq.addListener(onChange);
    }

    // 同一标签页里在别的页面改过模式后，返回时立刻生效
    window.addEventListener('storage', function (e) {
        if (e.key === 'lelele_theme_mode' || e.key === 'lelele_theme') apply();
    });
})();
