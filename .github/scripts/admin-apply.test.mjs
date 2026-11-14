// admin-apply.test.mjs —— 用临时目录 fixtures 覆盖四类动作的校验与生成。
// 运行：ADMIN_NO_MAIN=1 node --test .github/scripts/admin-apply.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RESOLVED = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'admin-apply.mjs');

function makeFixtures(dir) {
  fs.writeFileSync(path.join(dir, 'lelegame_data.json'), JSON.stringify([
    { id: 1, name_zh: '测试', name_en: 'Test', icon: '🎮', category_zh: '休闲', category_en: 'Casual', type: 'local', ageRating_zh: '全年龄', ageRating_en: 'All Ages', author: '1', url: 'https://x.com' }
  ], null, 2));
  fs.mkdirSync(path.join(dir, 'authors'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'authors/index.json'), JSON.stringify([
    { id: 1, name_zh: '了了了岭', name_en: 'Studio', authorlevel: 6, official: true },
    { id: 3, name_zh: 'Kevin', name_en: 'Kevin' }
  ], null, 2));
  fs.writeFileSync(path.join(dir, 'announcements.json'), JSON.stringify([], null, 2));
  fs.writeFileSync(path.join(dir, 'noticetodeveloper.json'), JSON.stringify({ version: 1, updatedAt: '2026-01-01', _readme: {}, notices: [] }, null, 2));
  fs.mkdirSync(path.join(dir, 'game', 'data'), { recursive: true });
}

let tmp, mod, prevCwd;
test.beforeEach(async () => {
  process.env.ADMIN_NO_MAIN = '1';
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'admin-'));
  makeFixtures(tmp);
  prevCwd = process.cwd();
  process.chdir(tmp);
  mod = await import(RESOLVED + '?t=' + Date.now());
});
test.afterEach(() => {
  process.chdir(prevCwd);
  fs.rmSync(tmp, { recursive: true, force: true });
});

const gameData = (over) => Object.assign({
  id: 2, name_zh: '新游戏', name_en: 'New', icon: '🎮', category_zh: '休闲', category_en: 'Casual',
  ageRating_zh: '全年龄', ageRating_en: 'All Ages', type: 'local', author: '1', url: 'https://new.com',
  version: 'v1.0.0', summary: '简介', summary_en: 'intro', banner: 'https://gamepic.surge.sh/a.lsfp',
  screenshots: ['https://gamepic.surge.sh/b.lsfp'], videos: ['https://x.com/v.mp4'],
  description_zh: '玩法', description_en: 'play', updateLog_zh: ['v1.0.0 首发'], updateLog_en: ['release'],
  legal_urls: { eula: '', privacy: '', terms: '' }
}, over);

test('add-game：正常生成主列表 + 详情', () => {
  const r = mod.genAddGame(gameData());
  assert.deepEqual(r.files, ['lelegame_data.json', path.join('game', 'data', '2.json')]);
  const games = JSON.parse(fs.readFileSync('lelegame_data.json', 'utf8'));
  assert.equal(games.length, 2);
  assert.equal(games[1].id, 2);
  assert.equal(games[1].author, '1'); // 字符串
  const detail = JSON.parse(fs.readFileSync('game/data/2.json', 'utf8'));
  assert.equal(detail.author, '1');
  assert.equal(detail.authorName, '了了了岭');
  assert.equal(detail.legal_urls.terms, '');
  assert.deepEqual(detail.screenshots, ['https://gamepic.surge.sh/b.lsfp']);
});

test('add-game：id 重复失败', () => {
  assert.throws(() => mod.genAddGame(gameData({ id: 1 })), /已存在 id 1/);
});

test('add-game：非法分类 / 作者 / url 失败', () => {
  assert.throws(() => mod.genAddGame(gameData({ category_en: 'RPG' })), /分类非法/);
  assert.throws(() => mod.genAddGame(gameData({ author: '99' })), /作者 id 不存在/);
  assert.throws(() => mod.genAddGame(gameData({ url: 'ftp://bad' })), /地址需 https/);
});

