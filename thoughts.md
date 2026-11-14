# thoughts.md · 了了了游升级点子库

> **这是什么**：一份**待办点子清单**，记录「还可以做什么」——包含新功能、体验优化、架构改进、性能提升与 bug 修复，共 **185 条**。
> **这不是什么**：`plan.md` 是 4.0.14 审计产生的 170 项**已修问题清单**，属历史档案；`historymd/` 是**已完成的里程碑记录**。本文只写**还没做**的事，不要混为一谈。
> **版本基准**：2026-11-12 · 站点 `4.1.0` / 规则 `5.0.0` / SW `lelele-pwa-v1.11` · 30 款游戏 / 9 位作者。
> **怎么用**：挑一条做之前先读 `foraisthings.md` 对应章节确认现状（本文的定位字段可能随改动漂移）；做完把该条删掉或标注完成，并按手册 0.3 节判断是否要在 `historymd/` 写一篇。括号里的「定位」是起点，不是完整改动范围。

## 分级定义

| 级别 | 数量 | 判定标准 | 授权 |
| --- | --- | --- | --- |
| 🔴 大升级 | 10 | 架构级 / 跨多模块 / 改变数据或发布方式，工作量以天计，影响全站 | 按手册 9.1，**A 版本级须先征得 David 同意** |
| 🟠 中等升级 | 25 | 一个完整功能或单模块重构，通常跨 1–3 个文件，工作量以小时计 | 可自行决定，建议先说一声 |
| 🟡 小升级 | 50 | 局部体验增强、单点功能补齐、明确的 bug 修复，1–2 个文件 | 直接做 |
| 🟢 迷你升级 | 100 | 一行到几行的参数、文案、样式、校验补强与一致性清理 | 直接做，适合顺手带上 |

---

## 批准状态（2026-11-12 · David 确认）

| 级别 | 总数 | ✅ 已批准 | ⏸ 未选 |
| --- | --- | --- | --- |
| 🔴 大升级 | 10 | **6** — #1、#4、#5、#7、#9、#10 | #2、#3、#6、#8 |
| 🟠 中等升级 | 25 | **25**（全部同意） | — |
| 🟡 小升级 | 50 | **50**（全部同意） | — |
| 🟢 迷你升级 | 100 | **100**（全部同意） | — |
| **合计** | **185** | **181** | **4** |

**🔴 大升级逐项状态**：

| 项 | 状态 | 升级 |
| --- | --- | --- |
| **#1** | ✅ 已批准 | 静态站 CI 质量门禁 |
| **#2** | ⏸ 未选 | 数据层单一化 |
| **#3** | ⏸ 未选 | 作者数据源迁到 Supabase |
| **#4** | ✅ 已批准 | 全站 i18n 抽取 |
| **#5** | ✅ 已批准 | 本站游戏离线可玩 |
| **#6** | ⏸ 未选 | 图片管线自动化 |
| **#7** | ✅ 已批准 | 组件化设计系统 |
| **#8** | ⏸ 未选 | 投稿审核工作流 |
| **#9** | ✅ 已批准 | 统一可观测性 |
| **#10** | ✅ 已批准 | 安全基线加固 |

- **「同意」= 授权开工，不是排期**：本节只记录哪些可以做；开工顺序、一次做几条、是否单独发版，仍按当次任务决定。
- 🔴 被选中的 6 项已完成手册 9.1「A 版本级须先征得 David 同意」这一步，**不需要再逐项请示**；但每项开工前仍走手册 7.8 发版检查单，并在 `historymd/` 留一篇里程碑记录。
- **未选的 4 项不要擅自做**：#2、#3、#6、#8。其中 **#8 投稿审核工作流**——David 已另行要求做一个**收窄范围**的内部 admin 控制台（仅站长本地使用、绕过 Tally、不做作者写回），本期按此内部工具落地，不等同于原 #8 的「Tally→自动草稿 PR 全自动」方案；原 #8 完整方案仍属未选。
- 二 / 三 / 四节共 **175 项全部批准**，可直接挑选执行；🟠 中等升级按分级定义仍建议「开工前说一声」。

---

## 一、🔴 大升级（10 项）

