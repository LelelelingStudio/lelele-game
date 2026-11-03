# 作者认证体系（Author Certification）

> 适用仓库：`lelele-game` 前端；作者数据源：`authors.surge.sh/authors.json`（本地主源位于 `/Users/david/Desktop/authors/authors.json`）。
> 上线前需把更新后的 `authors.json` 重新部署到 Surge（`surge authors.json` / 你的发布流程）。

## 1. 为什么需要它

区分“随便注册的账号”与“认真做游戏的开发者”，给玩家可信任的信号，也给优质作者成长路径与官方背书。

## 2. 等级（authorlevel 1–6）

数值存于 `authors.json` 的 `authorlevel` 字段。前端在**游戏详情页作者行**与**作者详情页**头部渲染对应徽章。

| 等级 | 中文 | 英文 | 设计要求（我方制定） |
| --- | --- | --- | --- |
| 1 | 普通创作者 | Creator | 完成开发者注册即获得，可发布第一款游戏。 |
| 2 | 制作人 | Producer | 已发布 ≥1 款游戏；资料完整（头像+简介）；至少绑定一种登录方式。 |
| 3 | 优质制作人 | Quality Producer | 累计发布 ≥3 款游戏；至少 1 款上架 ≥14 天且无严重违规；或被官方编辑推荐。 |
| 4 | 开发者 | Developer | 累计发布 ≥3 款且至少 1 款上架 ≥30 天；通过内容合规复审；收到 ≥10 条有效玩家反馈。 |
| 5 | 金牌开发者 | Gold Developer | 累计发布 ≥5 款；至少 2 款评分 ≥4.7 或总游玩 ≥10 万；无违规记录；经官方评定。 |
| 6 | 开发团队 | Dev Team | 以团队名义注册并绑定组织；≥5 款游戏；官方认证的组织实体；支持多人协作。 |

> 要求为产品侧设计，实际晋升由官方后台/人工审核决定（暂未做自动判定脚本）。如需自动判定，可依据 `lelegame_data.json` 的游戏数/评分/上线天数在构建期计算 `authorlevel`。

## 3. 官方认证标志（official）

独立布尔字段 `official`。渲染文案：中文 **【官方】**、英文 **Official**（红色徽章）。
用于经过官方正式背书的账号（如本站自营、合作方、特邀嘉宾）。与等级互不影响：一个账号可以同时是“普通创作者 + 官方”。

## 4. 本站原创团队特殊标志（studio_special）

仅本站主理团队（了了了岭工作室）使用，布尔字段 `studio_special`。渲染**金色渐变 + ★** 徽章 `本站原创团队 / Official Studio`，与官方、等级徽章并列但视觉上更突出，和其他创作者明确区分。

## 5. 数据字段（authors.json 每一条作者对象）

```json
{
  "id": 1,
  "uuid": "b646df8a-...",        // Supabase 用户 id（空串=未注册）
  "name_zh": "了了了岭工作室",
  "name_en": "Leleleling Studio",
  "authorlevel": 6,              // 1–6，缺省按 1
  "official": true,              // 是否官方认证
  "studio_special": true         // 是否本站原创团队（仅主理团队）
}
```

## 6. 前端如何渲染

- 配置表：`common.js` 的 `LELELE_AUTHOR_LEVELS`（含各级中英名/颜色/要求）。
- 渲染助手：`window.leleleAuthorBadges(author, {en})` → 返回徽章 HTML（特殊 → 官方 → 等级）。
- 注入点：
  - 游戏详情页：`game.html` 的 `#authorBar` 作者名后追加 `<span class="author-badges">`。
  - 作者详情页：`author.html` 的 `#authorBadges`（作者名下方）。
- 样式：`common.css` 中 `.lelele-badge*`。

## 7. 账号绑定修复记录（2026-11-03）

修复了“绑定第三方账号会跳登录页并新建账号”的问题：

- 根因：`dashboard.html` 的 `linkIdentity` 把 `redirectTo` 指向 `login.html`，OAuth 回跳落到登录页的通用处理函数，被当成登录流程，触发新建账号。
- 修复：
  1. `linkIdentity` 的 `redirectTo` 改回 `dashboard.html`；
  2. `dashboard.html` 新增 `handleOAuthLinkReturn()`，在 DOMContentLoaded 入口检测 `?code` 并调用 `exchangeCodeForSession` 完成绑定、刷新身份列表、清理 URL。

> 注意：Supabase 通过 **linkIdentity** 把第三方身份关联到**当前已登录**账号。若第三方邮箱已属于另一个 Supabase 账号，绑定会失败（“Email belongs to another account”）——这是 Supabase 的安全限制，需先在那一端合并/解绑，属正常现象。

## 8. 关于“新增绑定邮箱”

Supabase 的账号**以单个邮箱为主键**，**原生不支持同一账号绑定两个邮箱**。因此：

- 对“无邮箱、仅 Google 登录”的账号：点“添加邮箱”会调用 `updateUser({ email })` 设置主邮箱，并向新邮箱发送确认链接，确认后即具备邮箱登录能力（仍是同一个账号）。
- 对已有邮箱的账号：该操作为“更换邮箱”。
- 若希望“用另一邮箱也能登同一个号”，Supabase 不支持；可考虑让用户只用第三方身份登录，或合并账号（需后端自定义逻辑，不在本次范围）。

## 9. 升级/调整等级的步骤

1. 编辑 `/Users/david/Desktop/authors/authors.json`，改对应作者的 `authorlevel` / `official` / `studio_special`；
2. 重新部署到 Surge（`authors.surge.sh`）；
3. 清缓存（或等 CDN）后，游戏详情页与作者页即时生效（前端每次拉取都带 `?t=` 时间戳）。