test('add-game：邮箱字段被拒绝（隐私）', () => {
  assert.throws(() => mod.genAddGame(gameData({ description_zh: '联系 me@a.com' })), /含邮箱/);
});

test('update-game：两处同步更新', () => {
  fs.writeFileSync('game/data/1.json', JSON.stringify({ id: 1, name_zh: '旧', author: '1', url: 'https://old.com', version: 'v0.9' }, null, 2));
  const r = mod.genUpdateGame(gameData({ id: 1, url: 'https://updated.com', name_zh: '改后' }));
  assert.equal(r.files.length, 2);
  const games = JSON.parse(fs.readFileSync('lelegame_data.json', 'utf8'));
  assert.equal(games[0].url, 'https://updated.com');
  const detail = JSON.parse(fs.readFileSync('game/data/1.json', 'utf8'));
  assert.equal(detail.url, 'https://updated.com');
  assert.equal(detail.name_zh, '改后');
});

test('update-game：详情缺失则失败', () => {
  assert.throws(() => mod.genUpdateGame(gameData({ id: 5 })), /详情文件不存在/);
});

test('add-announcement：正常追加', () => {
  const r = mod.genAddAnnouncement({ id: '20261112-t-200', title_zh: '标题', title_en: 'T', content_zh: '<strong>正文</strong>', content_en: 'body', publishDate: '2026-11-12', expireDate: '2027-05-12' });
  assert.deepEqual(r.files, ['announcements.json']);
  const arr = JSON.parse(fs.readFileSync('announcements.json', 'utf8'));
  assert.equal(arr.length, 1);
});

test('add-announcement：拦截 ** 与危险标签 / id 重复', () => {
  assert.throws(() => mod.genAddAnnouncement({ id: 'a', title_zh: 't', title_en: 't', content_zh: '**x**', content_en: 'x', publishDate: '2026-11-12', expireDate: '2027-01-01' }), /禁止用 \*\*/);
  assert.throws(() => mod.genAddAnnouncement({ id: 'a', title_zh: 't', title_en: 't', content_zh: '<script>x</script>', content_en: 'x', publishDate: '2026-11-12', expireDate: '2027-01-01' }), /危险标签/);
  mod.genAddAnnouncement({ id: 'dup', title_zh: 't', title_en: 't', content_zh: 'x', content_en: 'x', publishDate: '2026-11-12', expireDate: '2027-01-01' });
  assert.throws(() => mod.genAddAnnouncement({ id: 'dup', title_zh: 't', title_en: 't', content_zh: 'x', content_en: 'x', publishDate: '2026-11-12', expireDate: '2027-01-01' }), /id 重复/);
});

test('add-notice：正常 version+1', () => {
  const r = mod.genAddNotice({ id: 'dev-1', author: 'all', priority: 200, startAt: '2026-11-12T00:00:00+08:00', endAt: '2027-01-01T00:00:00+08:00', title_zh: 't', title_en: 't', body_zh: 'b', body_en: 'b', media: [{ type: 'image', src: 'https://gamepic.surge.sh/x.lsfp' }], buttons: [{ primary: true, label_zh: '看', url: '/game.html?id=1' }], dismissible: true, oncePerUser: true });
  assert.deepEqual(r.files, ['noticetodeveloper.json']);
  const obj = JSON.parse(fs.readFileSync('noticetodeveloper.json', 'utf8'));
  assert.equal(obj.version, 2);
  assert.equal(obj.notices.length, 1);
  assert.equal(obj.notices[0].author, 'all');
});

test('add-notice：author 不存在 / 按钮非站内 / 媒体非法 失败', () => {
  const base = { id: 'n', author: 'all', priority: 100, title_zh: 't', title_en: 't', body_zh: 'b', body_en: 'b' };
  assert.throws(() => mod.genAddNotice({ ...base, author: [1, 99] }), /作者 id 不存在/);
  assert.throws(() => mod.genAddNotice({ ...base, buttons: [{ label_zh: 'x', url: 'https://evil.com' }] }), /站内可达/);
  assert.throws(() => mod.genAddNotice({ ...base, media: [{ type: 'image', src: 'ftp://x' }] }), /媒体 src 非法/);
});

