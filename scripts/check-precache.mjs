#!/usr/bin/env node
/**
 * Precache existence check (#30).
 * Reads sw.js's ASSETS_TO_CACHE list and verifies every local path exists on disk.
 * External (http/https) URLs are skipped. Run: node scripts/check-precache.mjs
 * Exits non-zero if any local precache target is missing.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sw = readFileSync(resolve(root, 'sw.js'), 'utf8');
const match = sw.match(/const\s+ASSETS_TO_CACHE\s*=\s*\[([\s\S]*?)\];/);
if (!match) {
  console.error('[check-precache] Cannot find ASSETS_TO_CACHE in sw.js');
  process.exit(2);
}
const paths = [...match[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
const missing = [];
for (const p of paths) {
  if (/^https?:\/\//i.test(p)) continue;
  const clean = p.split('?')[0].replace(/^\//, '');
  if (!clean) continue;
  if (!existsSync(resolve(root, clean))) missing.push(p);
}
if (missing.length) {
  console.error('[check-precache] Missing precache targets:');
  missing.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
console.log(`[check-precache] OK - ${paths.length} precache entries verified.`);
