# foraisthings.md · lelele Game 项目手册（给未来 AI 的接手指南）

> **本文件由 AI 维护、实时更新，已被 `.gitignore` 忽略（GitHub Desktop push 时不会推送）。**
> 目的：让未来的 AI（以及人类协作者在本地克隆后）能够零上下文理解本项目并安全接手改造。
> 如果你（AI）接手本项目，请先通读本文件，改完任何结构性/功能性内容后，同步更新本文件末尾的「变更记录」。

---

## 0. 一句话定位

**了了了游（lelele Game）** 是「了了了岭工作室」旗下的 **纯前端 HTML5 小游戏聚合导航站**：打开网页即玩，主打工作间隙摸鱼。部署在 GitHub Pages + Cloudflare，域名 `game.leleleling.site`。

---

## 1. 技术栈（零框架）

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | 纯 HTML + CSS + 原生 JS | 无构建链路、无框架、无打包器 |
| 数据 | JSON 文件（手改 + 拉取） | `lelegame_data.json`、`announcements.json`、`activity_whole.json` 等 |
| 后端/账号 | Supabase（Postgres + Auth） | 仅开发者生态用到（登录、后台、收藏持久化可选） |
| 表单 | Tally 嵌入 | 投稿/推荐/反馈 |
| 部署 | GitHub Pages + Cloudflare 加速 | 静态托管 |
| 统计 | Edgemetry / Umami | `leleleTrack()` 统一埋点 |

**铁律**：不要引入 React/Vue/Tailwind CDN 之外的构建工具；保持「改完即上线」的静态站点形态。

---

## 2. 目录结构（根目录）

```
lelele-game/
├── index.html            # 首页（游戏列表 + 侧边栏排行榜/公告）
├── about.html            # 关于我们
├── docs.html             # 站点文档中心
├── game.html             # 游戏详情页
├── game/                 # 子目录：各游戏（含独立 html/css/js/json）
├── login.html            # 开发者登录/注册
├── dashboard.html        # 开发者后台
├── developer_docs.html   # 开发者文档
├── privacy.html / terms.html / copyright.html   # 合规页
├── 404.html / sitemap.html / sitemap.xml / robots.txt
├── common.css            # ★ 全局样式（设计令牌、导航、灵动岛、卡片、弹窗…）
├── common.js             # ★ 全局脚本（主题/活动/雪花/页脚/浮动工具/公告/登录注入）
├── index.js / search.js / notice.js / rank-loader.js   # 页面级脚本
├── supabase-client.js / recaptcha*.js   # 鉴权与人机验证
├── boot.js                   # ★ head 同步引导：onReady / fetchAuthors / mountTallyIframe / 异步注入 analytics
├── vendor/                   # ★ 自托管 UMD 库：supabase-js.js / pinyin-pro.js / echarts.min.js（消除 jsdelivr 依赖）
├── sw.js                     # ★ Service Worker v1.5：静态 SWR 秒开 + 数据超时回退
├── plan.md                   # ★ 全站问题清单：大/中/小/迷你四级共 170 项（定位 + 影响 + 建议修法 + 状态）
├── lelegame_data.json / announcements.json / activity_whole.json / special_common.json / changelog.json / manifest-zh.json / manifest-en.json  # 数据/配置
├── authors/                     # 作者数据本地兜底：index.json 轻量清单 + data/<id>.json 仅 games_count（主源为 surge 跨域）
├── lelele-game.code-workspace   # VS Code 工作区
├── foraisthings.md       # 本文件（已被 .gitignore 忽略）
└── .gitignore            # 已忽略 foraisthings.md
```

> 注：本仓库根即 git 仓库（`git rev-parse --show-toplevel` = 本目录）。

---

## 3. 关键系统

### 3.1 多语言（中英双语）
- 语言状态存 `localStorage.lelele_lang`（`zh`/`en`），由 `index.html` 内联脚本在 `<head>` 早期防闪烁设定 `data-lang`。
- 切换函数 `window.setLang(lang)` 在 `common.js`；切换后派发 `langChanged` 事件。
- **标记约定**：用 `.zh-inline`/`.en-inline`（行内）与 `.zh-text`/`.en-text`（块级）控制显隐，`html[data-lang]` 决定显示哪组。新增文案请沿用此模式。

