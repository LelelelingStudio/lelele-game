const CACHE_NAME = 'lelele-pwa-v1.0';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/about.html',
    '/game.html',
    '/common.css',
    '/common.js',
    '/index.js',
    '/lelegame_data.json',
    '/lelelegame.svg',
    '/favicon.ico',
    '/icon-192.png',
    '/icon-512.png'
];

// 安装 Service Worker 并缓存核心资源
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('✅ 正在预缓存核心资源');
            return cache.addAll(ASSETS_TO_CACHE);
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

// 拦截网络请求（网络优先，失败时降级使用缓存）
self.addEventListener('fetch', (e) => {
    // 不缓存外部链接（比如外网游戏、Tally 表单）
    if (!e.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    e.respondWith(
        fetch(e.request)
            .then((response) => {
                // 如果请求成功，克隆一份放到缓存里
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // 网络失败（断网），去缓存里找
                return caches.match(e.request);
            })
    );
});
