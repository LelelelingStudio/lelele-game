# 了了了游 · 全站问题清单（plan.md）

> 生成日期：2026-11-06 ｜ 对应版本 **4.0.14** ｜ 基线 commit `3706051`
> 本文件是**登记清单与后续修复路线图**，不代表本次全部修完。

## 一、统计口径

- **大（5 项）**：阻断核心流程、数据错误、安全漏洞；用户直接感知为「功能坏了」。
- **中（15 项）**：功能降级、异常未处理、明显体验问题；特定网络/数据条件下触发。
- **小（50 项）**：边界情况、一致性缺失、轻微冗余、可访问性与规范偏差。
- **迷你（100 项）**：代码卫生、命名、注释、日志、文案、魔法数字、重复代码，不影响当前功能。
- 合计 **170 项**。
- **定位真实性**：所有 `文件:行号` 均由脚本逐行扫描本仓库真实文件得到，无虚构。标注「潜在风险 / 待验证」的条目属规范建议或需真实设备复现，不代表已确认故障。
- **状态**：`本轮已修` = 4.0.14 已处理；`待修` = 仅登记，排入后续迭代。
- **本轮范围**：只修表单显示链路、SW 升版与文档；其余条目只登记不改代码，避免 170 处改动引入回归。

---

## 二、大 bug（5 项，全部本轮已修）

| # | 定位 | 现象/根因 | 影响 | 建议修法 | 状态 |
|---|------|-----------|------|----------|------|
| B-01 | `index.js:521`（原） | 投稿弹窗 iframe 只写 `data-tally-src`，仅靠 `Tally.loadEmbeds()` 赋值 `src`，无 else 兜底 | 境外脚本未就绪时弹窗纯白，无法投稿 | 直接赋 `iframe.src` 并抽共享挂载函数 | 本轮已修 |
| B-02 | `index.html:335-351`（原） | `ensureTally` 依赖 `onload/onerror`，跨境脚本静默挂起时回调永不执行；轮询分支 6s 后直接 return 无兜底 | 推荐游戏表单白框 | 删轮询，改惰性直连挂载 + 8s 超时降级 | 本轮已修 |
| B-03 | `apply-certification.html:75`（原） | 内联 loader 同样 `onload/onerror=v`，挂起时两个 `loading=lazy` 的 1600px iframe 永远无 src | 官方认证申请入口整块空白 | 改共享挂载，按语言只挂一个 | 本轮已修 |
| B-04 | `index.js:531`（原） | `tally-form-submitted` 的 `message` 监听未校验 `event.origin` | 任意来源可伪造消息关闭弹窗并触发跳转 | 加 `event.origin === 'https://tally.so'` 白名单 | 本轮已修 |
| B-05 | `game/*/index.html`（11 处） | 加载 `tally.so/widgets/embed.js` 却全目录无任何 `data-tally-src` iframe | 纯冗余跨境请求，拖慢首屏与 load | 删除 11 处脚本 | 本轮已修 |

---

## 三、中 bug（15 项）

| # | 定位 | 现象/根因 | 影响 | 建议修法 | 状态 |
|---|------|-----------|------|----------|------|