### 3.2 深色模式
- `initTheme()` 读 `localStorage.lelele_theme` 或系统偏好，`html.dark-mode` 切换。
- 所有颜色走 CSS 变量（`common.css` 的 `:root` 与 `html.dark-mode`），不要写死颜色。

### 3.3 活动 / 冬季雪天主题（重点）
- 配置在 **`activity_whole.json`**：
  - `specialPeriod` / `yearlyPeriod`：激活时间锁（`yearlyPeriod` 的 `end < start` 会自动滚动到下一年）。
  - `assets`：背景/ favicon / logo / banner / 雪人 / 树 的冬季资源 URL。
  - `enableSnowfall`：是否飘雪。
  - `forceEnable`：强制开启（调试用）。
- 逻辑在 `common.js` 的 `initActivityTheme()` + `initSnowfall()`。激活后给 `html` 加 `.activity-mode`，注入冬季背景、替换 logo/favicon、加雪人/树贴纸、按需启动雪花 canvas（`<canvas id="snowfall-canvas">`）。
- `special_common.json` 仅用于 `skip_effects_domains/paths`（某些页面/域名跳过特效，如全屏游戏页），**不含日期**。

> **当前雪天周期**：已由 2026-12-31 延长至 **2027-01-31**（4.0.0 改动）。改日期只动 `activity_whole.json` 的两处 `end`，逻辑层无需改。

### 3.4 公告系统
- `initAnnouncements()` 拉 `announcements.json`，按 `publishDate`/`expireDate` 过滤，首页侧栏显示前 3 条；支持「查看详情」弹窗、单条 24h 静音、未读提醒、全部公告弹窗。
- 存储键：`lelele_read_announcements` / `lelele_closed_announcements`。

### 3.5 排行榜 / 收藏
- 首页侧栏 `rank-showcase`，数据来自后端或 JSON；`rank-loader.js` 负责加载。
- 收藏存 `localStorage`（`favoritesModal` 弹窗），与游戏卡片收藏按钮联动。

### 3.6 投稿 / 推荐 / 反馈
- 投稿：`stepGuide → stepAuth → stepTally` 三步弹窗（Tally 表单），未登录会提示「去推荐 / 去登录」两条路径（`initMainSiteAuth` 拦截）。
- 推荐：`recommendModal` 直接 Tally 表单，免登录。
- 反馈：右下角悬浮按钮 → Tally 弹窗。

### 3.7 鉴权与 UI 注入
- `initMainSiteAuth()`（common.js）：登录后向 `.right-actions` 注入「开发者面板」与用户头像；拦截投稿按钮做人机验证。
- 游戏页（`/game/` 路径）设 `isGamePage`，跳过部分注入（如滑动提示、浮动工具、活动背景），保证纯净游玩。

### 3.8 其它
- 滑动提示浮窗（`initSlideHint`，30 天防重复）、PWA（`sw.js` + manifest + `beforeinstallprompt`）、Edgemetry/Umami 埋点（`leleleTrack`）。

---

## 4. 顶部导航 + 灵动岛（4.0.1 重做）

> 详见 `common.css`（`.top-bar`、`.top-bar.island-mode`）与 `common.js`（`initIslandNav` 滚动监听 + 注入 `.island-search-btn`）。
> ⚠️ **4.0.1 已弃用 4.0.0 的 `.di-keep`/`.di-icon`/`.di-hide` 分级 class**，改为：岛模式下用 `.island-mode .btn-about/.btn-docs/.btn-support/.recommend-btn/.studio-link{display:none}` 隐藏次级按钮，保留 `.lang-switch`/`.action-btn`/`.island-search-btn`；搜索行与分类行用 `max-height:0` 平滑收起。

**行为**：
- 不滚动（`scrollY ≤ 80`）：顶部三行导航保持原样（Logo+标题+右侧按钮 / 类型导航+搜索+收藏 / 分类筛选）。
- 向下滚动（`scrollY > 80`）：`.top-bar` 加 `.island-mode`，morph 成居中大号「灵动岛」胶囊（深色半透明 + 强毛玻璃 + 大圆角）。