| # | 升级 | 说明与定位 |
| --- | --- | --- |
| 1 | 静态站 CI 质量门禁 | 在 `.github/workflows/` 新增校验流水线：JSON Schema 校验、站内链接存在性、`node --check` 全量 JS 与内联脚本、CSS 花括号平衡、SW 预缓存清单对齐，PR 失败即阻断。把目前每次靠临时 Python 脚本做的事固化下来。定位：`foraisthings.md` 7.8 发版检查单 |
| 2 | 数据层单一化 | 消除 `lelegame_data.json` 与 `game/data/<id>.json` 的**双份存储**（`url`、`name_*`、`category_*` 重复），改为一份 `catalog.json` 在构建期生成详情文件，从根上杜绝「改了主列表忘改详情」(`7.2` 踩过)。定位：`lelegame_data.json` / `game/data/` / `index.js` / `game.html` |
| 3 | ~~作者数据源单一化~~ ✅ **已完成（2026-11-14，改走本仓库方案）** | 未采用「迁到 Supabase」，而是**把权威源直接迁回本仓库 `/authors/index.json`**：`authors.surge.sh` 退役、删除 `sync-authors.yml`，`boot.js` / `common.js` / `notice.js` 改为只读同源清单；admin 控制台新增「添加作者 / 修改作者信息」两动作，`admin-apply.mjs` 校验写入并重算 `games_count`。同样消除了「改本地会被覆盖」的坑，且无需任何服务端/API。定位：`authors/index.json` / `github/admin.html` / `.github/scripts/admin-apply.mjs` / `boot.js` |
| 4 | 全站 i18n 抽取 | 建立 `i18n/zh.json` / `i18n/en.json`，把散落在 25 个页面里的 `.zh-inline` / `.en-inline`、JS 里 `isEn()` 三元表达式收敛到统一词条，顺便支持第三种语言与缺失 key 告警。定位：`common.js` / 各页内联脚本 |
| 5 | 本站游戏离线可玩 | 把 `game/` 下 12 款 local 游戏的代码与资源纳入 SW 预缓存 + 离线入口页，让 PWA 从「能装」变成「断网也能玩」，并处理游戏页对 `common.js` 的跨域依赖。定位：`sw.js` / `game/*/index.html` / `index.html` |
| 6 | 图片管线自动化 | 写批量转码脚本（旧图 → LSFP，自动备份原图并生成复合后缀）+ CI 上传 Surge，替代纯手工部署；同时解决「纯 `.lsfp` 命名无回退图」与 256 色量化失真的人工挑选问题。定位：`lsfp.js` / `lsfp-adapter.js` / `game/data/*.json` |
| 7 | 组件化设计系统 | 把各页内联 `<style>` 里的重复组件（modal、pill 按钮、卡片、气泡、表单）收敛到 `common.css` 的 tokens / components 层，消除「媒体查询写在基础规则前被覆盖」这类级联顺序坑。定位：`common.css` / `effects.css` / 各页 `<style>` |
| 8 | 投稿审核工作流 | Tally 提交 → 自动生成草稿 PR（含 `lelegame_data.json` 追加、`game/data/<id>.json`、定向告示）→ 人工核对 → 合并，替代现在每次手工写 3 个 JSON + 发站内告示。定位：`dashboard.html` / `GAME_ENTRY_TEMPLATE.md` / `foraisthings.md` 7.1 |
| 9 | 统一可观测性 | 现在 analytics 只有 `play-game_*` 计数；补前端错误上报、SW 更新失败率、LSFP 解码成功率、表单漏斗与一个总览看板，让「线上有没有坏」可回答。定位：`leleleTrack` (`common.js`) / `gamecheck.html` / `dashboard.html` |
| 10 | 安全基线加固 | 严格 CSP（配合 `leleleLiftInlineClicks` 消除内联 onclick）、第三方脚本 SRI、全站 `innerHTML` 注入点审计、`safeLegalUrl` 与公告消毒白名单的模糊测试、依赖许可证清单。定位：`boot.js` / `common.js` / `legal_templates.html` / `vendor/` |

---

## 二、🟠 中等升级（25 项）

