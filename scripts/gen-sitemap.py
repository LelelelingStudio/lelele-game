#!/usr/bin/env python3
"""生成 sitemap.xml 与 sitemap.html。

单一数据来源：lelegame_data.json、authors/index.json、仓库根目录的 HTML。
以后再新增游戏/作者/页面，直接跑：

    python3 scripts/gen-sitemap.py            # lastmod 用今天
    python3 scripts/gen-sitemap.py --lastmod 2026-11-18

注意：只写这两份 sitemap 文件，不动其它任何内容。
"""
import argparse
import datetime
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://game.leleleling.site'

# 根页面：(路径, 中文标题, 英文标题, priority, changefreq)
STATIC_PAGES = [
    ('/', '首页', 'Home', '1.0', 'daily'),
    ('/game.html', '游戏详情页', 'Game detail', '0.9', 'weekly'),
    ('/play.html', '独立游戏播放器', 'Standalone player', '0.8', 'weekly'),
    ('/favgames.html', '收藏排行榜', 'Favorites leaderboard', '0.8', 'weekly'),
    ('/gamecheck.html', '游玩排行榜', 'Play leaderboard', '0.8', 'weekly'),
    ('/stats.html', '游戏数据大屏', 'Game stats dashboard', '0.7', 'weekly'),
    ('/author.html', '作者主页', 'Author page', '0.8', 'weekly'),
    ('/authorlevel.html', '认证等级说明', 'Certification levels', '0.6', 'monthly'),
    ('/apply-certification.html', '官方认证申请', 'Apply for certification', '0.6', 'monthly'),
    ('/dashboard.html', '开发者后台', 'Developer dashboard', '0.3', 'monthly'),
    ('/login.html', '开发者登录', 'Developer sign-in', '0.3', 'monthly'),
    ('/docs.html', '站点导航', 'Site navigation', '0.7', 'monthly'),
    ('/developer_docs.html', '开发者文档', 'Developer docs', '0.7', 'monthly'),
    ('/sdk-docs.html', '开发者 SDK 文档', 'Developer SDK docs', '0.7', 'monthly'),
    ('/tag.html', '标签专题', 'Tag explorer', '0.6', 'weekly'),
    ('/about.html', '关于我们', 'About', '0.7', 'monthly'),
    ('/game_rules.html', '游戏守则（当前版）', 'Game Rules (current)', '0.7', 'monthly'),
    ('/game_rules4-0-0.html', '游戏守则 4.0.0 留存', 'Game Rules 4.0.0 (archive)', '0.4', 'yearly'),
    ('/game_rules4-0-1.html', '游戏守则 4.0.1 留存', 'Game Rules 4.0.1 (archive)', '0.4', 'yearly'),
    ('/game_rules4-0-2.html', '游戏守则 4.0.2 留存', 'Game Rules 4.0.2 (archive)', '0.4', 'yearly'),
    ('/user_agreement.html', '用户协议', 'User Agreement', '0.5', 'monthly'),
    ('/legal_templates.html', '协议模板中心', 'Legal Template Center', '0.5', 'monthly'),
    ('/generic_eula.html', '通用用户协议', 'Generic EULA', '0.4', 'monthly'),
    ('/generic_privacy.html', '通用隐私政策', 'Generic Privacy Policy', '0.4', 'monthly'),
    ('/generic_tos.html', '通用服务条款', 'Generic Terms', '0.4', 'monthly'),
    ('/privacy.html', '隐私政策', 'Privacy Policy', '0.5', 'monthly'),
    ('/terms.html', '服务条款', 'Terms of Service', '0.5', 'monthly'),
    ('/copyright.html', '版权声明', 'Copyright', '0.5', 'monthly'),
    ('/404.html', '404 页面', '404 page', '0.3', 'yearly'),
]

# 有独立英文入口的页面（?lang=en）
LANG_EN_PAGES = [
    '/', '/game.html', '/play.html', '/favgames.html', '/gamecheck.html',
    '/stats.html', '/author.html', '/authorlevel.html', '/apply-certification.html',
    '/docs.html', '/developer_docs.html', '/sdk-docs.html', '/tag.html', '/about.html', '/game_rules.html',
    '/user_agreement.html', '/legal_templates.html', '/generic_eula.html',
    '/generic_privacy.html', '/generic_tos.html', '/game_rules4-0-1.html',
    '/game_rules4-0-2.html', '/privacy.html', '/terms.html', '/copyright.html',
    '/dashboard.html', '/login.html',
]


def load(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as f:
        return json.load(f)


def esc(s):
    return (s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            .replace('"', '&quot;'))


def abs_url(path):
    return SITE + path


def collect():
    games = load('lelegame_data.json')
    authors = load('authors/index.json')

    # 本地/站内游戏本体页：url 为站内绝对路径的那些
    game_bodies = []
    for g in games:
        url = (g.get('url') or '').strip()
        if url.startswith('/'):
            game_bodies.append((url, g['id'], g['name_zh'], g['name_en']))

    return games, authors, game_bodies


def write_xml(entries, lastmod):
    parts = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
             'xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for loc, prio, freq in entries:
        parts.append('  <url>\n'
                     f'    <loc>{esc(loc)}</loc>\n'
                     f'    <lastmod>{lastmod}</lastmod>\n'
                     f'    <changefreq>{freq}</changefreq>\n'
                     f'    <priority>{prio}</priority>\n'
                     '  </url>')
    parts.append('</urlset>\n')
    with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(parts))


