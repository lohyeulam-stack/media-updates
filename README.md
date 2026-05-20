# Media Updates

Weekly tracker for ad-platform releases across **40 platforms / 53 official sources**, summarized in Chinese by MiniMax, rendered as a Next.js site, and refreshed daily by GitHub Actions.

- **Live**: <https://media-updates.vercel.app>
- **Repo**: <https://github.com/lohyeulam-stack/media-updates> (public — Vercel free tier requirement)

## What's here

| Path | Purpose |
|---|---|
| `src/app/` | Next.js 16 App Router site (homepage, `/weekly/[w]`, `/report/[m]`, `/platform/[p]`) |
| `src/lib/` | Shared types, data accessors, monitoring helpers |
| `scripts/` | Python data pipeline (Playwright scrape → MiniMax extract → validate → write JSON) |
| `data/` | Source of truth: `updates.json` + `weekly/*.json` + `monthly/*.md` |
| `docs/adr/` | Architecture Decision Records — read these before changing structure |
| `docs/RUNBOOK.md` | Operational commands + troubleshooting |
| `.github/workflows/` | `ci.yml` (PR gate), `daily-fetch.yml` (Beijing 00:00 + month-end), `harness-checks.yml` (schema + layers) |
| `legacy-vite/` | Deprecated pre-Next.js prototype — do not edit |

## Setup

```bash
# Frontend
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit

# Python pipeline (Windows: use `py`, macOS/Linux: use `python3`)
pip install -r scripts/requirements.txt
python -m playwright install chromium

# Run the pipeline locally (requires MINIMAX_API_KEY)
export MINIMAX_API_KEY="..."
python scripts/fetch_updates.py --mode=weekly --current-week
```

See [`.env.example`](./.env.example) for required environment variables.

## How it ships

1. GitHub Actions runs `daily-fetch.yml` at 16:00 UTC (Beijing 00:00) — scrapes, extracts, validates, commits to `data/`.
2. The data commit triggers Vercel's auto-deploy on `main`.
3. Pull requests run `ci.yml` + `harness-checks.yml` (lint, build, schema, dependency-layer rules).

Detailed flow: [`docs/adr/0002-data-flow-pipeline.md`](./docs/adr/0002-data-flow-pipeline.md).

## Where to start as a contributor

| If you want to… | Read |
|---|---|
| Add a new ad platform / source URL | [`docs/adr/0006-platform-source-registration.md`](./docs/adr/0006-platform-source-registration.md) |
| Change the AI extraction prompt | [`docs/adr/0003-ai-extraction-rules.md`](./docs/adr/0003-ai-extraction-rules.md) |
| Add a frontend page or component | [`docs/adr/0004-dependency-layers.md`](./docs/adr/0004-dependency-layers.md) |
| Modify the JSON data shape | [`docs/adr/0005-data-schema-contract.md`](./docs/adr/0005-data-schema-contract.md) |
| Coordinate with AI agents working on this repo | [`AGENTS.md`](./AGENTS.md) |

## License & ownership

Internal tool for the TopTou product team. Public repository for Vercel-free-tier deployment, but not licensed for external use.