1. **循环导航复用扩展** — 把 `LelelePager` 用到规则历史快照页、更新日志、公告详情等有顺序的页面，只需传 `ids` / `urlFor`。定位：`pager-nav.js`
2. **sitemap 自动生成** — `sitemap.xml` + `sitemap.html` 现在只收录到 `id=22`（23–30 缺），改成发版时由主列表自动生成并同步计数。定位：`sitemap.xml` / `sitemap.html`
3. **修作者等级页语言切换** — `authorlevel.html?level=4&lang=en` 实测仍显示中文，补齐英文等级条件与徽章文案。定位：`authorlevel.html`
4. **清理死链 manifest** — `game/3Dshooting/index.html` 引用了仓库不存在的 `manifest-ja.json` / `manifest-fr.json`，补文件或删引用。定位：`game/3Dshooting/`
5. **游戏链接健康探测** — 定期 HEAD 检查 30 个 `url`，在详情页与后台标记失效链接，避免玩家点了才知道打不开。定位：`lelegame_data.json` / `dashboard.html`
6. **收藏夹云端同步** — 用 Supabase `profiles` 存收藏 id 列表，跨设备一致，未登录时仍回退 localStorage。定位：`common.js` `getFavorites` / `index.js`
7. **搜索结果二次排序** — 在现有评分基础上叠加游玩热度 / 更新时间，避免旧游戏长期霸榜。定位：`search.js` / `index.js`
8. **排行榜失败可重试** — 现在失败只显示「暂无数据 / No data yet」，补错误原因与重试按钮。定位：`rank-loader.js`
9. **LSFP 解码失败可见反馈** — 目前所有失败静默回退旧图；对「无旧图可退」的情形给出图片占位与说明，而不是一片空白。定位：`lsfp-adapter.js`
10. **公告富文本支持图片** — 在 `sanitizeAnnouncementHtml` 白名单里增加 `IMG` 并复用现有 `src` 协议校验，用于活动横幅。定位：`common.js` / `announcements.json`
11. **告示已读云端化** — `oncePerUser` 现在只靠 localStorage，换浏览器会重复弹；登录用户可把已读 id 写进 `profiles`。定位：`notice.js`
12. **认证申请状态跟踪** — 后台可见「已提交 / 审核中 / 已通过 / 需补充」，减少来回邮件询问。定位：`apply-certification.html` / `dashboard.html`
13. **深色模式跟随系统** — 支持 `prefers-color-scheme` 作为初始值，同时保留手动覆盖并记住选择。定位：`common.js` / `common.css`
14. **冬季主题后台可配置** — 现在靠手改 `activity_whole.json` 的日期与资源路径，做成可视化开关与日期选择。定位：`activity_whole.json` / `dashboard.html`
15. **统一 Modal 管理器** — 协议、公告、开发者告示、投稿、推荐、灯箱各写一套开关逻辑，抽成统一栈（Esc、遮罩、焦点陷阱、滚动锁）。定位：`common.js` / 各页
16. **灯箱手势与键盘** — 补触摸左右滑动、←/→ 切换、Esc 关闭与焦点归还。定位：`game.html` lightbox
17. **相似游戏推荐** — 详情页底部按同分类 / 同作者推荐 3–4 款，提升连续浏览。定位：`game.html`
18. **作者页作品筛选** — 名下 12 款时按分类 / 收录年份筛选与排序。定位：`author.html` `loadGames`
19. **SW 缓存容量治理** — 50 项预缓存目前无淘汰与容量上限，补 `Cache Storage` 估算与超限清理。定位：`sw.js`
20. **`recaptcha.js` 单元测试** — 覆盖 ticket 流程、3 次熔断、fail-open、`/config` 返回 `required=false`、8s 超时，防「Promise 不 settle 导致登录卡死」复发。定位：`recaptcha.js`
21. **表单草稿保存** — 投稿 / 更新游戏 / 认证申请的输入在刷新后不丢（localStorage 自动存、提交后清）。定位：`index.js` / `dashboard.html`
22. **多语言 URL 规范化** — 统一 `?lang=en` 或 `/en/` 路径之一，补 canonical 与 `hreflang`，解决 SEO 与分享链接语言漂移。定位：所有页面 `<head>`
23. **404 智能推荐** — 按错误路径模糊匹配游戏 / 作者名，给出「你是不是想找…」而不是只给首页按钮。定位：`404.html`
24. **截图与视频统一画廊** — `screenshots[]` 与 `videos[]` 现在分开渲染，合并成可切换的媒体画廊。定位：`game.html` / `GAME_ENTRY_TEMPLATE.md`
25. **全站无障碍审计** — 逐页检查 aria-label、焦点顺序、对比度、键盘可达与 `prefers-reduced-motion`，出一份可勾选清单。定位：全部 HTML

---

## 三、🟡 小升级（50 项）

