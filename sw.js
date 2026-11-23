/* ==========================================================================
 * lelele-game Service Worker
 *
 * ★ v1.32 —— 图标位升级：id=1/2 共用 happyfarmer.lsfp 封面（coverFallback 特例允许回退 png）；
 *   lsfp-adapter.js 新增 hydrateGameCovers()，统一封面解码：成功显示、太慢(2.5s)/失败露 emoji、
 *   仅 coverFallback 接受旧图回退。三个页面封面渲染改走该入口；admin-apply 保留 coverFallback。
 *
 * ★ v1.31 —— 游戏封面：主数据/详情新增可选 cover 字段，首页游戏卡与四条横排、tag.html、
 *   game.html 类似游戏卡片均支持封面（PNG/JPG/WEBP 直显，LSFP 解码失败露 emoji 不回退旧图）。
 *   admin 控制台 / admin-apply.mjs / GAME_ENTRY_TEMPLATE.md 同步 cover；预缓存内 index.js/
 *   common.css/game.html 字节已改，故升版清旧缓存。
 *
 * ★ v1.30 (4.5.0) —— 新增本地功能（继续玩/想玩清单/手气不错/个人统计/标签专题页 tag.html）、
 *   冷门宝藏榜与作者贡献榜、SDK 扩展（submitRating/getLeaderboard/getPlayerName/isInPlatform/
 *   nextGame/shareScore/openDetail）+ play.html 分发、成绩分享页 share.html、SDK 文档 sdk-docs.html。
 *   文档脱敏（README/llms/developer_docs）、LICENSE 删除、内部手册移出仓库。
 *   三张新页加入预缓存；因上一批推荐系统改动了预缓存内文件字节却未升版本，本次一并升级清旧缓存。
 *
 * ★ v1.29 (爱种地农民 v1.0.10) —— id=1 游戏链接迁至 https://happyfarmer.game.leleleling.site；
 *   三类协议改为中英双语直链 {zh,en}（doc=1 用户协议 / doc=2 隐私 / doc=3 条款），
 *   game.html 与 play.html 的 safeLegalUrl() 支持 {zh,en} 对象按当前语言取值；详情加
 *   v1.0.10 更新日志。字节变升版本清缓存。
 *
 * ★ v1.28 (排行榜事件改 id + 兼容旧名) —— 游玩埋点从 play-game_<名称> 改为
 *   play-game_<id>（common.js/index.js/game.html 三处），改名不再切断历史统计。
 *   index.js 归集查找表注册 lelegame_data.json 的 previousNames 旧名别名，旧名事件
 *   与新 id 事件合并到同一游戏 id，展示名从 json 读当前名；id32 加 previousNames
 *   ["打僵尸"]，其历史 52 次旧名游玩重新归位。本地 gamecheck.html + analytics 仓库
 *   gamecheck.html 同步改为按 id 聚合、兼容旧名事件、展示读 json。字节变升版本清缓存。
 *
 * ★ v1.27 (改名) —— id=32 中文名「打僵尸」→「集装箱特区」（英文 3D Warehouse District
 *   不变）：lelegame_data.json / game/data/32.json 的 name_zh、noticetodeveloper.json 一条
 *   历史告示标题与正文的《打僵尸》、站点地图（脚本重建）同步；详情 updateLog 里「让僵尸
 *   死的更快」是玩法描述非游戏名，保留。数据 json 走 network-first 运行时缓存，升版本号
 *   清旧缓存确保改名即时生效。
 *
 * ★ v1.26 (新增 8 款本站游戏) —— 收录 2048 / Astray / Paper Minecraft / Clumsy Bird /
 *   Corona Runner / Hextris / T-Rex Runner / Tower Game（id 33-40，type=local）。本体放
 *   game/<目录>/，URL /game/<目录>/index.html；作者为外部开源作者（字符串名，无 uuid，
 *   不进 authors.json），原作者/许可/来源写进 game/data/<id>.json；有 LICENSE 的提取
 *   Copyright 作者，无 LICENSE 的只注明来源。游戏详情页/首页排行榜对字符串作者不生成
 *   死链，改显示纯文本（game.html/index.js/common.css）。站点地图重新生成（171 URL）。
 *   上述代码文件字节变故升 CACHE_NAME 清 v1.25 旧缓存。
 *
 * ★ v1.25 (4.4.0 高分榜 SDK) —— 新增 lelele-sdk.js（window.LeleleSDK.submitScore(score,
 *   {name}) 通过 postMessage 上报分数）；play.html 引入 Supabase 客户端，监听 message
 *   （校验 e.source === 游戏 iframe），写 game_scores 表并在「全服高分榜 Top10」卡片展示；
 *   允许匿名（本地随机昵称），读写失败静默降级不影响游戏。开发者文档 3.4 与 llms.txt
 *   加接入说明，并隐藏底层 JSON 文件名/路径。预缓存加 /lelele-sdk.js，升 CACHE_NAME 清旧缓存。
 *
 * ★ v1.24 (关注连点/重复绑定修复) —— 根因：mount() 是 async，addEventListener 在多个
 *   await 之后才执行；页面重绘（占位→数据→langChanged）多次调用 mount 导致同一按钮
 *   被绑 N 个 handler：早点是「点了没反应」，晚点是「一次点击 N 个并发 toggle 把
 *   day_op_count 推满、连弹 N 次上限、弹完状态才变」。修复：用 WeakMap 保证同一容器
 *   同一作者只挂一次；handler 同步注册（闭包持有 btn/uuid/uid，不依赖 await 闭包变量）；
 *   加 loading/busy 双守卫防加载中点击与连点。实测 3×mount→1 handler、连点2次→1 upsert、
 *   零弹窗、状态正确。
 *
 * ★ v1.23 (关注去重+告示修复) —— follow.js 改用 upsert(onConflict: follower_id,author_id,op_date)
 *   修复同日重复关注撞唯一约束 duplicate key；关注状态按当天最新行判定；id 永远新生成防主键冲突。
 *   notice.js：告示一展示即 markSeen（点操作按钮跳走也会标记）+ 一次登录只弹优先级最高一条，
 *   不再连播整个队列；noticetodeveloper.json 禁用 7 条过期告示（version 12）。
 *
 * ★ v1.22 (作者关注) —— 新增 follow.js（纯前端关注模块，走 Supabase follows 表 +
 *   现有 RLS，不改后端）：按 authors/index.json 把作者数字 id 换成 uuid，关注=INSERT
 *   /取关=UPDATE is_following（软删除），粉丝数=count(is_following=true)，每日上限 3 次
 *   （day_op_count/op_date）。作者页作者卡与游戏详情页作者栏各挂一个关注组件。
 *   预缓存清单加 /follow.js，字节变故升 CACHE_NAME 清 v1.21 旧缓存。
 *
 * ★ v1.21 (登录/安全修复) —— profile.html 补玩家密码重置落地（?type=recovery 与
 *   PASSWORD_RECOVERY 事件，弹窗 updateUser 改密）；dashboard.html 全部外部数据
 *   （OAuth 昵称/头像 URL/作者名/游戏名）加 escHtml+safeUrl 防 stored XSS；作者清单
 *   拉取失败不再放行后台；common.js 首页身份判断统一走 authors uuid（弃用 profiles
 *   authorlevel/is_author）；login 已登录分支按身份分流、user-login 不再写跨页残留标记；
 *   recaptcha.js 收紧 fail-open（仅真 5xx/熔断/15s 超时放行，本地错误不再误放行），
 *   loadGoogle 超时清空 promise 修永久 fail-open。上述文件字节变故升缓存版本清旧脚本。
 *
 * ★ v1.20 (验证码超时放行) —— recaptcha.js：连不上 Google / 验证服务故障或 15s
 *   无响应时自动跳过验证继续登录注册，不再卡死；空 ticket 不再请求后端 consume。
 *
 * ★ v1.19 (玩家登录与个人中心) —— 新增 /user-login.html 玩家登录注册、
 *   /profile.html 个人中心；common.js 顶部按身份分流（作者进后台、玩家进个人中心）；
 *   dashboard 非作者闸门。补预缓存清单，common.js / sw.js 字节变故升版本。
 *
 * ★ v1.16 (后台双语 + 主动复验) —— dashboard 头像/资料/注销等提示补齐英文，
 *   apply-certification.html / stats.html 补早期语言脚本修复 ?lang=en；
 *   设置面板新增低调的主动 reCAPTCHA 复验入口，通过后刷新 7 天倒计时。
 *   common.js / recaptcha.js / dashboard.html 字节已变故升缓存版本。
 *
 * ★ v1.15 (榜单双语与参数) —— favgames.html / gamecheck.html 补齐中英双语
 *   UI 并支持 ?lang / ?range / ?limit 参数；about.html 将「了了了读」改为已上线
 *   链接。两页字节已变故升 CACHE_NAME 清 v1.14 旧缓存；三分支 fetch 策略、
 *   cacheKeyFor() 与预缓存清单未改动。
 *
 * ★ v1.14 (文档/站点地图一致性) —— authorlevel.html 补 head 早期语言脚本（修
 *   ?lang=en 不生效）、sitemap.xml / sitemap.html 由 scripts/gen-sitemap.py 全量重建
 *   （补齐 id 23–32、作者 8–10、play/stats/favgames 等页面）。预缓存清单同时补上
 *   之前漏掉的 /play.html、/stats.html、/favgames.html（50 → 53 项，均真实存在）。
 *   字节已变故升 CACHE_NAME 清 v1.13 旧缓存；三分支 fetch 策略与 cacheKeyFor() 未改动。
 *
 * ★ v1.13 (排行榜修正) —— index.js 修复收藏事件（fav-game_<id>，按游戏 id）
 *   与游玩事件（play-game_<name>，按游戏名）命名空间不一致导致总榜未加权的问题：
 *   现先统一归一到游戏 id 再合并，总榜 = 收藏×5 + 游玩；弹窗总榜量词改「排行点」。
 *   升 CACHE_NAME 清 v1.12 旧缓存，确保用户拿到新 index.js。三分支 fetch 策略、预缓存清单未改动。
 *
 * ★ v1.12 (admin 富媒体) —— common.js 公告消毒白名单新增 IMG/alt，支持公告正文
 *   插入图片链接；.lsfp 图片经 promoteLsfpImages 抬升后由适配层水合。本文件仅因
 *   common.js 字节变化触发重新 install/activate、清理 v1.11 旧缓存；三分支 fetch
 *   策略、cacheKeyFor() 与预缓存清单（50 项）未改动，admin 页（github/admin.html）不进玩家预缓存。
 *
 * ★ v1.11 (循环导航) —— 新增 /pager-nav.js（详情页/作者页上一个·下一个），
 *   加入预缓存并升 CACHE_NAME 清 v1.10 旧缓存。三分支 fetch 策略、
 *   cacheKeyFor() 与其余预缓存清单均未改动。
 *
 * ★ v1.10 (LSFP 图片) —— 内置 /lsfp.js 解码库与 /lsfp-adapter.js 适配层，
 *   两者加入预缓存，保证离线与首访即可解码；升 CACHE_NAME 清 v1.9 旧缓存。
 *   fetch 三分支策略（静态 SWR / 数据超时回退 / 外部域直通）一字未改；
 *   gamepic.surge.sh 的 .lsfp 跨域请求仍走外部域直通，不新增缓存分支。
 *
 * ★ v1.9 (bugfix) —— 修复缓存键与离线链路：规范化 ?t= 时间戳缓存键、
 *   用 URL.origin 判断同源、await cache.put、带参导航不再返回首页 HTML、
 *   数据策略补 game/data/*.json。缓存结构变化，必须升 CACHE_NAME 清旧缓存。
 *
 * ★ v1.8 (4.1.0 / 规则 5.0.0) —— 本文件改动字节内容，触发浏览器重新 install/activate，
 *   清理 v1.7 及更早缓存。原因：4.1.0 合规升级新增 7 个页面/文件（用户协议、协议模板中心、
 *   三份万能协议、万能协议公共常量、游戏守则 4.0.2 历史快照），必须让新页面
 *   立即进入预缓存，保证清缓存首访与离线状态下协议内容可读。
 *   fetch 策略三个分支（静态 SWR / 数据超时回退 / 外部域直通）完全未改动。
 *   不重新引入自动 reload（历史上曾导致反复刷新）。
 *
 * ★ v1.7 (4.0.16) —— 本文件再次改动字节内容，触发浏览器重新 install/activate，
 *   清理 v1.6 及更早缓存。原因：4.0.16 新增了 dashboard 的「更新游戏」表单链路、
 *   游戏守则 4.0.2 归类条款与两类公告数据；静态资源走 stale-while-revalidate，
 *   部署后首次访问仍可能返回旧缓存，必须让新代码立即到达。
 *   fetch 策略三个分支（静态 SWR / 数据超时回退 / 外部域直通）完全未改动。
 *   说明：本版本不含任何缓存策略调整（用户决定暂缓国内外加速方案）。
 *
 * ★ v1.6 (4.0.15) —— 本文件再次改动字节内容，触发浏览器重新 install/activate，
 *   清理 v1.5 及更早缓存。原因：4.0.15 批量修复了 plan.md 的 170 项审计清单，
 *   涉及 boot.js（统一 fetch 超时 / 内联事件提升器 / 可调日志）、common.js、
 *   以及 20+ 个 HTML 页面；静态资源走 stale-while-revalidate，部署后首次访问
 *   仍可能返回旧缓存，必须让新代码立即到达。同时补齐了预缓存清单遗漏的 5 个页面。
 *   fetch 策略三个分支（静态 SWR / 数据超时回退 / 外部域直通）完全未改动。
 *
 * ★ v1.5 (4.0.14) —— 本文件再次改动字节内容，触发浏览器重新 install/activate，
 *   清理 v1.4 及更早缓存。原因：4.0.14 修改了 boot.js（Tally 表单挂载能力）、
 *   index.js / index.html / apply-certification.html（表单显示链路）与 11 个游戏页，
 *   而静态资源走 stale-while-revalidate，部署后首次访问仍可能返回旧缓存。
 *   fetch 策略三个分支（静态 SWR / 数据超时回退 / 外部域直通）完全未改动。
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
const CACHE_NAME = 'lelele-pwa-v1.32';

// 仅预缓存轻量核心资源。重型第三方库（vendor/*.js）改为运行时按需缓存，
// 避免 install 阶段一次性下载 1.5MB 拖慢首访。
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/about.html',
    '/docs.html',
    '/game.html',
    '/play.html',
    '/author.html',
    '/dashboard.html',
    '/login.html',
    '/user-login.html',
    '/profile.html',
    '/404.html',
    '/apply-certification.html',
    '/authorlevel.html',
    '/gamecheck.html',
    '/stats.html',
    '/favgames.html',
    '/sitemap.html',
    '/tag.html',
    '/share.html',
    '/sdk-docs.html',
    '/game_rules4-0-0.html',
    '/game_rules4-0-1.html',
    '/game_rules4-0-2.html',
    '/user_agreement.html',
    '/legal_templates.html',
    '/generic_eula.html',
    '/generic_privacy.html',
    '/generic_tos.html',
    '/legal_generic.js',
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
    '/lsfp.js',
    '/lsfp-adapter.js',
    '/pager-nav.js',
    '/supabase-client.js',
    '/lelele-sdk.js',
    '/follow.js',
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
const DATA_PATH_RE = /(?:\/|^)(lelegame_data\.json|authors\/index\.json|authors\/data\/\d+\.json|game\/data\/\d+\.json|announcements\.json|noticetodeveloper\.json|activity_whole\.json|special_common\.json|changelog\.json|manifest-(?:zh|en)\.json)$/;

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

// 规范化缓存键。common.js / notice.js 用 ?t=Date.now() 击穿 CDN，若直接拿原始
// Request 当键，每次都是新 key：缓存无限膨胀，且 1.5s 超时/离线回退永远 match 不到。
// HTML 导航的 ?lang= / ?id= 只是运行时参数，同一 pathname 复用同一份 HTML 缓存。
function cacheKeyFor(req) {
    try {
        const u = new URL(req.url);
        if (req.mode === 'navigate' || u.pathname === '/' || /\.html?$/i.test(u.pathname)) {
            return u.origin + u.pathname;
        }
        if (u.search) {
            ['t', '_', 'ts', 'cb', 'nocache', 'cacheBust'].forEach((k) => u.searchParams.delete(k));
        }
        return u.origin + u.pathname + (u.search || '');
    } catch (e) { return req.url; }
}

// 静态资源：缓存优先 + 后台更新（SWR）
async function staleWhileRevalidate(e) {
    const req = e.request;
    const cache = await caches.open(CACHE_NAME);
    const key = cacheKeyFor(req);
    const cached = await cache.match(key);

    // 必须 await 缓存写入：否则 waitUntil(network) 在 fetch 一完成就 resolve，
    // SW 被浏览器回收后「后台更新」静默丢失。
    const network = fetch(req).then(async (res) => {
        if (isBasicOk(res)) await cache.put(key, res.clone()).catch(() => {});
        return res;
    }).catch(() => null);

    if (cached) {
        e.waitUntil(network);
        return cached;
    }
    const res = await network;
    if (res) return res;
    if (req.mode === 'navigate') {
        // 不能把 /index.html 的 HTML 返回给 /game.html?id=N：URL 与内容不符，
        // 用户会在详情页地址下看到首页。仅首页自身回退首页缓存。
        let path = '';
        try { path = new URL(req.url).pathname; } catch (err) {}
        if (path === '/' || path === '/index.html') {
            const home = await cache.match(self.location.origin + '/index.html');
            if (home) return home;
        }
        return new Response(
            '<!doctype html><meta charset="utf-8"><title>Offline</title>' +
            '<p style="font:16px/1.7 system-ui;padding:24px">Network unavailable. Please retry.</p>',
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
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
        if (isBasicOk(res)) await cache.put(cacheKeyFor(req), res.clone()).catch(() => {});
        return res;
    } catch (err) {
        clearTimeout(timer);
        const cached = await cache.match(cacheKeyFor(req));
        // 无缓存时返回不可用的响应：前端各处都用 r.ok 判断并降级，不会抛错/白屏
        return cached || Response.error();
    }
}

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    // startsWith(origin) 会把 https://origin.evil.com / https://origin@evil.com
    // 误判为同源；必须用 URL.origin 精确比较。
    let pathname;
    try {
        const u = new URL(e.request.url);
        if (u.origin !== self.location.origin) return; // 外部直通
        pathname = u.pathname;
    } catch (err) { return; }

    if (DATA_PATH_RE.test(pathname)) {
        e.respondWith(networkFirstWithTimeout(e.request, 1500));
    } else {
        e.respondWith(staleWhileRevalidate(e));
    }
});