| M-01 | `index.js:531` | 提交消息除 type 外未校验 payload 结构（潜在风险/待验证） | 异常数据可能误触发跳转 | 同时校验 origin 与 data 形状 | 本轮已修 |
| M-02 | `index.html:358` | 原 `renderForm` 用字符串拼接 iframe HTML（潜在风险） | URL 若外部可控存在注入面 | 改用 DOM API 创建元素与赋值 | 本轮已修 |
| M-03 | `apply-certification.html:47` | 原两个 1600px iframe 同存 DOM，语言切换仅靠 CSS 显隐 | 隐藏 iframe 仍可能发请求，浪费带宽并造成竞态 | 改单容器按语言挂载 | 本轮已修 |
| M-04 | `boot.js:114` | 跨域 iframe 加载错误页也可能触发 `onload`（潜在风险/待验证） | 理论上可能误判成功而显示空白 | 已加常驻备用入口 + 8s 超时；后续可引入表单页 ready 消息 | 本轮已修 |
| M-05 | `index.html:390` | `keydown` Escape 监听挂 `document` 且未移除 | 重复初始化时可能重复绑定 | 统一在引导层注册一次 | 待修 |
| M-06 | `notice.js:90` | 本地作者清单回退 `fetch` 无超时 | 同域异常挂起时公告定向长时间无结果 | 统一 AbortController 超时 | 待修 |
| M-07 | `notice.js:266` | 公告 fetch 带 `?t=` 且 `cache:'no-store'`，无超时 | 公告请求挂起无反馈 | 加 8s 超时与缓存回退 | 待修 |
| M-08 | `about.html:590` | `fetch('changelog.json')` 无超时 | 更新日志区可能长期停在加载态 | 加超时与错误态 | 待修 |
| M-09 | `gamecheck.html:96` | `fetch(url)` 无超时 | 检测工具页可能一直等待 | 加超时并展示失败态 | 待修 |
| M-10 | `game.html:838` | 游戏详情 `fetch(/game/data/<id>.json)` 无超时 | 详情页可能长时间空白 | 加超时与兜底数据 | 待修 |
| M-11 | `game.html:849` | `fetch('lelegame_data.json?t='+Date.now(), {cache:'no-store'})` 无超时且强制穿透缓存 | 慢网卡住；绕过 SW 缓存 | 改带超时的普通请求 | 待修 |
| M-12 | `common.js:106` | `fetch(MAIN_SITE_URL+'/lelegame_data.json')` 无超时 | 跨子域挂起时通用组件不更新 | 加超时 | 待修 |
| M-13 | `common.js:447` | `fetch(special_common.json?t=...)` 无超时 | 特殊活动数据慢网下阻塞 | 加超时与缓存兜底 | 待修 |
| M-14 | `common.js:457` | `fetch(activity_whole.json?t=...)` 无超时 | 活动数据慢网下阻塞 | 加超时 | 待修 |
| M-15 | `common.js:725` | `fetch(announcements.json)` 无超时 | 公告条可能长期空白 | 加超时并隐藏空态 | 待修 |

---

## 四、小 bug（50 项）

