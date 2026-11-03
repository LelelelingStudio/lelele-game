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
├── lelegame_data.json / announcements.json / activity_whole.json / special_common.json / changelog.json / manifest-zh.json / manifest-en.json  # 数据/配置
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

## 4. 顶部导航 + 灵动岛（4.0.0 新增）

> 详见 `common.css`（`.top-bar`、`.island-mode`、`.di-keep`/`.di-icon`/`.di-hide`）与 `common.js`（`updateIsland` 滚动监听）。

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

> 当前版本：**3.3.0**（起点）。4.0.0 是本次「超级 UI 大重构（苹果风 + 灵动岛）」的 A 升级，已获用户授权。

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

### 10.1 设置面板（⚙️，灵动岛按钮）
- 入口：`#openSettingsBtn`（灵动岛 `.di-icon`）。模块在 `common.js` 的 `CustomUI` 区（`buildSettingsPanel` / `openSettings` / `closeSettings` / `initSettings`）。
- 功能：主题色 6 预设（`--accent` 实时切换 + `localStorage.lelele_accent`）；字号 ±（根 `font-size` 缩放 0.85–1.3×、`localStorage.lelele_font_scale`）；自定义背景入口；排版模式入口。
- UI：右侧滑出毛玻璃面板（`#leleleSettings`），样式 `.lelele-settings-panel/.card/...` 均在 `common.css`。

### 10.2 自定义背景
- `processCustomBg(file)`（`common.js`）：FileReader → Image → canvas 采样 64×64 计算「信息量」（`analyzeImage`：亮度方差 + 边缘密度），信息量大则遮罩淡化多（dim 0.22–0.72），小则淡化少；边框检测（环形 vs 内部方差）决定要不要补 1px 描边。
- 应用：`#customBgLayer` 固定层 `z-index:-2`（夹在 body 背景与内容之间，**不遮挡**雪花 canvas `z-index:9990` 与贴纸），叠加明暗渐变遮罩。
- 持久化：`localStorage.lelele_custom_bg`（含 dataUrl/hasBorder/dim/setAt）。**每 14 天强制重新上传**，过期自动清除并 toast「已恢复默认背景」。

### 10.3 自定义排版
- 入口：`#openLayoutBtn`（灵动岛 `.di-icon`），或由设置面板「进入排版模式」。
- `toggleLayout()`：给 `#topRightActions > *` 加 `.layout-draggable`，pointer 拖拽上下微调（±18px），位置存 `localStorage.lelele_layout_positions`（键 `layoutKey` = id 或首个 `btn-` class）。再点按钮或 Esc 退出并 `exitLayout()` 保存。

### 10.4 OTF 展示字体
- `fonts/LelelelingFont1.otf` 进仓库，`common.css` `@font-face` 注册 `'Leleleling Display'`，套 `h1/h2/h3/.game-title`（中文自动回退系统字体，正文不动）。令牌 `--font-display`。

### 10.5 搜索增强
- `search.js`：相关度排序（精确>前缀>包含>拼音>连续子序列兜底）、字段权重（标题 1.0 / 分类 0.75 / 作者 0.6）、去重、按范围筛选（`scope`：`all`/`game`/`author`）。
- `index.js`：`renderGames` 支持搜索范围切换条（全部/游戏/作者 `#searchScopeBar`）、结果展示作者（`game.author` 行）、**首页 25 条分页**（`pageSize=25`，`#searchPagination` 上一页/页码/下一页，>25 才出现）。
- 收紧旧版「单字符/乱序显示一大堆」的宽松子序列兜底（现要求查询 ≥2 且完整顺序命中才计分）。

### 10.6 国内性能 / 可达性
- 自托管 `vendor/supabase.js`（从 jsdelivr UMD 下载，218KB），5 个页面改为同域引用；client 为 defer 的页 UMD 也 defer，同步页保持同步。`dashboard.html` 的 echarts 加 `defer`。
- 全站无 Google Fonts / font-awesome 外部依赖。

### 10.7 SEO / UX 修复
- 7 个主页面（`index/about/docs/game/author/dashboard/login`）统一补：`favicon.ico`+`icon-192.png`+`apple-touch-icon`、扩展 `title`（告别 4 字标题）、扩展 `description`、`<link rel="canonical">`、Open Graph（`og:*`）+ Twitter Card（`summary_large_image`）。
- 注入方式：清除旧 description/icon 行 → 在 title 位置插入完整 meta 块（可复用脚本思路）。

### 变更记录补充
- **2026-11-03 · 4.0.0 增强**（见第 10 节）：设置面板（⚙️）/ 自定义背景 / 自定义排版 / OTF 字体 / 搜索增强（游戏·作者·全部范围 + 结果显作者 + 25 条分页）/ 国内性能（vendor/supabase-js 同域 + defer）/ SEO（7 页 favicon+OG+Twitter+canonical+扩展 title/description）。
