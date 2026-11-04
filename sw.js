const CACHE_NAME = 'lelele-pwa-v1.2';

// 预缓存清单：仅覆盖页面与长期静态资源。
// 注意：易变数据文件（lelegame_data.json / activity_whole.json / announcements.json /
// special_common.json）以及重型季节性图片（冬季图）不进预缓存——它们由运行时
// network-first 策略按需拉取并缓存，预缓存只会产生陈旧副本且拖慢安装。
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
    '/common.js',
    '/index.js',
    '/search.js',
    '/rank-loader.js',
    '/notice.js',
    '/recaptcha.js',
    '/recaptcha.css',
    '/recaptcha-config.js',
    '/supabase-client.js',
    '/manifest-zh.json',
    '/manifest-en.json',
    '/lelelegame.svg',
    '/lelelegame.png',
    '/favicon.ico',
    '/favicon-winter.ico',
    '/icon-192.png',
    '/icon-512.png'
];

// 安装 Service Worker 并缓存核心资源（弹性：单个资源失败不影响安装）
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('✅ 正在预缓存核心资源 (', CACHE_NAME, ')');
            await Promise.allSettled(
                ASSETS_TO_CACHE.map((u) => cache.add(u).catch((err) => console.warn('跳过缓存:', u, err)))
            );
        }).then(() => self.skipWaiting())
    );
});

// 激活并清理旧版缓存
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ 清理旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 拦截网络请求：同域走网络优先（保证版本更新即时生效），失败再降级缓存；外部链接直通
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    if (!e.request.url.startsWith(self.location.origin)) return;

    e.respondWith(
        fetch(e.request)
            .then((response) => {
                // 仅缓存成功的同域响应
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
                }
                return response;
            })
            .catch(() => caches.match(e.request))
    );
});
