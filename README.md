# Lelele Game · 了了了游

> **Explore the undiscovered. Procrastinate with style.**
> A zero-build, fully static HTML5 mini-game platform — open a tab and play instantly. No download, no install, no account required.

🌐 **Live site:** [game.leleleling.site](https://game.leleleling.site) · 📦 **Repository:** [`LelelelingStudio/lelele-game`](https://github.com/LelelelingStudio/lelele-game) · 📄 **License:** Apache-2.0

---

## Table of Contents

- [At a Glance](#at-a-glance)
- [Features](#features)
- [Star History](#star-history)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Repository Layout](#repository-layout)
- [Data Contracts](#data-contracts)
- [Games & Submission](#games--submission)
- [Developer Ecosystem](#developer-ecosystem)
- [Admin Console](#admin-console)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Privacy & Security](#privacy--security)
- [License](#license)

---

## At a Glance

| | |
| --- | --- |
| Games in catalog | **32** (17 local · 12 external · 3 internal) |
| Registered authors | **10** (id 1–10) |
| Pages | **25** root HTML pages + **12** bundled game directories |
| Languages | Chinese (zh) + English (en), full UI |
| Site version (changelog) | **4.3.0** · [Game Rules](game_rules.html) **5.0.0** |
| Service Worker cache | `lelele-pwa-v1.23` |
| Build step | **None.** No framework, no bundler, no `package.json`, no server-side code |
| Deployment | Push to `main` → GitHub Pages → Cloudflare (`CNAME`) |

---

## Features

### Playing

- **Instant play, no install.** Every title is a link or a bundled HTML5 page. Clicking **Start Game** on [`game.html`](game.html) opens [`play.html?id=N`](play.html) — a standalone, dependency-free **player** with a simulated browser shell (traffic-light dots, address bar, reload / fullscreen / close controls). Same-origin games load in a clean `<iframe>` with `?embed=1` so the site's footer and seasonal decorations stay out of the frame; games can still use `localStorage` for saves. External sites that block embedding show a graceful **"Open in new tab ↗"** fallback. The shell is bilingual with a built-in language toggle.
- **Three catalog types:** `local` (game code bundled under `/game/<slug>/`), `external` (linked to an author-deployed site), and `internal` (a page served inside the platform).
- **Rich detail pages:** banner, screenshots, videos, bilingual descriptions and summaries, versioned update logs, author card, age rating, category, legal-agreement rail, favourites, and cyclic **previous / next** navigation shared with author pages.
- **Search & discovery:** pinyin-aware fuzzy search (self-hosted `vendor/pinyin-pro.js`), category / age filters, weighted scoring, highlighted matches, and a 500-result cap with a 25-author sub-list.
- **Leaderboards:** Top-3 and full rank modal fed by the analytics API, refreshed every 5 minutes.
- **Site-wide announcements:** date-windowed, sanitised rich text with bold, images, and `<video>`; pinned announcements, a 3-day modal cache, and 24-hour per-item mute.
- **Bilingual + dark mode:** `.zh-inline` / `.en-inline` text toggles, `data-lang` persistence, system-preference detection, and design-token-driven theming.

### Platform

- **PWA / offline:** an installable web app with Chinese and English manifests. The Service Worker uses three explicit strategies — stale-while-revalidate for static assets, network-first with a 1.5 s timeout and cache fallback for data JSON, and pass-through for external origins. Cache keys normalise `?t=` cache-busters to avoid unbounded cache growth.
- **LSFP images:** a custom compound-suffix image format (`name.png.lsfp`) with automatic, transparent fallback to the original `.png/.jpg`, so a missing or unsupported `.lsfp` never produces a broken image. Served from the `gamepic.surge.sh` image host with a project-wide CORS policy.
- **Compliance built in:** [`user_agreement.html`](user_agreement.html), three platform generic agreements ([EULA](generic_eula.html) / [Privacy](generic_privacy.html) / [Terms](generic_tos.html)) backed by a single shared `legal_generic.js` source, a [Legal Template Center](legal_templates.html) with five zero-dependency export formats, per-game `legal_urls`, archived versions of the Game Rules, and [copyright](copyright.html) / [privacy](privacy.html) / [terms](terms.html) pages.
- **Resilient loading:** a shared `window.leleleFetch` with an 8-second `AbortController` timeout, lazy Tally iframe mounting with an 8-second fallback, and a `boot.js` bootstrap that never lets a stalled third-party script block `DOMContentLoaded`.

### Creator tooling

- **Supabase Auth** login, a [developer dashboard](dashboard.html), and an "Update a Game" self-service entry.
- **Official certification** (Lv.1–6) with independent **Official** and **Studio Special** badges; author pages combine the registry data with editable `profiles` (display name, bio, avatar, role).
- **Targeted developer notices** ([`noticetodeveloper.json`](noticetodeveloper.json)) filtered by author id, time window, priority, and read state — used for review results and release notifications.

---

## Star History

<a href="https://www.star-history.com/?repos=lelelelingstudio%2Flelele-game&type=date&legend=top-left">
<picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=lelelelingstudio/lelele-game&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=lelelelingstudio/lelele-game&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=lelelelingstudio/lelele-game&type=date&legend=top-left" / loading="lazy">
</picture>
</a>

If this project makes your coffee break better, a ⭐ on GitHub is the easiest way to support it — no account, no payment, no tracking.

---

## Architecture & Tech Stack

This repository contains **only browser-side code and static data**. There is no `api/`, `lib/`, `supabase/`, `functions/` or `migrations/` directory: the "backend" is a set of external services that the browser talks to directly.

| Layer | Technology | Notes |
| --- | --- | --- |
| Pages | Plain HTML + inline `<script>` | 25 root pages; no templating, no framework |
| Styles | [`common.css`](common.css) tokens + [`effects.css`](effects.css) + per-page `<style>` | Apple-style whitespace, glassmorphism, pill buttons; colours only via CSS tokens |
| Logic | Vanilla JS, IIFEs + `window.*` globals | [`boot.js`](boot.js) bootstrap, [`common.js`](common.js) shared layer, [`index.js`](index.js) homepage |
| Data | Static JSON files | Edited by hand or written by the admin console's Action; **no database in this repo** |
| Accounts | Supabase Auth + Postgres `profiles` | Developer ecosystem only; players need no account |
| Forms | Tally (embedded iframes) | Submission, recommendation, certification, game updates, feedback |
| Analytics | Edgemetry (primary) + Umami (fallback) | `leleleTrack()` wrapper; leaderboard data source |
| Bot check | Self-hosted reCAPTCHA service | `recaptcha.leleleling.site/api/captcha` |
| Images | LSFP + legacy fallback | `gamepic.surge.sh`, requires its `CORS` file |
| Offline | Service Worker + manifests | See [`sw.js`](sw.js) |
| Hosting | GitHub Pages + Cloudflare | [`CNAME`](CNAME) → `https://game.leleleling.site` |

**Project rules that keep it maintainable:** zero build step; bilingual copy for every user-facing string; root-absolute paths for all site assets (`/common.css`, `/index.html`) so nested URLs and the `404.html` fallback behave; all user-submitted HTML sanitised; and contact information never committed to this public repository.

> **Note on the author registry:** as of **2026-11-14**, `authors.surge.sh` is retired. [`authors/index.json`](authors/index.json) in this repository is the **single authoritative source** for author ids, names, levels, badges, and Supabase `uuid` mappings. `boot.js`, `common.js`, and `notice.js` all read the same-origin `/authors/index.json`; the old 30-minute Surge sync workflow was removed. Supabase `profiles` still supplies only editable profile fields (bio, display name, avatar, role).

---

## Repository Layout

```
lelele-game/
├── index.html, index.js            # Homepage: catalog, search, announcements
├── game.html                      # Game detail page (Start Game → play.html?id=N)
├── play.html                      # Standalone player: clean browser shell, ?id= lookup, embed=1, localStorage saves
├── author.html, dashboard.html    # Author profile / developer dashboard
├── login.html, gamecheck.html     # Auth / leaderboard
├── game/                          # 12 bundled game directories + game/data/<id>.json
├── authors/
│   ├── index.json                 # Authoritative author registry (10 entries)
│   └── data/<id>.json             # {"games_count": n}, auto-recomputed
├── boot.js, common.js             # Bootstrap + shared layer (auth, i18n, announcements, footer)
├── common.css, effects.css        # Design tokens + visual effects
├── notice.js                      # Targeted developer notices
├── pager-nav.js                   # Cyclic prev/next navigation
├── lsfp.js, lsfp-adapter.js       # LSFP decoder + transparent image fallback
├── sw.js, manifest-*.json         # Offline / PWA
├── lelegame_data.json             # Master game list (32 entries)
├── announcements.json             # Site-wide announcements
├── noticetodeveloper.json         # Targeted developer notices
├── changelog.json                 # Bilingual release notes (about.html)
├── activity_whole.json            # Event / seasonal configuration
├── special_common.json            # Effect skip-lists
├── *_agreement / generic_*.html   # Legal & compliance pages
├── game_rules*.html               # Game Rules 5.0.0 + archived versions
├── github/admin.html              # Station-owner admin console
├── .github/
│   ├── workflows/admin-apply.yml  # Only workflow: validate & write static JSON
│   └── scripts/admin-apply.mjs    # Six generators + validation + games_count recompute
│   └── scripts/admin-apply.test.mjs
├── foraisthings.md                # AI / collaborator takeover handbook (very detailed)
├── GAME_ENTRY_TEMPLATE.md         # JSON output spec for new game submissions
├── AUTHOR_CERTIFICATION.md        # Certification levels Lv.1–6 and badge rules
├── thoughts.md / plan.md          # Upgrade idea backlog / historical audit archive
├── CNAME, robots.txt, sitemap.*   # Deployment & indexing
├── scripts/
│   ├── check-precache.mjs         # Verifies every ASSETS_TO_CACHE path exists
│   └── gen-sitemap.py             # Rebuilds sitemap.xml / sitemap.html from real data
└── LICENSE                        # Apache-2.0
```

---

## Data Contracts

All content lives in plain JSON. The admin console never writes directly: it dispatches an event, and a GitHub Action validates the payload before touching any file.

| File | Contents | Maintained by |
| --- | --- | --- |
| `lelegame_data.json` | Master list: `id`, bilingual names, icon, category, `type`, age rating, `author` (string), `url` | Admin console / maintainer |
| `game/data/<id>.json` | Detail: banner, screenshots, videos, descriptions, bilingual update logs, `legal_urls`, `authorName` | Admin console |
| `authors/index.json` | **Authoritative** authors: `id`, `uuid?`, `name_zh`, `name_en`, `authorlevel?` (1–6), `official?`, `studio_special?` | Admin console (add / edit author) |
| `authors/data/<id>.json` | `{"games_count": n}` | Recomputed from the master list by `admin-apply.mjs` |
| `announcements.json` | `id`, bilingual titles + rich-text bodies, `publishDate`, `expireDate` | Admin console |
| `noticetodeveloper.json` | `version`, `updatedAt`, `notices[]` (target author, priority, time window, media, buttons) | Admin console |
| `changelog.json` | Bilingual release notes | Maintainer |
| `activity_whole.json`, `special_common.json` | Seasonal events / effect skip-lists | Maintainer |

Validation is deliberately strict and runs **server-side, in the Action**, because the browser payload is untrusted: ids must be unique, author ids must already exist, bilingual fields are mandatory, URLs must be `https` or same-site paths, dates must be `YYYY-MM-DD`, rich text is checked for dangerous tags, and privacy-sensitive strings (emails, personal sites) are rejected. A failed validation writes **no files**.

---

## Games & Submission

**Current catalog:** 32 titles — 17 `local`, 12 `external`, 3 `internal`. New entries are appended to `lelegame_data.json` with a matching `game/data/<id>.json`, then run `python3 scripts/gen-sitemap.py` so `sitemap.xml` / `sitemap.html` stay in sync.

To submit a game, use the **Game Submission** form linked from the site (Tally). Please read [Game Rules 5.0.0](game_rules.html) first — in particular clause **4.6 (Mandatory Legal Agreements)**: link submissions must provide their own EULA / privacy / terms URLs, while code submissions may use the platform's generic agreements. Missing agreements block review.

For AI-assisted or scripted submissions, [`GAME_ENTRY_TEMPLATE.md`](GAME_ENTRY_TEMPLATE.md) defines the exact JSON shape (bilingual category mapping, video rules, `legal_urls`, `authorName`, update-log object arrays). Reviews are human; submission emails and personal details are never committed to this repository.

---

## Developer Ecosystem

- **Sign in** via Supabase Auth; the dashboard lists the games tied to your author `uuid` and offers a self-service "Update a Game" form.
- **Certification levels Lv.1–6** and the independent **Official** / **Studio Special** badges are documented in [`AUTHOR_CERTIFICATION.md`](AUTHOR_CERTIFICATION.md). Applications go through a Tally form; results are delivered by email plus an in-site developer notice.
- **Author pages** render instantly from the same-origin registry (stale-while-revalidate) and overlay editable Supabase `profiles` data. `games_count` is derived from the catalog, not stored manually.
- **Developer notices** are targeted by author id (or `all`), ordered by priority, time-windowed, and dismissed once per user by default.

---

## Admin Console

[`github/admin.html`](github/admin.html) is a single-file, zero-dependency internal tool (publicly reachable but guarded by a fine-grained GitHub PAT stored only in the browser). It turns "hand-edit five JSON files" into **pick an action → fill a form → preview → dispatch**.

**Six actions, all enabled:**

| Action | Writes |
| --- | --- |
| ➕ Add game | `lelegame_data.json` + `game/data/<id>.json` |
| ✏️ Update game | Same two files, `url` synced in both |
| 📢 Add announcement | `announcements.json` |
| 🔔 Add developer notice | `noticetodeveloper.json` (`version` +1) |
| 👤 Add author | `authors/index.json` (sorted by id) |
| 🛠 Edit author | `authors/index.json` (prefilled by id; preserves `uuid` when left blank) |

It supports both a **form mode** and a **JSON mode** (paste a payload straight from a review AI), a **live effect preview** (announcement card / game card / notice modal / author card) using the same HTML sanitiser and LSFP hydration as production, and a collapsible raw payload view.

**Flow:** `POST /dispatches` (`repository_dispatch`, type `admin-apply`) → [`admin-apply.yml`](.github/workflows/admin-apply.yml) → [`admin-apply.mjs`](.github/scripts/admin-apply.mjs) validates and writes → a **draft PR** is opened for human review (or, if "direct push to main" is enabled, a rebased direct push). Every run also recomputes all `authors/data/<id>.json` game counts and removes orphaned files. Node's built-in test runner covers the generators (`admin-apply.test.mjs`).

> ⚠️ **Draft PR mode is the default.** A green Action run means the files were generated on a branch — you still have to merge the PR before anything changes on the live site (or enable "direct push to main").

---

## Deployment

Pure static hosting: **push to `main` → GitHub Pages publishes → Cloudflare serves** `game.leleleling.site` via the `CNAME` file. There is no install, no compile, no environment variable, and no CDN build to wait for. `admin-apply.yml` is the repository's only workflow.

The only build-adjacent concern is the **Service Worker**: when cached asset lists or cache structure change, `CACHE_NAME` in `sw.js` must be bumped so clients reinstall and purge stale caches. Data JSON requests are network-first with a 1.5-second cache fallback, so content edits propagate without a version bump.

---

## Documentation

| Document | Purpose |
| --- | --- |
| [`foraisthings.md`](foraisthings.md) | **Takeover handbook** for a zero-context AI or collaborator: architecture, data contracts, external services, SOPs, known pitfalls, release checklist |
| [`GAME_ENTRY_TEMPLATE.md`](GAME_ENTRY_TEMPLATE.md) | JSON output specification for adding a game |
| [`AUTHOR_CERTIFICATION.md`](AUTHOR_CERTIFICATION.md) | Certification levels, badge semantics, application flow |
| [`changelog.json`](changelog.json) / [`about.html`](about.html) | Full bilingual release history |
| [`docs.html`](docs.html) | Human-facing docs index |
| [`developer_docs.html`](developer_docs.html) | Developer guide, including the public stats API chapter |
| [`llms.txt`](llms.txt) | Agent-facing platform brief: data contracts, public API, event names, embedding rules - no source reading needed |
| [`stats.html`](stats.html) / [`favgames.html`](favgames.html) / [`gamecheck.html`](gamecheck.html) | Live stats dashboard / favorites leaderboard / play leaderboard (CSV export on both) |
| [`thoughts.md`](thoughts.md) / [`plan.md`](plan.md) | Prioritised upgrade backlog / historical audit archive |
| [`LSFP-NOTICE.txt`](LSFP-NOTICE.txt) | Upstream notice and Apache-2.0 text for the bundled `lsfp.js` |

---

## Contributing

Contributions are welcome and do **not** require a toolchain:

1. ⭐ Star the repository (see [Star History](#star-history)).
2. 🐛 Report bugs or suggest games through the site's feedback / recommendation forms.
3. 🎮 Submit a game via the submission form, following [Game Rules 5.0.0](game_rules.html) and [`GAME_ENTRY_TEMPLATE.md`](GAME_ENTRY_TEMPLATE.md).
4. 🛠 For code changes: keep the zero-build constraint, add both Chinese and English copy, use design tokens for colours, use root-absolute asset paths, sanitise any user-supplied HTML, and never commit personal contact information. Run the Node tests for `admin-apply.mjs` if you touch the Action.

---

## Privacy & Security

- Contact emails, personal websites, and certification evidence from submissions are **never stored in this public repository**; only public names, ids, levels, and works are committed.
- All dynamically inserted user content is escaped or passed through `sanitizeAnnouncementHtml()`; external links open with `rel="noopener noreferrer"`.
- The admin console contains **no hardcoded secrets** — the PAT is pasted at runtime and kept only in browser `localStorage`. All writes use the repository's own `GITHUB_TOKEN` inside Actions. `robots.txt` disallows `/github/admin.html`.
- External services (Supabase, Tally, reCAPTCHA, analytics, the image host) are called from the browser; this repository ships no server-side implementation of them.

---

## License

Licensed under the **Apache License 2.0** — see [LICENSE](LICENSE). The bundled `lsfp.js` retains its upstream notice in [LSFP-NOTICE.txt](LSFP-NOTICE.txt). Game submissions remain the property of their respective authors; see the [Game Rules](game_rules.html) and [Copyright Complaints](copyright.html) pages.

---

© 2026 Leleleling Studio · 了了了岭工作室 · *Explore the undiscovered*