**三级分级**（class 标记在 HTML 上，CSS 控制显隐）：
- `.di-keep`（完整保留）：搜索 Search、语言切换 中/EN、支持我们 Support。
- `.di-icon`（仅图标）：投稿、推荐游戏、关于、文档、工作室、收藏、开发者面板、用户头像。
- `.di-hide`（完全隐藏）：刷新提示、标题长文字、第三行分类筛选（类型筛选收进「筛选」图标弹层）。

**实现要点**：滚动监听用 `passive` + `requestAnimationFrame` 节流；动态注入的 Dashboard/头像在创建时同步加 `.di-icon`；JS 未执行时导航保持原状（渐进增强）。

---

## 5. 设计系统（4.0.0 起：苹果风 + 折中配色）

参考 `../苹果风网站升级/DESIGN.md`（Apple HIG：留白、毛玻璃、pill 按钮、17px 正文、负字距标题、唯一产品投影、无装饰渐变）。

**配色（折中，非整体换蓝）**：
- `--primary: #4f46e5`（靛蓝品牌主色，**保留**）
- `--accent: #0071e3`（冷静系统蓝，仅用于链接/焦点/强调，DESIGN.md 一致值）
- 背景：`#ffffff` / `#f5f5f7`（parchment） / 深色 `#0f172a`
- 正文：`#1e293b`，深色 `#f8fafc`
- 功能色：蓝 `#0071e3`、绿 `#10b981`、橙 `#f59e0b`、红 `#ef4444`

字体栈：`-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Noto Sans SC', sans-serif`。

---

## 6. 本地运行与部署

- 纯静态：**直接双击 `index.html` 即可本地预览大部分功能**（部分需 Supabase/域名的功能需起本地服务器，如 `python3 -m http.server`）。
- 部署：推送 GitHub 主干 → GitHub Pages 自动发布（Cloudflare 加速）。
- ⚠️ **`foraisthings.md` 已被 `.gitignore` 忽略，不会推送到 GitHub**；从 GitHub 新克隆的协作者/AI 看不到它，仅本地可见。如需团队共享需另议。

---

## 7. 代码约定（给 AI 的提醒）

1. **加新按钮/导航项**：按需要加 `.di-keep` / `.di-icon` / `.di-hide` 分级 class（详见第 4 节）。
2. **加颜色**：只动 `common.css` 的 `:root` 变量，不要在散落处写死 hex。
3. **加文案**：中英双语，用 `.zh-inline/.en-inline` 或 `.zh-text/.en-text`。
4. **动活动/雪天**：只改 `activity_whole.json`，逻辑在 `common.js` 不要改除非必要。
5. **改完任何结构性内容**：更新本文件末尾「变更记录」，并视情况更新 `README.md` 项目简介。
6. **不要破坏**：搜索、类型/分类筛选、收藏、投稿/推荐弹窗、Supabase 登录注入、公告、滑动提示、雪天花效。

---

## 8. 版本号规则（非常重要）

采用「苹果 macOS 式」三段版本 `主.中.微`：
- **A（大版本 / Major）**：重大架构/体验重构。**做任何 A 升级前必须先征求用户（David）同意**，且首位数字 +1（如 `3.3.0 → 4.0.0`，次/微归零）。
- **B（中版本 / Minor）**：功能级升级，AI 可自行决定，但不要太频繁。
- **C（微版本 / Patch）**：修修补补。

> 当前版本：**4.0.14**（起点 3.3.0）。4.0.0 起为「超级 UI 大重构（苹果风 + 灵动岛）」A 升级，已获用户授权；4.0.2–4.0.10 等中间版本改动详见 `changelog.json`。

每次发版在 `changelog.json` 数组**头部** `unshift` 一条（含 `version`、`date`、`content_zh`、`content_en`）。

---

## 9. 变更记录（本文件随项目实时更新）

