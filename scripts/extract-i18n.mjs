/* ==========================================================================
 * 抽取全站双语文案 → lang.json
 *
 * 干什么：把 33 个 HTML 里成对出现的
 *   <span class="zh-inline">中文</span><span class="en-inline">English</span>
 * 抽成 { key: { zh, en } } 的结构，key 由中文文案的短哈希生成（稳定、可复用）。
 *
 * 为什么先只抽不改页面：
 *   33 个页面里这类双写有上千处，直接批量替换成 data-i18n 一旦有一个页面
 *   的片段结构不规整（嵌套 span、带内联样式、混着 emoji），整页文案就会错位。
 *   所以分两步：① 先抽出真值表（本脚本，零风险，不改页面）；
 *   ② 之后按页面一个个迁移成 data-i18n，每迁一个页面对照 lang.json 检查。
 *
 * 用法：
 *   node scripts/extract-i18n.mjs            # 生成/更新 lang.json
 *   node scripts/extract-i18n.mjs --check    # 只报告，不写文件
 * ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const checkOnly = process.argv.includes('--check');

const PAIR_RE = /<span class="zh-inline"[^>]*>([^<]*)<\/span>\s*<span class="en-inline"[^>]*>([^<]*)<\/span>/g;

function keyOf(zh) {
    return 'k' + crypto.createHash('sha1').update(zh.trim()).digest('hex').slice(0, 8);
}

const files = fs.readdirSync(root).filter(f => f.endsWith('.html'));
const out = {};
let total = 0;

for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    let m;
    const re = new RegExp(PAIR_RE.source, 'g');
    while ((m = re.exec(text)) !== null) {
        const zh = m[1].trim();
        const en = m[2].trim();
        if (!zh || !en) continue;
        const key = keyOf(zh);
        if (!out[key]) out[key] = { zh, en, pages: [] };
        else if (out[key].en !== en) out[key].en = en; // 同一中文对应不同英文：以最后一次为准
        if (!out[key].pages.includes(file)) out[key].pages.push(file);
        total++;
    }
}

const target = path.join(root, 'lang.json');
const payload = JSON.stringify(out, null, 2);
console.log(`[i18n] 扫描 ${files.length} 个页面，${total} 处双写，去重后 ${Object.keys(out).length} 条`);
if (checkOnly) {
    console.log('[i18n] --check 模式，未写文件');
} else {
    fs.writeFileSync(target, payload, 'utf8');
    console.log(`[i18n] 已写入 ${path.relative(root, target)}（${(payload.length / 1024).toFixed(1)} KB）`);
}