1. **协议侧栏加 aria** — 三枚 `data-legal` 圆钮目前只有视觉气泡，补中英 `aria-label`。定位：`game.html`
2. **导航 tooltip 显示 id** — 悬停提示加上目标 id，方便开发者核对。定位：`pager-nav.js`
3. **导航显示进度** — tooltip 补「N / 总数」，让首尾闭环更可感知。定位：`pager-nav.js`
4. **http 链接警告** — 主站是 https，`url` 为 http 时给出可见提示（混合内容风险）。定位：`game.html` `playGame`
5. **空链接按钮置灰** — 现在点「开始游戏」才 alert，改为直接禁用 + 说明文字。定位：`game.html`
6. **收藏乐观更新** — 点击立即变心形，请求失败再回滚并提示。定位：`index.js`
7. **「新收录」角标** — 按首发 `updateLog` 日期 14 天内在首页卡片打标。定位：`index.js`
8. **筛选状态入 URL** — 分类 / 搜索词写进 query，可分享且浏览器后退可恢复。定位：`index.js`
9. **搜索框 Esc 清空** — 基础键盘体验。定位：`index.js` / `search.js`
10. **无结果兜底** — 搜索无命中时给推荐游戏而非空白网格。定位：`index.js`
11. **排行榜 Top3 加图标** — 现在只有名字与奖牌，补 `icon` emoji。定位：`rank-loader.js`
12. **排行榜时间范围切换** — 7 天 / 30 天 / 全部。定位：`rank-loader.js` / `gamecheck.html`
13. **公告「全部标记已读」** — 多条未读弹窗逐个关太慢。定位：`common.js`
14. **过期公告归档提示** — 后台提示哪些公告已过期，避免 `announcements.json` 越堆越大。定位：`announcements.json` / `dashboard.html`
15. **告示队列进度条** — 现有「1/3」文本升级为可视化进度。定位：`notice.js`
16. **告示有限 Markdown** — `notice.js` 用 `esc()` 纯文本渲染，曾出现字面 `**`；支持有限的加粗 / 换行语法并继续消毒。定位：`notice.js`
17. **更新日志折叠** — 长 `updateLog` 默认只显示最近 2 条。定位：`game.html`
18. **简介展开全文** — 长 `description_zh/en` 补「展开 / 收起」。定位：`game.html`
19. **作者名可点** — 详情页作者栏做成 `author.html?id=` 链接。定位：`game.html`
20. **游戏来源标签** — 详情页显示「本站游戏 / 外网游戏」，与 `type` 对应。定位：`game.html`
21. **等级进度提示** — 作者页显示「距下一等级还差 N 款」。定位：`author.html` / `AUTHOR_CERTIFICATION.md`
22. **徽章 tooltip** — 【官方】、★ 原创团队、Lv 徽章加含义解释。定位：`common.js` `leleleAuthorBadges`
23. **导出文件名自定义** — `legal_templates.html` 的五种导出用游戏名命名。定位：`legal_templates.html`
24. **占位符高亮** — 模板预览里高亮 `【在此填写…】` 未替换项。定位：`legal_templates.html`
25. **PDF 导出页眉页脚** — 打印样式补游戏名、生效日期与页码。定位：`legal_templates.html` `@media print`
26. **规则版本 diff** — 历史快照与当前版之间高亮改动段落。定位：`game_rules*.html`
27. **快照页「返回当前版」浮标** — 避免读者停留在旧规则。定位：`game_rules4-0-*.html`
28. **404 页站内搜索** — 复用 `search.js` 在错误页直接找游戏。定位：`404.html`
29. **站点地图分类折叠** — `sitemap.html` 条目多了以后按分组收起。定位：`sitemap.html`
30. **changelog 版本锚点** — 每个版本号可复制深链。定位：`about.html` / `changelog.json`
31. **关于页致谢区** — 列出投稿作者与上游开源项目（LSFP、pinyin-pro 等）。定位：`about.html`
32. **PWA 安装「稍后提醒」** — 现在只有装 / 关，补 7 天后再提示。定位：`common.js`
33. **SW 新版本提示** — `waiting` 状态时提示「有新版本，点击刷新」。定位：`common.js` / `sw.js`
34. **主题切换防闪白** — 切换深色模式时临时关闭过渡。定位：`common.js`
35. **灵动岛 aria-expanded** — 收起 / 展开状态同步给读屏器。定位：`common.js` / `index.html`
36. **雪花跟随 reduced-motion** — 系统开启减少动态效果时自动关雪。定位：`common.js` / `effects.css`
37. **冬季贴纸可关闭** — 现在窄屏直接 `display:none`，改成用户可手动关并记住。定位：`common.css` `.activity-sticker`
38. **骨架屏淡出** — LSFP 解码完成后的图片淡入，避免突兀跳变。定位：`lsfp-adapter.js` / `common.css`
39. **LSFP 优先级队列** — 首屏横幅优先于下方截图解码。定位：`lsfp-adapter.js`
40. **LSFP 耗时埋点** — 记录 decode 平均耗时与失败率，为管线优化提供依据。定位：`lsfp-adapter.js` / `leleleTrack`
41. **fetch 超时可配置** — `leleleFetch` 的 8s 硬编码改成可覆盖参数。定位：`boot.js`
42. **统一离线提示条** — 网络不可用时给一条全站提示，而不是各处静默失败。定位：`boot.js` / `common.css`
43. **公告消毒单测** — 把 `sanitizeAnnouncementHtml` 的白名单与协议校验固化为用例。定位：`common.js`
44. **告示按等级定向** — `author` 现在支持 `'all'` / 单个 id / id 数组，补 `authorlevel>=N` / `official` 群体表达式。定位：`notice.js`
45. **首页无限滚动** — 30 款已接近 `pageSize=25` 边界，改无限滚动 + 回到顶部。定位：`index.js`
46. **随机游玩排除已玩** — 按 `play-game_*` 事件或 localStorage 过滤。定位：`index.js`
47. **后台「我的游戏」表格** — 作者登录后列出名下作品与快速「更新游戏」入口。定位：`dashboard.html`
48. **头像上传裁剪** — 补尺寸 / 大小限制与裁剪预览。定位：`dashboard.html`
49. **密码强度提示** — 注册页实时提示，减少弱密码与验证失败。定位：`login.html`
50. **表单失败邮件兜底** — Tally 加载失败时给出官方邮箱备选，而不是只有「新窗口打开」。定位：`boot.js` `mountTallyIframe` 回退 UI