- **2026-11-02 · 4.0.0（A 大版本，已授权）**：启动超级 UI 大重构。
  - 雪天/冬季活动截止由 2026-12-31 延长至 **2027-01-31**（`activity_whole.json` 两处 `end`）。
  - 引入苹果风设计基座：保留靛蓝 `#4f46e5` 主色，新增系统蓝强调色 `--accent:#0071e3`，统一留白/毛玻璃/pill/17px 正文令牌。
  - 新增「灵动岛」滚动导航：`.island-mode` + 三级分级（`.di-keep`/`.di-icon`/`.di-hide`），搜索/语言/支持保留完整，其余图标或隐藏。
  - 本手册 `foraisthings.md` 新建，并加入 `.gitignore`（不推送）。
- **设计基座（common.css）**：保留靛蓝 `#4f46e5` 主色，新增系统蓝强调色 `--accent:#0071e3`（深色 `#2997ff`）；统一圆角（md/lg/pill）、毛玻璃强度、留白节奏、柔和阴影令牌；正文 17px + 标题负字距；链接默认走系统蓝。
- **灵动岛导航（index.html 首页跑通）**：滚动 >80px 时 `.top-bar` morph 为居中深色胶囊岛（`.island-mode`）。三级分级：`.di-keep`（搜索/语言/支持，完整保留）、`.di-icon`（投稿/推荐/关于/文档/工作室/收藏/开发者面板/头像，仅图标）、`.di-hide`（标题文字/刷新提示，隐藏）；类型/分类筛选收进「🔍 筛选」图标弹层（点击展开）。滚动监听用 `passive` + `requestAnimationFrame` 节流；动态注入元素已加 `di-icon`；JS 未执行时导航保持原状（渐进增强）。
  - _（全站推广、README 项目简介更新将在后续里程碑补充）_

---

## 10. 4.0.0 留存与体验增强（2026-11-03）

### 10.1 设置面板（⚙️ / 🎛️ 排版，4.0.1 修正）
- 入口：`#openSettingsBtn`（⚙️ 设置）、`#openLayoutBtn`（🎛️ 排版）。模块在 `common.js` 的 IIFE（`buildSettingsPanel` / `openSettings` / `closeSettings` / `initSettings` / `initLayout` / `toggleLayout`）。
- 功能：主题色 6 预设 → **同时写 `--primary` 与 `--accent`**（`applyAccent`，因为站内组件两令牌都在用，只改一个会「看起来没用」）+ `localStorage.lelele_accent`；字号 ± → **`document.body.style.zoom`**（站内文本多为 px 定值，仅改根 font-size 不生效）+ `--ui-scale` 令牌 + `localStorage.lelele_font_scale`。
- UI：右侧滑出毛玻璃面板（`#leleleSettings`），样式 `.lelele-settings-panel/*.card` 等均在 `common.css`。

### 10.2 自定义背景
- `processCustomBg(file)`（`common.js`）：FileReader → Image → canvas 采样 64×64 计算「信息量」（`analyzeImage`：亮度方差 + 边缘密度），信息量大则遮罩淡化多（dim 0.22–0.72），小则淡化少；边框检测（环形 vs 内部方差）决定要不要补 1px 描边。
- 应用：`#customBgLayer` 固定层 `z-index:-2`（夹在 body 背景与内容之间，**不遮挡**雪花 canvas `z-index:9990` 与贴纸），叠加明暗渐变遮罩。
- 持久化：`localStorage.lelele_custom_bg`（含 dataUrl/hasBorder/dim/setAt）。**每 14 天强制重新上传**，过期自动清除并 toast「已恢复默认背景」。

### 10.3 自定义排版
- 入口：`#openLayoutBtn`（灵动岛 `.di-icon`），或由设置面板「进入排版模式」。
- `toggleLayout()`：给 `#topRightActions > *` 加 `.layout-draggable`，pointer 拖拽上下微调（±18px），位置存 `localStorage.lelele_layout_positions`（键 `layoutKey` = id 或首个 `btn-` class）。再点按钮或 Esc 退出并 `exitLayout()` 保存。

### 10.4 OTF 展示字体
> ⚠️ **已被 revert，不在当前代码库**（`fonts/` 已删除）。如需恢复需重新放入 `.otf` 并在 `common.css` 注册。