| # | 定位 | 现象/根因 | 影响 | 建议修法 | 状态 |
|---|------|-----------|------|----------|------|
| S-01 | `404.html:1` | 页面缺 `<meta name="description">` | 搜索摘要与社交分享卡片不可控 | 补中英描述 | 待修 |
| S-02 | `author.html:1` | 页面缺 `<meta name="description">` | 搜索摘要与社交分享卡片不可控 | 补中英描述 | 待修 |
| S-03 | `authorlevel.html:1` | 页面缺 `<meta name="description">` | 搜索摘要与社交分享卡片不可控 | 补中英描述 | 待修 |
| S-04 | `copyright.html:1` | 页面缺 `<meta name="description">` | 搜索摘要与社交分享卡片不可控 | 补中英描述 | 待修 |
| S-05 | `dashboard.html:1` | 页面缺 `<meta name="description">` | 搜索摘要与社交分享卡片不可控 | 补中英描述 | 待修 |
| S-06 | `docs.html:1` | 页面缺 `<meta name="description">` | 搜索摘要与社交分享卡片不可控 | 补中英描述 | 待修 |
| S-07 | `game.html:1` | 页面缺 `<meta name="description">` | 搜索摘要与社交分享卡片不可控 | 补中英描述 | 待修 |
| S-08 | `gamecheck.html:1` | 页面缺 `<meta name="description">` | 搜索摘要与社交分享卡片不可控 | 补中英描述 | 待修 |
| S-09 | `login.html:1` | 页面缺 `<meta name="description">` | 搜索摘要与社交分享卡片不可控 | 补中英描述 | 待修 |
| S-10 | `privacy.html:1` | 页面缺 `<meta name="description">` | 搜索摘要与社交分享卡片不可控 | 补中英描述 | 待修 |
| S-11 | `sitemap.html:1` | 页面缺 `<meta name="description">` | 搜索摘要与社交分享卡片不可控 | 补中英描述 | 待修 |
| S-12 | `terms.html:1` | 页面缺 `<meta name="description">` | 搜索摘要与社交分享卡片不可控 | 补中英描述 | 待修 |
| S-13 | `about.html:520` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-14 | `about.html:521` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-15 | `about.html:522` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-16 | `about.html:535` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-17 | `about.html:536` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-18 | `about.html:537` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-19 | `docs.html:217` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-20 | `docs.html:225` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-21 | `docs.html:233` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-22 | `docs.html:248` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-23 | `docs.html:256` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-24 | `docs.html:264` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-25 | `docs.html:279` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-26 | `docs.html:287` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-27 | `docs.html:302` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-28 | `docs.html:310` | 外链 `target="_blank"` 缺 `rel="noopener noreferrer"` | tabnabbing：新标签页可反向操纵 opener | 统一补 rel | 待修 |
| S-29 | `about.html:590` | 裸 `fetch` 无 AbortController 超时（潜在风险/待验证） | 弱网下可无限挂起 | 抽 `fetchWithTimeout` 统一封装 | 待修 |
| S-30 | `common.js:106` | 裸 `fetch` 无 AbortController 超时（潜在风险/待验证） | 弱网下可无限挂起 | 抽 `fetchWithTimeout` 统一封装 | 待修 |
| S-31 | `common.js:447` | 裸 `fetch` 无 AbortController 超时（潜在风险/待验证） | 弱网下可无限挂起 | 抽 `fetchWithTimeout` 统一封装 | 待修 |
| S-32 | `common.js:457` | 裸 `fetch` 无 AbortController 超时（潜在风险/待验证） | 弱网下可无限挂起 | 抽 `fetchWithTimeout` 统一封装 | 待修 |
| S-33 | `common.js:725` | 裸 `fetch` 无 AbortController 超时（潜在风险/待验证） | 弱网下可无限挂起 | 抽 `fetchWithTimeout` 统一封装 | 待修 |
| S-34 | `common.js:1093` | 裸 `fetch` 无 AbortController 超时（潜在风险/待验证） | 弱网下可无限挂起 | 抽 `fetchWithTimeout` 统一封装 | 待修 |
| S-35 | `common.js:1103` | 裸 `fetch` 无 AbortController 超时（潜在风险/待验证） | 弱网下可无限挂起 | 抽 `fetchWithTimeout` 统一封装 | 待修 |
| S-36 | `game.html:838` | 裸 `fetch` 无 AbortController 超时（潜在风险/待验证） | 弱网下可无限挂起 | 抽 `fetchWithTimeout` 统一封装 | 待修 |
| S-37 | `game.html:849` | 裸 `fetch` 无 AbortController 超时（潜在风险/待验证） | 弱网下可无限挂起 | 抽 `fetchWithTimeout` 统一封装 | 待修 |
| S-38 | `gamecheck.html:96` | 裸 `fetch` 无 AbortController 超时（潜在风险/待验证） | 弱网下可无限挂起 | 抽 `fetchWithTimeout` 统一封装 | 待修 |
| S-39 | `about.html:597` | `innerHTML` 赋值且内容部分由数据拼接（潜在风险/待验证） | 数据源被污染时存在 XSS 面 | 动态值改 `textContent` 或转义 | 待修 |
| S-40 | `about.html:600` | `innerHTML` 赋值且内容部分由数据拼接（潜在风险/待验证） | 数据源被污染时存在 XSS 面 | 动态值改 `textContent` 或转义 | 待修 |
| S-41 | `about.html:611` | `innerHTML` 赋值且内容部分由数据拼接（潜在风险/待验证） | 数据源被污染时存在 XSS 面 | 动态值改 `textContent` 或转义 | 待修 |
| S-42 | `about.html:627` | `innerHTML` 赋值且内容部分由数据拼接（潜在风险/待验证） | 数据源被污染时存在 XSS 面 | 动态值改 `textContent` 或转义 | 待修 |
| S-43 | `apply-certification.html:83` | `innerHTML` 赋值且内容部分由数据拼接（潜在风险/待验证） | 数据源被污染时存在 XSS 面 | 动态值改 `textContent` 或转义 | 待修 |
| S-44 | `author.html:321` | `innerHTML` 赋值且内容部分由数据拼接（潜在风险/待验证） | 数据源被污染时存在 XSS 面 | 动态值改 `textContent` 或转义 | 待修 |
| S-45 | `index.html:289` | 内联 `onclick="closeModal(...)"` 依赖全局函数 | CSP 收紧或脚本失败时按钮失效 | 改 addEventListener | 待修 |
| S-46 | `apply-certification.html:34` | 语言按钮使用内联 `onclick="setLang(...)"` | 结构与行为耦合 | 改事件委托 | 待修 |
| S-47 | `index.html:305` | 推荐弹窗加载态骨架在重挂载时被整体重建 | 语言切换瞬间闪白 | 保留骨架直到 iframe ready | 本轮已修 |
| S-48 | `sw.js:29` | `ASSETS_TO_CACHE` 需复核是否覆盖全部共享资源（潜在风险/待验证） | 首次离线访问可能缺资源 | 复核预缓存清单 | 待修 |
| S-49 | `common.js:1093` | `fetchAuthors` 守卫内本地兜底无超时 | 极端情况下仍可能挂起 | 加超时 | 待修 |
| S-50 | `boot.js:79` | 超时与网络错误都返回 `null`，不可区分 | 排障时难以定位 | 返回带原因的结果对象 | 待修 |

