// admin-apply.mjs —— 由 admin.html 经 repository_dispatch 触发，在远端校验并生成站点数据。
// 信任前端不可信：所有写入前必须过校验；校验不通过直接抛错，绝不写盘。
// 本文件不依赖任何第三方包，仅用 Node 内置模块。
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CATEGORIES = new Set(['Casual', 'Adventure', 'Shooter', 'Action', 'Puzzle', 'Simulation', 'Casual / Parkour']);
const AGES = new Set(['All Ages', '12+', '6+']);
const TYPES = new Set(['local', 'external', 'internal']);
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const DANGER_RE = /<script|onerror\s*=|javascript:/i;

function fail(msg) { throw new Error('校验失败：' + msg); }
function isHttpsOrLocal(u) { return !u || /^https:\/\//i.test(u) || u.startsWith('/') || u.startsWith('#'); }

function loadAuthors() {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'authors/index.json'), 'utf8')); }
  catch { return []; }
}
function authorIds() { return new Set(loadAuthors().map(a => String(a.id))); }

function checkPrivacy(obj, p) {
  for (const [k, v] of Object.entries(obj)) {
    const key = p ? p + '.' + k : k;
    if (typeof v === 'string') {
      if (EMAIL_RE.test(v)) fail('字段 ' + key + ' 含邮箱，禁止写入公开仓库');
    } else if (Array.isArray(v)) {
      v.forEach((x, i) => { if (x && typeof x === 'object') checkPrivacy(x, key + '[' + i + ']'); });
    } else if (v && typeof v === 'object') {
      checkPrivacy(v, key);
    }
  }
}

function writeJson(rel, obj) {
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(obj, null, 2) + '\n');
}
function readJson(rel) { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }

/* ---------------- 游戏 ---------------- */
function validateGameCommon(data) {
  if (!data.name_zh || !data.name_en) fail('名称中英文必填');
  if (!data.url) fail('游戏地址必填');
  if (!CATEGORIES.has(data.category_en)) fail('分类非法: ' + data.category_en);
  if (!AGES.has(data.ageRating_en)) fail('适龄非法: ' + data.ageRating_en);
  if (!TYPES.has(data.type)) fail('类型非法: ' + data.type);
  if (!authorIds().has(String(data.author))) fail('作者 id 不存在: ' + data.author);
  if (!isHttpsOrLocal(data.url)) fail('地址需 https 或站内路径');
  if (data.banner && !isHttpsOrLocal(data.banner)) fail('横幅地址非法');
  (data.screenshots || []).forEach(s => { if (!isHttpsOrLocal(s)) fail('截图地址非法: ' + s); });
  (data.videos || []).forEach(s => { if (!/^https:\/\//i.test(s)) fail('视频需 https 直链: ' + s); });
  ['eula', 'privacy', 'terms'].forEach(k => {
    if (data.legal_urls && data.legal_urls[k] && !/^https:\/\//i.test(data.legal_urls[k])) fail('协议地址需 https: ' + k);
  });
  checkPrivacy(data, 'data');
}

function gameListItem(data) {
  return {
    id: data.id, name_zh: data.name_zh, name_en: data.name_en, icon: data.icon || '🎮',
    category_zh: data.category_zh, category_en: data.category_en, type: data.type,
    ageRating_zh: data.ageRating_zh, ageRating_en: data.ageRating_en,
    author: String(data.author), url: data.url
  };
}
function gameDetail(data, existing) {
  const a = loadAuthors().find(x => String(x.id) === String(data.author));
  return Object.assign({}, existing, {
    id: data.id, name_zh: data.name_zh, name_en: data.name_en, icon: data.icon || '🎮',
    category_zh: data.category_zh, category_en: data.category_en, type: data.type,
    ageRating_zh: data.ageRating_zh, ageRating_en: data.ageRating_en,
    version: data.version || (existing && existing.version) || 'v1.0.0',
    author: String(data.author), url: data.url,
    banner: data.banner || '', screenshots: data.screenshots || [],
    videos: data.videos || [], description_zh: data.description_zh || '',
    description_en: data.description_en || '', updateLog_zh: data.updateLog_zh || [],
    updateLog_en: data.updateLog_en || [], summary: data.summary || '', summary_en: data.summary_en || '',
    authorName: a ? (a.name_zh || a.name_en) : (existing && existing.authorName) || String(data.author),
    legal_urls: data.legal_urls || { eula: '', privacy: '', terms: '' }
  });
}

export function genAddGame(data) {
  validateGameCommon(data);
  const p = 'lelegame_data.json';
  const arr = readJson(p);
  if (arr.some(g => g.id === data.id)) fail('主列表已存在 id ' + data.id);
  arr.push(gameListItem(data));
  writeJson(p, arr);
  const dp = path.join('game', 'data', data.id + '.json');
  fs.writeFileSync(path.join(ROOT, dp), JSON.stringify(gameDetail(data, {}), null, 2) + '\n');
  return { files: [p, dp], summary: `新增游戏 id=${data.id}《${data.name_zh}》` };
}

export function genUpdateGame(data) {
  if (!data.id) fail('缺少 id');
  validateGameCommon(data);
  const dp = path.join('game', 'data', data.id + '.json');
  let existing = {};
  try { existing = readJson(dp); } catch { fail('详情文件不存在 id ' + data.id); }
  const p = 'lelegame_data.json';
  const arr = readJson(p);
  const idx = arr.findIndex(g => g.id === data.id);
  if (idx < 0) fail('主列表无 id ' + data.id);
  arr[idx] = gameListItem(data);
  writeJson(p, arr);
  writeJson(dp, gameDetail(data, existing));
  return { files: [p, dp], summary: `更新游戏 id=${data.id}《${data.name_zh}》` };
}

/* ---------------- 全站公告 ---------------- */
export function genAddAnnouncement(data) {
  if (!data.id) fail('公告 id 必填');
  if (!data.title_zh || !data.title_en) fail('标题双语必填');
  if (!data.content_zh || !data.content_en) fail('正文双语必填');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.publishDate || '')) fail('发布日期格式 YYYY-MM-DD');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.expireDate || '')) fail('过期日期格式 YYYY-MM-DD');
  ['title_zh', 'title_en', 'content_zh', 'content_en'].forEach(k => {
    if ((data[k] || '').includes('**')) fail('正文/标题禁止用 ** ，请用工具条加粗');
    if (DANGER_RE.test(data[k] || '')) fail('检测到危险标签: ' + k);
  });
  checkPrivacy(data, 'data');
  const p = 'announcements.json';
  const arr = readJson(p);
  if (arr.some(a => a.id === data.id)) fail('公告 id 重复: ' + data.id);
  arr.push({
    id: data.id, title_zh: data.title_zh, title_en: data.title_en,
    content_zh: data.content_zh, content_en: data.content_en,
    publishDate: data.publishDate, expireDate: data.expireDate
  });
  writeJson(p, arr);
  return { files: [p], summary: `发全站公告 id=${data.id}` };
}