### 10.5 搜索增强（4.0.1 修正）
- `search.js`：相关度排序（精确>前缀>包含>拼音>连续子序列兜底）、字段权重（标题 1.0 / 分类 0.75 / 作者 0.6）、去重、按范围筛选（`scope`：`all`/`game`/`author`）。
- `index.js`：`renderGames` 支持搜索范围切换条（全部/游戏/作者 `#searchScopeBar`）、结果展示作者（`game.author` 行）；**作者范围渲染真正的作者卡片**（`renderAuthorCard`：头像 + 名称 + 作品数，点击跳 `author.html?id=`）；**首页 25 条分页**（`pageSize=25`，`#searchPagination` 上一页/页码/下一页，>25 才出现）。
- 收紧旧版「单字符/乱序显示一大堆」的宽松子序列兜底（现要求查询 ≥2 且完整顺序命中才计分）。

### 10.6 国内性能 / 可达性
> ⚠️ **已被 revert，不在当前代码库**（`vendor/supabase.js` 自托管方案当时被撤销；当前仍是 jsdelivr 引用）。如需恢复需重新下载 UMD 到 `vendor/` 并改引用。

### 10.7 SEO / UX 修复
> ⚠️ **已被 revert，不在当前代码库**（7 页的 favicon/OG/Twitter/canonical/扩展 title 当时被撤销）。如需恢复需重新注入。

---

## 11. 4.0.1 修复版要点（2026-11-03，4.0.0 被 revert 后重做）

**缓存根治（关键）**
- `sw.js` 缓存名升 `lelele-pwa-v1.1`，预缓存全部页面 + css/js/json；`activate` 阶段 `skipWaiting` + `clients.claim` + 删旧缓存；`common.js` 注册 SW 后监听新版本并**自动刷新一次**（sessionStorage 防抖），消除线上新旧资源混染。

**reCAPTCHA 容错（recaptcha.js）**
- `fetchJson` 加 **8s AbortController 超时** + 解析 HTTP 状态与后端 `error` 码；**5xx/网络**显示友好文案「安全验证服务暂时不可用」，且**只在内联/弹层一处展示**（去重，不再裸显 `internal_error` 双重显示）。
- `verifyToken` **不再对 5xx 用同一 token 重试**（reCAPTCHA token 一次性，Google 已消费后重试必得 `timeout-or-duplicate`→`google_rejected`）；仅网络层失败（fetch 抛错、无 HTTP 响应）重试 1 次。**熔断**：`sessionStorage` 累计服务端错误 ≥3 次即 `isBreakerOpen`，之后 `periodic_reverify` 直接放行（`skipped:true`，跳过 `/consume`）；`login/register` 仍走严格分支。v3 正常返回路径上的 `skipped` 也正确放行（修复过一处误报「验证未通过」的分支缺失）。
- **4xx 错误码映射友好文案**（`friendlyReason`）：`google_rejected`→「人机验证未通过，请重试」等，任何错误码都不再裸显给用户。
- 控制台输出结构化诊断（`[reCAPTCHA] 接口返回非 2xx: {path,status,error,decision}`）。
- **后端 500 真正根因（2026-11-03 定位，与密钥无关）**：`api/captcha/verify.js` 第 79 行 Google 校验通过后调用 `issueTicket({mode: provider})`，`provider='recaptcha'`，但 `lib/env.js` 的 `MODES=['v3','v2','bypass','hcaptcha','turnstile']` **不含 `'recaptcha'`** → `assertMode` 抛 `Unsupported captcha mode` → `publicError` 不识别 → **500 internal_error**。此时 token 已被 Google 消费，前端旧逻辑重试同 token 必得 400 `google_rejected`（与用户截图「一次 500 + 一次 google_rejected」完全吻合）。**修复**：`MODES` 加入 `'recaptcha'`（发/验 ticket 两侧同时修好），本地单测 `issueTicket(mode:'recaptcha')`+`verifyTicket` 通过；线上真实 token 实测 500 消失。Vercel 密钥（`CAPTCHA_TICKET_SECRET`/`RECAPTCHA_V3/V2_SECRET`/`ALLOWED_*`）经用户截图确认均已配置且工作正常（`provider:'none'` bypass 路径 200 + 合法 ticket + CORS 头齐全）。
- 后端另有防御层：`lib/ticket.js`/`lib/google.js` 缺失/过短密钥时优雅返回 `503 verification_unavailable`（不再抛 500）；`.env.example` 列出必填变量。