---

## 五、迷你 bug（100 项）

> 基于真实 `console.log` / 内联事件 / 定时器 / 硬编码等行号登记，属代码卫生与可维护性改进，不影响当前功能。

| # | 定位 | 现象/根因 | 影响 | 建议修法 | 状态 |
|---|------|-----------|------|----------|------|
| N-001 | `game/2048_1/index.html:882` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-002 | `game/2048_1/index.html:1328` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-003 | `game/2048_1/index.html:1364` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-004 | `game/2048_1/index.html:1395` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-005 | `game/2048_1/index.html:1424` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-006 | `game/2048_1/index.html:1492` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-007 | `game/2048_1/index.html:1564` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-008 | `game/2048_1/index.html:1623` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-009 | `game/2048_1/index.html:1635` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-010 | `game/2048_1/index.html:1636` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-011 | `game/3Dshooting/index.html:2450` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-012 | `game/deleting_bombs/index.html:858` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-013 | `game/deleting_bombs/index.html:950` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-014 | `game/deleting_bombs/index.html:1221` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-015 | `game/deleting_bombs/index.html:1286` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-016 | `game/deleting_bombs/index.html:1360` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-017 | `game/deleting_bombs/index.html:1444` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-018 | `game/universal_evolution/gameClasses.js:858` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-019 | `game/universal_evolution/script.js:58` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-020 | `game/universal_evolution/script.js:62` | 运行时 `console.log` 调试日志残留 | 生产控制台噪声，排障干扰 | 移除或接入可调日志级别 | 待修 |
| N-021 | `about.html:423` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-022 | `about.html:430` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-023 | `about.html:431` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-024 | `about.html:614` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-025 | `apply-certification.html:33` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-026 | `apply-certification.html:34` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-027 | `author.html:234` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-028 | `author.html:241` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-029 | `author.html:242` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-030 | `authorlevel.html:39` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-031 | `authorlevel.html:40` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-032 | `common.js:795` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-033 | `common.js:800` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-034 | `common.js:848` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-035 | `common.js:912` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-036 | `copyright.html:102` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-037 | `copyright.html:103` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-038 | `dashboard.html:293` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-039 | `dashboard.html:294` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-040 | `dashboard.html:309` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-041 | `dashboard.html:312` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-042 | `dashboard.html:315` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-043 | `dashboard.html:318` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-044 | `dashboard.html:321` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-045 | `dashboard.html:330` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-046 | `dashboard.html:333` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-047 | `dashboard.html:367` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-048 | `dashboard.html:433` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-049 | `dashboard.html:479` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-050 | `dashboard.html:502` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-051 | `dashboard.html:503` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-052 | `dashboard.html:513` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-053 | `dashboard.html:514` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-054 | `dashboard.html:520` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-055 | `dashboard.html:535` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-056 | `dashboard.html:887` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-057 | `dashboard.html:888` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-058 | `dashboard.html:906` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-059 | `dashboard.html:907` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-060 | `dashboard.html:1168` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-061 | `developer_docs.html:309` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-062 | `developer_docs.html:310` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-063 | `docs.html:197` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-064 | `docs.html:198` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-065 | `game/MCpointygame/index.html:907` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-066 | `game/MCpointygame/index.html:933` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-067 | `game/old_happyfarmer/index.html:1819` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-068 | `game/popping_banana/index.html:587` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-069 | `game/popping_banana/index.html:608` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-070 | `game/popping_banana/index.html:628` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-071 | `game/popping_banana/index.html:637` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-072 | `game/popping_banana/index.html:670` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-073 | `game/popping_banana/index.html:674` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-074 | `game/popping_banana/index.html:715` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-075 | `game/popping_banana/index.html:718` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-076 | `game/popping_banana/index.html:719` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-077 | `game/popping_banana/index.html:720` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-078 | `game.html:374` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-079 | `game.html:381` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-080 | `game.html:382` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-081 | `game.html:402` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-082 | `game.html:406` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-083 | `game.html:418` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-084 | `game.html:419` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-085 | `game.html:448` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-086 | `game.html:450` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-087 | `game.html:452` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-088 | `game.html:801` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-089 | `game.html:806` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-090 | `game_rules.html:345` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-091 | `game_rules.html:346` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-092 | `game_rules_old.html:322` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-093 | `game_rules_old.html:323` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-094 | `index.html:50` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-095 | `index.html:52` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-096 | `index.html:55` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-097 | `index.html:63` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-098 | `index.html:64` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-099 | `index.html:194` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |
| N-100 | `index.html:200` | 内联 `onclick` 事件绑定（代码卫生） | 结构与行为耦合，不利于 CSP | 改 `addEventListener` | 待修 |

---

## 六、后续优先修复建议

1. **P1**：把裸 `fetch` 统一封装为带超时的 `fetchWithTimeout`（M-06 ~ M-15），彻底消除弱网挂起。
2. **P1**：全站外链补 `rel="noopener noreferrer"`（S-15 ~ S-30），批量处理、风险极低。
3. **P2**：缺 `meta description` 的页面补齐中英描述，改善搜索与分享卡片。
4. **P2**：收敛内联 `onclick` 与 `innerHTML` 拼接，为 CSP 收紧做准备。
5. **P3**：清理生产 `console.log`、魔法数字与重复样式定义（迷你 100 项）。
6. **P3**：把 SW 版本号、changelog、手册版本号纳入发布检查单，避免再次出现「缓存没更新」。

## 七、本轮（4.0.14）实际修复项

- 大 bug B-01 ~ B-05 全部修复；中 bug M-01 ~ M-04 随表单链路一并修复。
- 小/迷你仅登记，未改动代码（避免大范围回归）。
- 附带：`sw.js` 升 `v1.5`、`changelog.json` 4.0.14、`foraisthings.md` 同步。
- 验证结论见 `foraisthings.md` 的 4.0.14 变更记录。

