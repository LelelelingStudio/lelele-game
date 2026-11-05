/* ==========================================================================
 * lelele-game Service Worker
 *
 * ★ v1.4 (4.0.13) —— 本文件再次改动字节内容，触发浏览器重新 install/activate，
 *   清理 v1.3 及更早缓存。原因：v1.3 对静态资源使用 stale-while-revalidate，
 *   部署后首次访问仍会返回缓存中的旧 boot.js / common.js / dashboard.html；
 *   本次修复了 dashboard 游戏列表与 leleleOnReady 递归 bug，必须让新代码立即到达。
 *   fetch 策略（静态 SWR + 数据超时回退）与 v1.3 完全相同，未作改动。
 *
 * ★ v1.3 (4.0.12) —— 本文件加了这段注释、字节内容已改变，浏览器检测到 sw.js
 *   变化会重新 install/activate，清理掉 v1.0~v1.2 的旧缓存。这是用户要求的
 *   "给需要重新安装的文件加上注释"。
 *
 * 旧版问题（v1.0~v1.2）：所有请求一律 network-first，缓存只在断网时兜底，
 *   平时完全不加速 —— 等于缓存没用；且易变数据曾被预缓存造成新旧混合。
 *
 * v1.3 策略（目标是国内外都快）：
 *   1) 页面 / 自有 JS、CSS / 图标 / 自托管 vendor：stale-while-revalidate
 *      —— 命中缓存立即返回（秒开），后台再拉新版本更新缓存，下次访问即最新。
 *   2) 数据 JSON（lelegame_data.json / authors/* / 公告等）：network-first
 *      但带 1.5s 超时；网络慢/挂起时立刻回退缓存，绝不把页面拖住。
 *   3) 外部域名一律直通（supabase / analytics / tally / fonts 等）。
 *   4) 不再自动 location.reload()（见 common.js），避免升版时反复刷新。
 * ========================================================================== */
const CACHE_NAME = 'lelele-pwa-v1.4';

// 仅预缓存轻量核心资源。重型第三方库（vendor/*.js）改为运行时按需缓存，
// 避免 install 阶段一次性下载 1.5MB 拖慢首访。
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/about.html',
    '/docs.html',
    '/game.html',
    '/author.html',
    '/dashboard.html',
    '/login.html',
    '/404.html',
    '/privacy.html',
    '/terms.html',
    '/copyright.html',
    '/game_rules.html',
    '/developer_docs.html',
    '/common.css',
    '/effects.css',
    '/common.js',
    '/index.js',
    '/search.js',
    '/rank-loader.js',
    '/notice.js',
    '/boot.js',
    '/supabase-client.js',
    '/recaptcha.js',
    '/recaptcha.css',
    '/recaptcha-config.js',
    '/manifest-zh.json',
    '/manifest-en.json',
    '/lelelegame.svg',
    '/lelelegame.png',
    '/favicon.ico',
    '/favicon-winter.ico',
    '/icon-192.png',
    '/icon-512.png'
];

// 易变数据：必须尽快拿到新版本，但网络慢时要快速回退缓存
const DATA_PATH_RE = /(?:\/|^)(lelegame_data\.json|authors\/index\.json|authors\/data\/\d+\.json|announcements\.json|noticetodeveloper\.json|activity_whole\.json|special_common\.json|changelog\.json|manifest-(?:zh|en)\.json)$/;

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // 单个资源失败不影响安装
            await Promise.allSettled(
                ASSETS_TO_CACHE.map((u) => cache.add(u).catch(() => {}))
            );
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((names) => Promise.all(
            names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
        )).then(() => self.clients.claim())
    );
});

function isBasicOk(res) {
    return res && res.status === 200 && res.type === 'basic';
}

// 静态资源：缓存优先 + 后台更新（SWR）
async function staleWhileRevalidate(e) {
    const req = e.request;
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);

    const network = fetch(req).then((res) => {
        if (isBasicOk(res)) cache.put(req, res.clone()).catch(() => {});
        return res;
    }).catch(() => null);

    // 后台更新不阻塞本次响应，但用 waitUntil 尽量让它在 SW 存活期内完成
    if (cached) {
        e.waitUntil(network);
        return cached;
    }
    const res = await network;
    if (res) return res;
    if (req.mode === 'navigate') {
        return (await cache.match('/index.html')) || Response.error();
    }
    return Response.error();
}

// 数据 JSON：网络优先 + 1.5s 超时快速回退缓存
async function networkFirstWithTimeout(req, ms) {
    const cache = await caches.open(CACHE_NAME);
    const ctrl = new AbortController();
    let timer;
    try {
        const timed = new Promise((_, reject) => {
            timer = setTimeout(() => { ctrl.abort(); reject(new Error('sw timeout')); }, ms);
        });
        const res = await Promise.race([fetch(req, { signal: ctrl.signal }), timed]);
        clearTimeout(timer);
        if (isBasicOk(res)) cache.put(req, res.clone()).catch(() => {});
        return res;
    } catch (err) {
        clearTimeout(timer);
        const cached = await cache.match(req);
        // 无缓存时返回不可用的响应：前端各处都用 r.ok 判断并降级，不会抛错/白屏
        return cached || Response.error();
    }
}

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    if (!e.request.url.startsWith(self.location.origin)) return; // 外部直通

    let pathname;
    try { pathname = new URL(e.request.url).pathname; } catch (err) { pathname = ''; }

    if (DATA_PATH_RE.test(pathname)) {
        e.respondWith(networkFirstWithTimeout(e.request, 1500));
    } else {
        e.respondWith(staleWhileRevalidate(e));
    }
});