**雪期**：`activity_whole.json` 两处 `end` 延长至 `2027-01-31`（跨年逻辑在 `common.js` 已兼容）。

### 变更记录补充
- **2026-11-03 · 4.0.1 修复版**（见第 11 节）：缓存根治（sw.js v1.1 + 自动刷新）/ 灵动岛重做（52px 胶囊 morph）/ 搜索三范围 + 作者卡片 + 25 条分页 / 设置换色双令牌 + 字号 zoom 立即生效 / 雪期延至 2027-01-31 / reCAPTCHA：**后端 500 根因修复（env.js MODES 补 'recaptcha'，与密钥无关）** + 前端取消同 token 重试 + 4xx 友好文案 + 服务端错误≥3次熔断跳过验证 + 后端缺密钥防御性降级 503。
- _（10.4 OTF 字体 / 10.6 自托管 vendor / 10.7 SEO 在 4.0.0 被 revert 后未重做，当前代码库不含这些功能。）_
- **2026-11-04 · 4.0.11（Patch）**：性能根治 + 作者数据本地化。
  - **白屏/卡顿真正根因修复**：6 个公开页 `<head>` 中同步加载的 `supabase-js`（jsdelivr 国内不稳）会阻塞 HTML 解析导致整页白屏，全部改为 `defer`。4.0.8–4.0.10 只修了数据 fetch 的非阻塞，未修脚本阻塞，故仍偶发白屏——本次补齐。
  - 所有数据 `fetch`（lelegame_data.json / `fetchAuthors` / notice.js / `getCatalog` / 排行榜 analytics）加 **8s AbortController 超时**并去掉 `no-store` 与 `?t=`，改用普通缓存（ETag 重校验，更新即生效）。
  - **作者数据本地分文件**：新增 `authors/index.json`（轻量清单：id/uuid/名字/等级/徽标，省略默认与空值，保留平台字段）+ `authors/data/<id>.json`（仅 `games_count`，由 lelegame_data.json 自动统计），**删除 `authors.json`**；`fetchAuthors()` 改读 `index.json`，消费者（author / game / index / dashboard / notice）接口契约不变。
  - **可编辑资料与头像仍走 Supabase**：作者页按 uuid 非阻塞查询 `profiles`（bio/role/display_name/avatar_url），与 dashboard 编辑同源——作者换头像或改简介/名字无需改任何文件，失败降级默认图 + 「头像加载失败」提示。
  - **同步工作流改造**（`.github/workflows/sync-authors.yml`）：仍以 surge.sh 的 `authors.json` 为唯一编辑入口，每 30 分钟拉回并**拆分为 index.json + data/<id>.json**、删除旧 `authors.json`，触发 Pages 重建。新增作者只改 surge 即自动同步，无需手动碰仓库。
  - 注：本手册此前漏更，4.0.2–4.0.10 改动未记录（以 `changelog.json` 为准）。