/* ---------------- 开发者专用告示 ---------------- */
export function genAddNotice(data) {
  if (!data.id) fail('告示 id 必填');
  if (!data.title_zh || !data.title_en) fail('标题双语必填');
  if (!data.body_zh || !data.body_en) fail('正文双语必填');
  if (typeof data.priority !== 'number' || !isFinite(data.priority)) fail('优先级需数字');
  const av = data.author;
  if (av !== 'all' && av !== '*') {
    const list = Array.isArray(av) ? av : [av];
    list.forEach(id => { if (!authorIds().has(String(id))) fail('告示对象作者 id 不存在: ' + id); });
  }
  if (data.startAt && isNaN(Date.parse(data.startAt))) fail('开始时间非法: ' + data.startAt);
  if (data.endAt && isNaN(Date.parse(data.endAt))) fail('结束时间非法: ' + data.endAt);
  if ((data.body_zh || '').includes('**')) fail('告示正文禁止 ** ，纯文本');
  if (DANGER_RE.test(data.body_zh || '') || DANGER_RE.test(data.body_en || '')) fail('告示正文含危险标签');
  (data.media || []).forEach(m => { if (!m || !m.src) fail('媒体缺 src'); if (!isHttpsOrLocal(m.src)) fail('媒体 src 非法: ' + m.src); });
  (data.buttons || []).forEach(b => { if (!/^(\/|https:\/\/game\.leleleling\.site)/i.test(b.url || '')) fail('按钮链接须站内可达: ' + b.url); });
  checkPrivacy(data, 'data');
  const p = 'noticetodeveloper.json';
  const obj = readJson(p);
  if (obj.notices.some(n => n.id === data.id)) fail('告示 id 重复: ' + data.id);
  obj.notices.push({
    id: data.id, enabled: true, author: av, priority: data.priority,
    startAt: data.startAt || null, endAt: data.endAt || null,
    title_zh: data.title_zh, title_en: data.title_en,
    body_zh: data.body_zh, body_en: data.body_en,
    media: data.media || [], buttons: data.buttons || [],
    dismissible: !!data.dismissible, oncePerUser: !!data.oncePerUser
  });
  obj.version = (obj.version || 0) + 1;
  obj.updatedAt = new Date().toISOString();
  writeJson(p, obj);
  return { files: [p], summary: `发开发者告示 id=${data.id}（version→${obj.version}）` };
}

/* ---------------- 入口 ---------------- */
function main() {
  const raw = process.env.PAYLOAD;
  if (!raw) fail('缺少 PAYLOAD 环境变量');
  let payload;
  try { payload = JSON.parse(raw); } catch { fail('PAYLOAD 不是合法 JSON'); }
  const { action, data } = payload;
  if (!action || !data) fail('payload 缺 action/data');
  let res;
  if (action === 'add-game') res = genAddGame(data);
  else if (action === 'update-game') res = genUpdateGame(data);
  else if (action === 'add-announcement') res = genAddAnnouncement(data);
  else if (action === 'add-notice') res = genAddNotice(data);
  else fail('未知 action: ' + action);
  console.log('CHANGED_FILES=' + JSON.stringify(res.files));
  console.log('SUMMARY=' + res.summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '## ' + res.summary + '\n\n- ' + res.files.join('\n- ') + '\n');
  }
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, 'summary=' + res.summary.replace(/\n/g, ' ') + '\n');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, 'files=' + JSON.stringify(res.files) + '\n');
  }
}

export { loadAuthors, authorIds };
if (process.env.ADMIN_NO_MAIN !== '1') main();