/* ---------------- 作者（权威源已迁回本仓库） ---------------- */
const authorData = (over) => Object.assign({
  id: 11, name_zh: '新作者', name_en: 'New Author',
  uuid: 'd1f92b7f-ffc8-4597-bb0c-b2e835bacc97', authorlevel: 2,
  official: false, studio_special: false
}, over);

test('add-author：正常追加并按 id 排序', () => {
  const r = mod.genAddAuthor(authorData());
  assert.deepEqual(r.files, ['authors/index.json']);
  const arr = JSON.parse(fs.readFileSync('authors/index.json', 'utf8'));
  assert.deepEqual(arr.map(a => a.id), [1, 3, 11]);
  assert.equal(arr[2].name_zh, '新作者');
  assert.equal(arr[2].authorlevel, 2);
  assert.equal(arr[2].official, undefined); // false / 默认值省略，与既有索引格式一致
});

test('add-author：id 重复 / 非整数 / 名称缺英文 / uuid 非法 / 等级越界 失败', () => {
  assert.throws(() => mod.genAddAuthor(authorData({ id: 1 })), /id 已存在/);
  assert.throws(() => mod.genAddAuthor(authorData({ id: 2.5 })), /正整数/);
  assert.throws(() => mod.genAddAuthor(authorData({ name_en: '' })), /中英文必填/);
  assert.throws(() => mod.genAddAuthor(authorData({ uuid: 'not-a-uuid' })), /uuid 格式非法/);
  assert.throws(() => mod.genAddAuthor(authorData({ authorlevel: 9 })), /等级/);
  assert.throws(() => mod.genAddAuthor(authorData({ name_zh: 'a@b.com' })), /含邮箱/);
  assert.throws(() => mod.genAddAuthor(authorData({ name_zh: '<script>x</script>' })), /危险标签/);
});

test('edit-author：原地更新且不丢 uuid', () => {
  fs.writeFileSync('authors/index.json', JSON.stringify([
    { id: 3, uuid: '56bffb80-d44a-427e-9014-367a2890e121', name_zh: 'Kevin Liao', name_en: 'Kevin Liao', authorlevel: 2 }
  ], null, 2));
  const r = mod.genEditAuthor(authorData({ id: 3, name_zh: 'Kevin（改）', name_en: 'Kevin (edited)', uuid: '', authorlevel: 4, official: true }));
  assert.deepEqual(r.files, ['authors/index.json']);
  const arr = JSON.parse(fs.readFileSync('authors/index.json', 'utf8'));
  assert.equal(arr[0].name_zh, 'Kevin（改）');
  assert.equal(arr[0].authorlevel, 4);
  assert.equal(arr[0].official, true);
  assert.equal(arr[0].uuid, '56bffb80-d44a-427e-9014-367a2890e121'); // 未填 uuid 保留旧值
});

test('edit-author：id 不存在失败', () => {
  assert.throws(() => mod.genEditAuthor(authorData({ id: 99 })), /id 不存在/);
});

test('recomputeAuthorCounts：按主列表统计作品数并删孤儿文件', () => {
  fs.writeFileSync('lelegame_data.json', JSON.stringify([
    { id: 1, author: '1' }, { id: 2, author: '1' }, { id: 3, author: '3' }
  ], null, 2));
  fs.mkdirSync('authors/data', { recursive: true });
  fs.writeFileSync('authors/data/1.json', JSON.stringify({ games_count: 0 }));
  fs.writeFileSync('authors/data/99.json', JSON.stringify({ games_count: 5 }));
  const changed = mod.recomputeAuthorCounts();
  assert.equal(JSON.parse(fs.readFileSync('authors/data/1.json', 'utf8')).games_count, 2);
  assert.equal(JSON.parse(fs.readFileSync('authors/data/3.json', 'utf8')).games_count, 1);
  assert.equal(fs.existsSync('authors/data/99.json'), false);
  assert.ok(changed.includes(path.join('authors', 'data', '1.json')));
});