- **2026-11-05 · 4.0.12（Patch）**：全站访问速度根治，目标**国内外都能快速打开**。
  - **真正的根因（4.0.11 的 defer 引入的回归）**：`defer` 脚本必须在 `DOMContentLoaded` 之前全部下载并执行完，而全站初始化（`common.js` 主入口、`index.js` 首页游戏列表、各页内联初始化）都挂在 `DOMContentLoaded` / `load` 上。4.0.11 把 jsdelivr 的 `supabase-js` 改成 `defer` 后，`cdn.jsdelivr.net` / `analytics.leleleling.site` 在国内挂起（**浏览器对 script 请求没有默认超时**）→ 这两个事件永不触发 → 一直加载、白屏、刷新无响应、头像与内容全出不来。十月底时 SDK 是 head 同步脚本但 CDN 恰好可达，故"以前可以"。
  - **移除所有外部 CDN 依赖**：`supabase-js` / `pinyin-pro` / `echarts` 三个 UMD 库自托管到同域 `vendor/`（约 1.5MB，由 SW 缓存），新增 `boot.js` 在首屏之后动态异步注入 analytics 统计脚本（8s 超时、失败静默）。SDK 保持 `defer` 且排在 `supabase-client.js` 之前，保证 `window.supabaseClient` 就绪；`pinyin` / `echarts` 用 `async` 并有 `typeof` 守卫（`dashboard` 加 `whenEchartsReady` 等待）。
  - **初始化不再死等事件**：新增 `window.onReady` / `leleleOnReady`（`readyState !== 'loading'` 立即执行，`defer` 脚本执行时 DOM 已完整）；14 个页面内联初始化、`common.js`、`index.js` 全部改用它。修 `dashboard.html`/`login.html` 的 `supabase-client.js` 原为同步脚本（早于 defer SDK 执行，client 恒为 null）的旧 bug，并给 `dashboard` 首屏裸 client 调用加空值守卫。
  - **Service Worker 真正生效**：按用户要求**给 `sw.js` 加注释改变文件字节**并升 `CACHE_NAME` 到 `v1.3`，触发浏览器重新 `install` 并清理 v1.0–v1.2 旧缓存（此前 `sw.js` 字节未变，浏览器不会重装；且旧策略纯 network-first，缓存只在断网时兜底，平时完全不加速 = "缓存根本没用"）。新策略：静态资源 **stale-while-revalidate**（命中缓存秒开 + 后台更新）、数据 JSON **network-first 带 1.5s 超时**快速回退缓存、外部域直通。移除升版时自动 `location.reload()`，消除反复刷新。
  - **恢复作者数据主源**：`fetchAuthors()` 与 `notice.js` 主源改回十月底以来一直稳定的跨域 `https://authors.surge.sh/authors.json`（已核实 `access-control-allow-origin: *`），带 5s 超时；本地 `authors/index.json` 仅作离线兜底。`author.html` 游戏数在 `data/` 缺文件时回退到页面已加载的游戏列表长度。
  - **验证**：Chrome headless 阻断 `cdn.jsdelivr.net` / `analytics` / `supabase.co` / `surge.sh` / `tally.so` 全部外部域名后，首页仍渲染 26 个游戏卡片、作者页渲染作者卡 + 13 个游戏；index / author / about / game / login 五页 **0 个 JS 运行时错误**；全部 JS 与内联脚本语法检查通过、lint 0 错误。
- **2026-11-05 · 4.0.13（Patch）**：后台游戏数修复 + 作者页首屏提速。
  - **后台「暂无绑定您的游戏 / 未认证」根因**：`dashboard.html` 从未引入 `common.js`，却调用只定义在其中的 `window.fetchAuthors()`；异常被 `:797` 的 `catch` 静默吞掉 → `authorId=null` → `myGames=[]` → 空态；`renderDevId()` 同时误报「未认证」。数据本身完全正常（surge 与本地清单都有 uuid `b646df8a…`、id=1，`lelegame_data.json` 里 12 款游戏）。
  - **作者清单统一到 `boot.js`**：`window.fetchAuthors` 唯一定义处移到 head 同步加载、无 UI 副作用的 `boot.js`（14 页都引），`dashboard` 无需新增任何 script 标签；`common.js` 改为「仅在未定义时赋值」的守卫，保证 `game/` 子页（通过绝对 URL 直连 `common.js`、不加载 `boot.js`）仍可用。**明确不给 dashboard 引整个 `common.js`**：其初始化会注入页脚/公告/主题/灵动岛，与后台独立 UI 冲突。契约不变：surge 权威主源（5s 超时）+ 本地 `authors/index.json` 兜底。
  - 另新增 `fetchAuthorsLocal()` / `fetchAuthorsFresh()` 供 stale-while-revalidate 使用；`dashboard` 加本地清单兜底、`dashFetch()` 统一 8s 超时（`lelegame_data.json` / analytics breakdown / timeseries），失败降级不抛错；空态、侧栏、创作者卡文案区分为「档案读取失败」「未关联档案」「已关联但 0 游戏」三种，不再一律要求重新完成创作者认证。
  - **修掉 4.0.12 引入的无限递归**：批量替换误把 `common.js` / `index.js` 里 `leleleOnReady` 函数体自身也替换成 `leleleOnReady( fn, {once:true})`（递归调用自己）。defer 页面走 `else fn()` 故表面正常，但 `authorlevel.html` / `apply-certification.html` 是**同步**加载 `common.js`，`readyState==='loading'` 时会栈溢出 —— 这正是「有点卡」的来源。已恢复 `document.addEventListener('DOMContentLoaded', fn, { once: true })`。
  - **作者页首屏提速**：`loadAuthorMeta` 改为先用同域 `authors/index.json` 即时渲染名字/等级/徽标，再由 surge 异步校正（两份清单由工作流同步生成，内容一致不跳变）；`authorSupabaseOverride` 保存 Supabase 可编辑资料，校正重建基础数据时重新套用，不会丢失简介/自定义名字；`authorProfileRequestedUuid` 按 uuid 去重，避免两阶段重复查询。
  - `sw.js` 加注释并升 `CACHE_NAME` 到 **v1.4**（仅改注释与版本字符串，静态 SWR + 数据超时回退策略完全不变），清理 v1.3 旧缓存以确保新的 `boot.js` / `common.js` 立即到达；首页新手引导 `boot()` 与 `notice.js` 对齐 `window.onReady`。
  - **验证**（playwright-cli + 系统 Chrome）：模拟登录态打开后台 → `authorLookupState='ok'`、`myGames.length=12`、侧栏「开发者 ID：1」、创作者卡等级 6 与官方徽标、游戏选择网格 12 款；阻断 surge/analytics 后**仍显示 12 款**（本地兜底生效）；`authorlevel.html` / `apply-certification.html` 0 个栈溢出错误；首页 26 卡片、`author.html?id=1` 名字「了了了岭工作室」+ 12 款游戏即时可见；全部 JS 与内联脚本语法通过、lint 0 错误。
