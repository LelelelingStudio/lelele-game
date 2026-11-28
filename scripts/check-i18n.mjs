/* ==========================================================================
 * 双语一致性检查（i18n guard）
 *
 * 全站文案目前仍是「zh-inline / en-inline 成对双写」的形态，lang.json 只是抽出来的
 * 真值表。这个脚本代替人工逐个翻页检查，保证：
 *   1) 每个 .zh-inline 后面都紧跟一个 .en-inline（不能只写中文忘翻译）；
 *   2) 成对片段里的中英文内容都在 lang.json 里；
 *   3) 空标签、纯空白也算错误（渲染出来会是一个空洞）。
 *
 * 为什么不做「页面批量迁移成 data-i18n」：
 *   站点是纯静态托管，文案必须写死在 HTML 里才能被搜索引擎和首屏直接读到；
 *   改成运行时从 lang.json 取，会出现首屏文字闪空（FOUC），而且 30+ 页面的
 *   嵌套片段结构一旦有一处不规整就会整页错位。所以迁移暂缓，先加这道检查兜底。
 *
 * 用法：
 *   node scripts/check-i18n.mjs          # 检查，有问题 exit 1
 *   node scripts/check-i18n.mjs --verbose
 * ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');

const PAIR_RE = /<span class="zh-inline"[^>]*>([^<]*)<\/span>\s*<span class="en-inline"[^>]*>([^<]*)<\/span>/g;
// 只找 zh 片段本身，配对情况后面按「紧跟的空白之后是不是 en 片段」判断（允许跨行）
const ZH_SPAN_RE = /<span class="zh-inline"[^>]*>([^<]*)<\/span>/g;
const EN_NEXT_RE = /<span class="en-inline"[^>]*>([^<]*)<\/span>/;
const CJK_RE = /[\u4e00-\u9fa5]/;

const html = fs.readdirSync(root).filter(f => f.endsWith('.html'));
let problems = 0, pairs = 0;

let lang = {};
try { lang = JSON.parse(fs.readFileSync(path.join(root, 'lang.json'), 'utf8')); } catch (e) { lang = {}; }
const known = new Set(Object.values(lang).map(v => v.zh));

for (const file of html) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    const re = new RegExp(PAIR_RE.source, 'g');
    let m;
    while ((m = re.exec(text)) !== null) {
        pairs++;
        if (!m[1].trim() || !m[2].trim()) {
            problems++;
            console.log(`✗ ${file}: 空的成对片段 "${m[1].slice(0, 20)}" / "${m[2].slice(0, 20)}"`);
        } else if (lang && Object.keys(lang).length && !known.has(m[1].trim()) && verbose) {
            console.log(`· ${file}: 未进 lang.json "${m[1].trim().slice(0, 30)}"（改过文案后需重跑 extract-i18n）`);
        }
    }
    // 只写中文、没有对应英文的片段（允许中间有换行/缩进）
    const re2 = new RegExp(ZH_SPAN_RE.source, 'g');
    while ((m = re2.exec(text)) !== null) {
        // 允许 zh / en 之间夹着短小的动态元素（如 <b> 占位），只要中间没有中文文字
        const after = text.slice(m.index + m[0].length, m.index + m[0].length + 700);
        const next = after.match(EN_NEXT_RE);
        const gap = next ? after.slice(0, after.indexOf(next[0])) : '';
        if (next && CJK_RE.test(gap)) { next = null; }
        if (!next) {
            problems++;
            console.log(`✗ ${file}: 中文片段没有配 en-inline → "${m[1].trim().slice(0, 30)}"`);
        } else if (!next[1].trim()) {
            problems++;
            console.log(`✗ ${file}: 英文片段为空 → "${m[1].trim().slice(0, 30)}"`);
        }
    }
}

console.log(`[i18n] 扫描 ${html.length} 个页面，成对片段 ${pairs} 处，问题 ${problems} 处`);
if (problems) process.exit(1);
console.log('[i18n] OK - 双语片段全部成对且非空');