CSS = (
    "body{font-family:-apple-system,'PingFang SC',sans-serif;max-width:1000px;"
    "margin:2rem auto;padding:0 1rem;line-height:1.7;color:#222}\n"
    "h1{font-size:1.6rem}h2{margin-top:2rem;border-bottom:2px solid #eee;padding-bottom:.3rem}\n"
    "table{border-collapse:collapse;width:100%;font-size:.9rem;table-layout:fixed}"
    "td,th{border:1px solid #e5e5e5;padding:6px 10px;text-align:left;"
    "overflow-wrap:anywhere;word-break:break-word}\n"
    "td:first-child,th:first-child{width:36%}\n"
    "th{background:#f7f7f7}a{color:#4a6cff;text-decoration:none;overflow-wrap:anywhere}"
    "a:hover{text-decoration:underline}code{color:#888;font-size:.85rem;overflow-wrap:anywhere}"
)


def row(title, url):
    return (f'<tr><td>{esc(title)}</td>'
            f'<td><a href="{esc(url)}">{esc(url)}</a></td></tr>')


def write_html(sections, total):
    out = ['<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">',
           '<meta name="viewport" content="width=device-width, initial-scale=1">',
           '<title>站点地图 · Sitemap · 了了了游戏</title>',
           '    <meta name="description" content="了了了游站点地图，包含全部页面与游戏入口。Sitemap of Lelele Game.">',
           f'<style>{CSS}</style>',
           '</head><body>',
           '<h1>🗺️ 站点地图 / Sitemap</h1>',
           f'<p>本站点共有 <b>{total}</b> 个可访问 URL。机器可读版本：'
           '<a href="sitemap.xml">sitemap.xml</a> · <a href="robots.txt">robots.txt</a></p>']
    for heading, rows_list in sections:
        out.append(f'<h2>{heading} <small>（{len(rows_list)}）</small></h2>'
                   '<table><tr><th>标题</th><th>URL</th></tr>')
        out.extend(rows_list)
        out.append('</table>')
    out.append('<div style="margin:24px 0 10px;text-align:center;font-size:.88rem;color:#64748b">'
               '<a href="user_agreement.html" style="color:#4a6cff">用户协议</a> · '
               '<a href="user_agreement.html?lang=en" style="color:#4a6cff">User Agreement</a> · '
               '<a href="legal_templates.html" style="color:#4a6cff">协议模板中心</a></div>')
    out.append('</body></html>')
    with open(os.path.join(ROOT, 'sitemap.html'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(out) + '\n')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--lastmod', default=datetime.date.today().isoformat())
    args = ap.parse_args()

    games, authors, game_bodies = collect()
    entries = []
    rows_static, rows_gamebody, rows_detail, rows_author, rows_lang = [], [], [], [], []

    for path, tzh, ten, prio, freq in STATIC_PAGES:
        entries.append((abs_url(path), prio, freq))
        rows_static.append(row(tzh, abs_url(path)))

    for path, gid, zh, en in game_bodies:
        entries.append((abs_url(path), '0.7', 'monthly'))
        rows_gamebody.append(row(f'游戏 {gid}: {zh} / {en}', abs_url(path)))

    for g in games:
        gid = g['id']
        entries.append((abs_url(f'/game.html?id={gid}'), '0.7', 'weekly'))
        entries.append((abs_url(f'/game.html?id={gid}&lang=en'), '0.6', 'weekly'))
        rows_detail.append(row(f'游戏详情 {gid}: {g["name_zh"]} / {g["name_en"]}',
                               abs_url(f'/game.html?id={gid}')))
        rows_detail.append(row(f'Game {gid}: {g["name_en"]}',
                               abs_url(f'/game.html?id={gid}&lang=en')))

    for a in sorted(authors, key=lambda x: x['id']):
        aid = a['id']
        entries.append((abs_url(f'/author.html?id={aid}'), '0.6', 'weekly'))
        entries.append((abs_url(f'/author.html?id={aid}&lang=en'), '0.5', 'weekly'))
        rows_author.append(row(f'作者 {aid}: {a["name_zh"]}', abs_url(f'/author.html?id={aid}')))
        rows_author.append(row(f'Author {aid}: {a["name_en"]}',
                               abs_url(f'/author.html?id={aid}&lang=en')))

    seen = {e[0] for e in entries}
    for path in LANG_EN_PAGES:
        loc = abs_url(path + ('&' if '?' in path else '?') + 'lang=en')
        if loc in seen:
            continue
        entries.append((loc, '0.5', 'monthly'))
        rows_lang.append(row(f'{path} (English)', loc))

    write_xml(entries, args.lastmod)
    write_html([
        ('静态页面 / Static pages', rows_static),
        ('本站游戏本体 / In-site game builds', rows_gamebody),
        ('游戏详情页 / Game detail (<code>game.html?id=N</code>)', rows_detail),
        ('作者页 / Author (<code>author.html?id=N</code>)', rows_author),
        ('多语言 / Language (?lang=en)', rows_lang),
    ], len(entries))

    print(f'sitemap.xml / sitemap.html 已生成：{len(entries)} 个 URL，lastmod={args.lastmod}')


if __name__ == '__main__':
    main()