- **2026-11-06 · 4.0.14（Patch）**：Tally 表单内嵌根治 + 全站问题清单。
  - **根因**：投稿（`index.js`）/ 推荐（`index.html`）/ 认证申请（`apply-certification.html`）三处 iframe 只写 `data-tally-src`、从不设 `src`，把「有没有内容」押在境外 `tally.so/widgets/embed.js` 能否执行 `Tally.loadEmbeds()` 上。该脚本在国内常**静默挂起**（既不 `onload` 也不 `onerror`），回调永不触发 → 弹窗纯白（用户截图）。首页 `ensureTally` 只覆盖推荐表单，投稿弹窗在 4.0.12 重构后**根本没接入**；全局 `Tally` 就绪状态 + `loadedLang` 缓存造成「刷新后本来能用又不能用」；认证页内联 loader 同样无超时；11 个游戏子页还加载了毫无 iframe 对应的 `embed.js`，白占跨境连接。
  - **`boot.js` 新增 `window.mountTallyIframe(container, url, opts)`**：`https://tally.so/embed/<id>` 本身就是完整可嵌入页面，直接赋 `iframe.src` 即可渲染，`embed.js` 降级为可选增强。打开弹窗才惰性挂载；带可见加载态、8s 超时、`onerror` 降级卡片（中英说明 + 重新加载 + `target="_blank" rel="noopener noreferrer"` 新窗口直链）；另常驻一条不遮挡表单的备用入口，防跨域 iframe 加载错误页误触发 `onload` 再度白屏。用挂载 token 让迟到的回调不能覆盖新一次挂载，消除竞态。
  - 三处调用点统一改直连挂载；认证页补引 `/boot.js`，由两个 `height=1600` 隐藏 iframe 改为按 `langChanged` 只挂当前语言一个；`tally-form-submitted` 提交闭环保留并补 `event.origin === 'https://tally.so'` 白名单。
  - 删除 11 处冗余 `embed.js`、首页 `ensureTally` 轮询与认证页内联 loader → **首屏 0 个 Tally 跨境请求**。表单 ID、查询参数与数据收集方式完全不变。
  - `sw.js` 加注释并升 `CACHE_NAME` 到 **v1.5**（策略三分支不动）清理 v1.4 旧缓存；新增 `plan.md` 按大/中/小/迷你四级登记 170 项全站问题（含 `文件:行号`、影响、建议修法、状态），作为后续修复路线图，本轮只修表单链路相关项。
