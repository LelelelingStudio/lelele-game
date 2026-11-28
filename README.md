# Lelele Game · 了了了游

> **Explore the undiscovered. Procrastinate with style.**
> A zero-build, fully static HTML5 mini-game platform — open a tab and play instantly. No download, no install, no account required.

🌐 **Live site:** [game.leleleling.site](https://game.leleleling.site) · 📦 **Repository:** [`LelelelingStudio/lelele-game`](https://github.com/LelelelingStudio/lelele-game)

---

## Table of Contents

- [At a Glance](#at-a-glance)
- [Features](#features)
- [Star History](#star-history)
- [Games & Submission](#games--submission)
- [Developer Ecosystem](#developer-ecosystem)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Privacy & Security](#privacy--security)
- [Rights](#rights)

---

## At a Glance

| | |
| --- | --- |
| Languages | Chinese (zh) + English (en), full UI |
| Build step | **None.** No framework, no bundler, no server-side code |
| Deployment | Push to `main` → GitHub Pages → Cloudflare |
| Account | Optional — players need none; creators sign in to manage their works |

---

## Features

### Playing

- **Instant play, no install.** Every title is a link or a bundled HTML5 page. Clicking **Start Game** opens a standalone, dependency-free **player** with a simulated browser shell (traffic-light dots, address bar, reload / fullscreen / close controls). Same-origin games load in a clean frame with site chrome hidden; games can still use browser local storage for saves. External sites that block embedding show a graceful **"Open in new tab ↗"** fallback.
- **Rich detail pages:** banner, screenshots, videos, bilingual descriptions, versioned update logs, author card, age rating, category, legal-agreement access, favourites, and cyclic previous / next navigation.
- **Discovery:** pinyin-aware fuzzy search, category / tag filters, weighted-random ordering, personalised "For You" picks, "continue playing", a watchlist, hidden gems, and a hand-curated ranking.
- **Leaderboards:** top games by popularity, per-game global high scores, favourites and play leaderboards, and a visual stats dashboard.
- **Score sharing:** generate a shareable result link with your nickname and score, with a destination to try the game.
- **Bilingual + dark mode:** full Chinese/English text toggling and design-token-driven theming.
- **PWA / offline:** installable on mobile and desktop with separate Chinese and English manifests.

### Compliance built in

Platform-level user agreement, privacy policy and terms, plus a legal-template center and per-game agreement links. Missing game agreements fall back to platform generic documents. See the [Legal Template Center](legal_templates.html), [privacy](privacy.html), [terms](terms.html) and [copyright](copyright.html) pages.

### Creator tooling

- Sign in to manage your games and view statistics.
- Official certification (Lv.1–6) with independent **Official** and **Studio Special** badges.
- Targeted in-site developer notices for review results and release announcements.
- A **developer SDK** to add leaderboards, ratings, score sharing and game navigation to your game with a single script — see the [SDK docs](sdk-docs.html).

---

## Star History

<a href="https://www.star-history.com/?repos=lelelelingstudio%2Flelele-game&type=date&legend=top-left">
<picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=lelelelingstudio/lelele-game&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=lelelelingstudio/lelele-game&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=lelelelingstudio/lelele-game&type=date&legend=top-left" loading="lazy">
</picture>
</a>

If this project makes your coffee break better, a ⭐ on GitHub is the easiest way to support it — no account, no payment, no tracking.

---

## Games & Submission

To submit a game, use the **Game Submission** form linked from the site (Tally). Please read [Game Rules 5.1.0](game_rules.html) first — in particular the mandatory legal-agreement clause: link submissions must provide their own EULA / privacy / terms URLs, while code submissions may use the platform's generic agreements. Missing agreements block review.

Submissions are reviewed by humans. Submission emails and personal details are never committed to this repository. For AI-assisted submissions, contact the maintainers for the required format.

---

## Developer Ecosystem

- **Sign in** to the creator area to manage your works and read per-game statistics.
- **Certification levels Lv.1–6** and the independent **Official** / **Studio Special** badges are described in the developer docs. Applications go through a form; results are delivered by email plus an in-site notice.
- **Developer notices** are targeted, prioritised and time-windowed, and can be dismissed per user.
- **Developer SDK:** one script gives your game leaderboards, ratings, nickname, score-share links and similar-game navigation. Full reference at [sdk-docs.html](sdk-docs.html).

---

## Deployment

Pure static hosting: **push to `main` → GitHub Pages publishes → Cloudflare serves** `game.leleleling.site`. There is no install, no compile, no environment variable and no CDN build to wait for.

---

## Documentation

| Document | Purpose |
| --- | --- |
| [`docs.html`](docs.html) | Human-facing docs index |
| [`developer_docs.html`](developer_docs.html) | Developer guide, including the public stats API |
| [`sdk-docs.html`](sdk-docs.html) | Developer SDK reference and examples |
| [`changelog.json`](changelog.json) / [`about.html`](about.html) | Full bilingual release history |
| [`llms.txt`](llms.txt) | Agent-facing platform brief (no source reading needed) |
| [`game_rules.html`](game_rules.html) | Game rules 5.1.0 |
| [`legal_templates.html`](legal_templates.html) | Free bilingual legal-document generator |
| [`stats.html`](stats.html) / [`favgames.html`](favgames.html) / [`gamecheck.html`](gamecheck.html) | Stats dashboard / favourites leaderboard / play leaderboard |

---

## Contributing

Contributions are welcome and do **not** require a toolchain:

1. ⭐ Star the repository (see [Star History](#star-history)).
2. 🐛 Report bugs or suggest games through the site's feedback / recommendation forms.
3. 🎮 Submit a game via the submission form, following [Game Rules 5.1.0](game_rules.html).
4. 🛠 For code changes: keep the zero-build constraint, add both Chinese and English copy, use design tokens for colours, use root-absolute asset paths, and sanitise any user-supplied HTML.

---

## Privacy & Security

- Contact emails, personal websites, and certification evidence from submissions are **never stored in this public repository**; only public names, ids, levels and works are published.
- All dynamically inserted user content is escaped or sanitised; external links open with `rel="noopener noreferrer"`.
- No credentials are hardcoded in the site — anything sensitive is entered at runtime and never committed.
- Third-party services are called from the browser; this repository ships no server-side implementation of them.

---

## Rights

All rights to the platform source and design are reserved by **Leleleling Studio · 了了了岭工作室**. Game submissions remain the property of their respective authors; see the [Game Rules](game_rules.html) and [Copyright Complaints](copyright.html) pages. A bundled third-party component retains its own upstream notice in `LSFP-NOTICE.txt`.

---

© 2026 Leleleling Studio · 了了了岭工作室 · *Explore the undiscovered*