---

## 四、🟢 迷你升级（100 项）

1. `robots.txt` 补 `Sitemap:` 绝对地址（`sitemap.xml`）
2. `CNAME` 补规范换行与注释说明（`CNAME`）
3. 非首屏 `<img>` 全部补 `loading="lazy"`（各页 HTML）
4. 所有 `<img>` 补有意义的 `alt`（各页 HTML）
5. 所有 `target="_blank"` 补 `rel="noopener noreferrer"`（各页 HTML）
6. `favicon.ico` 补 16/32 多尺寸（`favicon.ico`）
7. `manifest-*.json` 补 `categories` 与 `screenshots`（`manifest-zh/en.json`）
8. `manifest-*.json` 补 `lang` / `dir` 字段（`manifest-zh/en.json`）
9. `<meta name="theme-color">` 跟随深色模式切换（各页 `<head>`）
10. 协议侧栏 emoji 换内联 SVG，消除平台字形差异（`game.html`）
11. 交互控件统一 `min-height:44px` 触控目标（`common.css`）
12. `:focus-visible` 统一 2px `var(--primary)` 描边（`common.css`）
13. 圆角统一为 `--radius` 令牌，清理散落的数值（`common.css`）
14. 阴影统一为 `--shadow-card` 令牌（`common.css`）
15. 过渡时长统一为 `--motion-fast` / `--motion-slow` 令牌（`common.css`）
16. 删除已弃用的 `.di-keep` / `.di-icon` / `.di-hide` 残留（`common.css`）
17. 合并重复的 `@media (max-width:768px)` 块，降低级联踩坑概率（`common.css`）
18. 清理装饰性写死 hex，全部改走 `:root` 变量（`common.css`）
19. 雪花元素限制数量并加 `will-change` 上限（`effects.css`）
20. 给 `404.html` 的 `<base href="/">` 加注释说明子目录 404 的由来（`404.html`）
21. 错误码渐变加 `@supports` 兜底，防 `-webkit-text-fill-color` 隐身（`404.html`）
22. 把长 URL 的 `word-break` 规则从内联提取到 CSS（`sitemap.html`）
23. 移除 `game/data/25.json` 里遗留的投稿 `email`（`game/data/25.json`）
24. 全库扫描并清除其它私人联系方式（`*.json` / `game/data/*.json`）
25. `GAME_ENTRY_TEMPLATE.md` 示例 id 从 23 更新到 31（`GAME_ENTRY_TEMPLATE.md`）
26. 删除模板里「主列表须带 `version`」这条与实际数据结构不符的规范（`GAME_ENTRY_TEMPLATE.md`）
27. 发版时同步 `foraisthings.md` 顶部的版本基准日期（`foraisthings.md`）
28. `plan.md` 首行标注「历史档案，非待办清单」（`plan.md`）
29. `README.md` 补本地运行命令 `python3 -m http.server 8899`（`README.md`）
30. `README.md` 补 `thoughts.md` / `historymd/` / `foraisthings.md` 的互相指引（`README.md`）
31. 对齐 `AUTHOR_CERTIFICATION.md` 与 `common.js` 里 Lv4 / Lv5 的条件文案（`AUTHOR_CERTIFICATION.md`）
32. `LSFP-NOTICE.txt` 补上游 commit hash 与获取日期（`LSFP-NOTICE.txt`）
33. `sw.js` 头部沿革注释补 v1.11 之后的版本（`sw.js`）
34. 加一个 `ASSETS_TO_CACHE` 去重检查脚本，避免清单重复（`sw.js` / CI）
35. SW Offline 页面补中英双语文案（`sw.js`）
36. `networkFirstWithTimeout` 的 1.5s 提取为具名常量（`sw.js`）
37. 给 `cacheKeyFor` 补 `?t=` 归一化的单测（`sw.js`）
38. `AUTHORS_URL` 提取为常量，避免多个文件硬编码 surge 域名（`boot.js` / `notice.js` / `author.html`）
39. `loadScript` 失败日志带完整 src，便于定位（`boot.js`）
40. `leleleLiftInlineClicks` 加单次处理节点上限，防超大 DOM 卡顿（`boot.js`）
41. 10 个 Tally formId 集中到一处常量表（`common.js` / `index.js` / `dashboard.html`）
42. `leleleTrack` 补事件名白名单，防误报脏数据（`common.js`）
43. 公告缓存键加版本号前缀，避免旧缓存格式兼容问题（`common.js`）
44. 公告消毒补 `<img>` 相关用例（即使暂未启用）（`common.js`）
45. 灵动岛触发阈值 `scrollY > 80` 提取为具名常量（`common.js`）
46. `pageSize=25` 按视口高度自适应，减少首屏空白（`index.js`）
47. 搜索防抖 `200ms` 提取为常量（`index.js`）
48. `ANALYTICS_TTL` 与轮询间隔统一常量，避免不一致（`index.js`）
49. 投稿成功后用 `history.replaceState` 清掉 `?submitted=1`（`index.js`）
50. `search.js` 的评分阈值 40 提取为常量（`search.js`）
51. `search.js` 的 `slice(0,500)` 改为可配置上限（`search.js`）
52. 拼音库加载失败时给可见降级提示，而非静默退化为纯文本（`search.js`）
53. `AUTO_OPEN_DELAY=800` 提取常量并补注释（`notice.js`）
54. `SEEN_PREFIX` 加告示 payload 版本前缀（`notice.js`）
55. `endAt` 过期的告示即时清理，不参与排序（`notice.js`）
56. 告示正文 `\n\n` 段落间距微调，改善长文可读性（`notice.js`）
57. `rank-loader.js` 的 4 个 API 端点提取为常量数组（`rank-loader.js`）
58. 页面隐藏（`visibilitychange`）时暂停排行榜轮询（`rank-loader.js`）
59. Top3 奖牌 emoji 换 SVG，避免字体缺字（`rank-loader.js`）
60. `statusCacheMs` 注释补单位与取值理由（`recaptcha-config.js`）
61. 本地 `apiBaseUrl` 支持环境变量覆盖，方便联调（`recaptcha-config.js`）
62. 熔断计数在验证成功后清零（`recaptcha.js`）
63. 友好错误码集中成中英映射表，避免散落三元表达式（`recaptcha.js`）
64. SDK 缺失时给可见提示，现在只 `console.error`（`supabase-client.js`）
65. 三个 `subtitle` 抽成常量，避免六处重复（`legal_generic.js`）
66. `LELELE_LEGAL_ATTRIBUTION` 的中英文案换行规范化（`legal_generic.js`）
67. tooltip 截断长度与 CSS `max-width:260px` 对齐（`pager-nav.js` / `common.css`）
68. `pager-nav.js` 补 `popstate` 时的重挂载（`pager-nav.js`）
69. 触屏设备把 hover tooltip 改为点击显示（`pager-nav.js` / `common.css`）
70. `warnOnce` 加可开关的节流日志模式（`lsfp-adapter.js`）
71. `MAX_CONCURRENCY=2` 按设备 `hardwareConcurrency` 微调（`lsfp-adapter.js`）
72. `rootMargin:'200px 0px'` 提取为具名常量（`lsfp-adapter.js`）
73. decode 耗时超过 2s 时输出告警，便于发现大图（`lsfp-adapter.js`）
74. `lsfp.js` 的内置版本号与 `LSFP-NOTICE.txt` 对齐（`lsfp.js`）
75. 给 `lelegame_data.json` 补 `$schema` 引用与字段说明（`lelegame_data.json`）
76. 统一给 30 个 `game/data/*.json` 补齐 `legal_urls`（很多目前字段缺失，靠降级）（`game/data/`）
77. 统一 `game/data/*.json` 的字段顺序，降低 diff 噪音（`game/data/`）
78. 全量检查 `url` 中的 `http://` 并统一为 https（`lelegame_data.json` / `game/data/`）
79. 核对 9 个 `authors/data/*.json` 的 `games_count` 与实际计数（`authors/data/`）
80. 归档 `announcements.json` 里已过期的 13 条中的失效项（`announcements.json`）
81. `noticetodeveloper.json` 的 `_readme` 补 `oncePerUser` / `priority` 说明（`noticetodeveloper.json`）
82. `activity_whole.json` 的 `forceEnable` 加注释说明优先级（`activity_whole.json`）
83. `special_common.json` 的域名 / 路径数组去重（`special_common.json`）
84. `changelog.json` 的 50 条日期格式统一为 `YYYY-MM-DD`（`changelog.json`）
85. `manifest-*.json` 的 `start_url` 与 canonical 对齐（`manifest-zh/en.json`）
86. `sitemap.xml` 的 `lastmod` 用真实更新日期而非固定值（`sitemap.xml`）
87. `sitemap.xml` 补 `<changefreq>` / `<priority>`（`sitemap.xml`）
88. 规则页页尾历史版本索引按版本号升序排列（`game_rules.html`）
89. 三份 `game_rules4-0-*.html` 标题统一带「历史留存」字样（`game_rules4-0-*.html`）
90. `legal_templates.html` 的 5 个导出按钮补 `aria-label`（`legal_templates.html`）
91. `legal_templates.html` 的中英占位符逐条对齐（`legal_templates.html`）
92. `generic_*.html` 的 `quick-links` 在语言切换时保留 `?lang=en`（`generic_*.html`）
93. `user_agreement.html` 各条款补 `id` 锚点，支持深链（`user_agreement.html`）
94. `privacy.html` / `terms.html` 补「最后更新」日期（`privacy.html` / `terms.html`）
95. `about.html` 的 changelog 条目补版本号锚点（`about.html`）
96. `dashboard.html` 的 `SITE_ID=1` 提取为具名常量（`dashboard.html`）
97. `login.html` 的 OAuth 按钮按使用率排序（`login.html`）
98. `404.html` 的「返回首页」保留当前 `?lang=en`（`404.html`）
99. `game/` 12 个子页的 `common.js` 引用统一为根绝对路径（`game/*/index.html`）
100. `historymd/` 记录模板补一段可复制的「验证命令」片段（`foraisthings.md` 0.3）

---

## 五、挑选建议

- **先做 🟢 里能顺手带上的**：#16 / #17 / #23 / #25 / #26 / #28 / #31 / #76 / #78 / #98 这类一致性清理，改动小、收益是「以后少踩坑」。
- **性价比最高的 🟡**：#5 空链接置灰、#8 筛选状态入 URL、#19 作者名可点、#45 无限滚动，都是用户直接感知的。
- **动手前必读**：涉及数据的条目先查 `foraisthings.md` 第 3 章（数据契约）与 6.2（surge 权威源），涉及缓存的查 4.12 与 6.3，涉及样式的查 8.2（级联顺序）。
- **别重复劳动**：`plan.md` 的 170 项已全部修完；本文里若有条目其实已完成，直接从清单删除并在 `historymd/` 记录一次即可。
