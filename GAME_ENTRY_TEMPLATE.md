# 了了了游 · 新增游戏 JSON 输出规范（交给 AI 用）

你要为一款**外网游戏**生成两份 JSON 文件，用于加入「了了了游」平台。

---

## 输出要求

1. 只输出**两个 JSON 代码块**，不要解释、不要多余文字。
2. 严格合法的 JSON：**双引号**、无注释、无尾逗号。
3. 先输出「精简记录」，再输出「详情记录」。
4. 缺失的信息：**字符串填 `""`，数组填 `[]`**，不要编造。

---

## 文件一：`lelegame_data.json` 里追加的一条记录

这是首页列表用的精简记录，是**一个 JSON 对象**（追加到现有数组末尾）。

```json
{
  "id": 23,
  "name_zh": "中文名",
  "name_en": "English Name",
  "icon": "🎮",
  "category_zh": "休闲",
  "category_en": "Casual",
  "type": "external",
  "ageRating_zh": "全年龄",
  "ageRating_en": "All Ages",
  "version": "v1.0.0",
  "author": 4,
  "url": "https://example.com/game/"
}
```

字段说明：

| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| `id` | ✅ | number | 数字。当前已占用 1–22，本次用 **23** |
| `name_zh` | ✅ | string | 中文名 |
| `name_en` | ✅ | string | 英文名 |
| `icon` | ✅ | string | 单个 emoji |
| `category_zh` | ✅ | string | 见下方分类表 |
| `category_en` | ✅ | string | 见下方分类表 |
| `type` | ✅ | string | 外网游戏固定填 `"external"` |
| `ageRating_zh` | ✅ | string | `全年龄` / `6+` / `12+` / `16+` / `18+` |
| `ageRating_en` | ✅ | string | `All Ages` / `6+` / `12+` / `16+` / `18+` |
| `version` | ✅ | string | 形如 `v1.0.0` |
| `author` | ✅ | number 或 string | 开发者 ID（数字）或开发者名字（字符串） |
| `url` | ✅ | string | 游戏可玩地址，外网完整 URL |

分类对照表（`category_zh` / `category_en` 必须成对使用）：

| 中文 | 英文 |
|---|---|
| 休闲 | Casual |
| 冒险 | Adventure |
| 射击 | Shooter |
| 益智 | Puzzle |
| 动作 | Action |
| 模拟经营 | Simulation |

---

## 文件二：`game/data/23.json`（详情记录，文件名 = id 号）

**一个 JSON 对象**（不是数组）。

```json
{
  "id": 23,
  "name_zh": "中文名",
  "name_en": "English Name",
  "icon": "🎮",
  "category_zh": "休闲",
  "category_en": "Casual",
  "type": "external",
  "ageRating_zh": "全年龄",
  "ageRating_en": "All Ages",
  "version": "v1.0.0",
  "author": "4",
  "recommender": "推荐者名字",
  "url": "https://example.com/game/",
  "banner": "https://example.com/banner.png",
  "screenshots": [
    "https://example.com/shot1.png",
    "https://example.com/shot2.png"
  ],
  "videos": [
    "https://example.com/promo.mp4"
  ],
  "description_zh": "中文简介。可以写多段，用 \\n\\n 分段。",
  "description_en": "English description. Use \\n\\n for paragraphs.",
  "updateLog_zh": [
    { "version": "v1.0.0", "date": "2026-10-30", "content": "游戏首发上线！" }
  ],
  "updateLog_en": [
    { "version": "v1.0.0", "date": "2026-10-30", "content": "Initial release!" }
  ]
}
```

> ⚠️ 注意大小写差异：这里 `type` 必须是字符串 `"external"`；
> `author` 现在可以是数字 `4`，也可以是字符串 `"4"` 或开发者名字，字符串写法更安全。
> `recommender` 是本项目新增的推荐者字段。

字段说明（在文件一基础上多出的部分）：

| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| `recommender` | ✅ | string | 推荐者名字，纯文本 |
| `banner` | 推荐 | string | 横幅：图片 URL，或视频直链 |
| `screenshots` | 推荐 | string[] | 截图 URL 数组，可以是图片，也可以混入视频链接 |
| `videos` | 可选 | string[] | 额外视频链接数组 |
| `description_zh` | ✅ | string | 中文简介 |
| `description_en` | ✅ | string | 英文简介 |
| `updateLog_zh` | ✅ | object[] | 更新日志，`{version, date, content}` |
| `updateLog_en` | ✅ | object[] | 同上，英文版 |

---

## 视频链接支持规则（重要）

`banner`、`screenshots`、`videos` 三处都接受视频，按下述方式处理：

| 你填的链接形式 | 平台行为 |
|---|---|
| 以 `.mp4` `.webm` `.ogv` `.ogg` `.mov` `.m4v` `.m3u8` 结尾（可带 `?` 参数） | ✅ 当作视频，直接播放 |
| `https://www.bilibili.com/video/BVxxxxxxx` 或 `av` 号、`b23.tv` 短链 | ✅ 自动转换为内嵌播放器 |
| `https://youtu.be/xxx`、`https://www.youtube.com/watch?v=xxx` | ✅ 自动转换为内嵌播放器 |
| `https://vimeo.com/xxxxx` | ✅ 自动转换为内嵌播放器 |
| 其他图片地址（`.png` `.jpg` `.gif` `.webp` 等） | 当作图片 |

行为细节：
- `banner` 填**视频直链** → 横幅**静音自动循环**播放（浏览器策略限制，必须静音），右下角有静音开关
- `banner` 填**平台视频链接**（B 站/YouTube） → 无法自动播放，降级显示图标，点击后打开播放器
- `screenshots` 里的视频 → 显示带播放角标的缩略图，点击进灯箱播放

推荐的视频放法：**主推视频放 `videos`，截图放 `screenshots`**，这样最清晰。

---

## 完整填写示例

```json
{
  "id": 23,
  "name_zh": "星际清扫员",
  "name_en": "Star Sweeper",
  "icon": "🛰️",
  "category_zh": "射击",
  "category_en": "Shooter",
  "type": "external",
  "ageRating_zh": "12+",
  "ageRating_en": "12+",
  "version": "v1.2.0",
  "author": "4",
  "recommender": "了了了小明",
  "url": "https://starsweeper.example.com/",
  "banner": "https://starsweeper.example.com/banner.mp4",
  "screenshots": [
    "https://starsweeper.example.com/shot1.png",
    "https://starsweeper.example.com/shot2.png"
  ],
  "videos": [
    "https://www.bilibili.com/video/BV1xx411c7mD"
  ],
  "description_zh": "驾驶清扫飞船在轨道上穿梭，击碎废弃卫星并回收有价值的碎片。\n\n每关限时 90 秒，连击越高得分倍率越大。",
  "description_en": "Pilot a sweeper ship through orbit, shattering derelict satellites and salvaging valuable debris.\n\nEach level gives you 90 seconds; the higher your combo, the bigger the score multiplier.",
  "updateLog_zh": [
    { "version": "v1.2.0", "date": "2026-10-30", "content": "新增第三关与排行榜。" }
  ],
  "updateLog_en": [
    { "version": "v1.2.0", "date": "2026-10-30", "content": "Added Level 3 and leaderboard." }
  ]
}
```

---

## 你现在要做的

根据上述规范，为下面这款游戏生成两份 JSON：

- 游戏名称：**（在此填写）**
- 游戏地址：**（在此填写）**
- 推荐者：**（在此填写）**
- 其他已知信息：**（在此填写，可留空）**

生成后请**分别标注**哪个是「文件一」，哪个是「文件二」。
