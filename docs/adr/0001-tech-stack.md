# ADR 0001 — Tech stack

- **Status**: Accepted
- **Date**: 2026-01-15 (codified retroactively 2026-05-20)
- **Supersedes**: legacy-vite prototype (Vite + plain React)

## Context

The TopTou product team needs a low-maintenance, public-readable site that aggregates ad-platform updates. Constraints:

- The data pipeline is Python-only (Playwright + MiniMax SDK is mature in Python).
- The site must be free to host and survive zero traffic for weeks.
- The repo must be public (Vercel free tier does not deploy private repos).
- Page count is small (homepage + ~3 dynamic routes); SSG/ISR is sufficient.
- Content is Chinese-first; SEO is not a goal.

## Decision

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 16 App Router + TypeScript + React 19** | App Router is the supported path; Server Components let us read JSON at build time without an API layer. |
| Styling | **Tailwind CSS v4 + shadcn/ui + base-ui** | v4 has zero-config + faster cold builds; shadcn copies code into the repo so we own it. |
| Data store | **Plain JSON files in `data/`** committed to git | One source of truth; no DB to provision; PR diffs show data drift. |
| Pipeline | **Python 3.12 + Playwright + MiniMax M2.7** | Playwright handles iframe + JS rendering reliably; MiniMax has competitive Chinese summarization at low cost. |
| Automation | **GitHub Actions (cron)** | Free for public repos; commits trigger Vercel auto-deploy — no extra orchestration layer. |
| Deployment | **Vercel (auto-deploy on `main`)** | Free; matches Next.js; no infra-as-code burden. |

## Consequences

**Positive**

- Editing `data/updates.json` directly is auditable in git history.
- A single `git push` redeploys both code and data.
- No secrets needed at build time (only at fetch time).

**Negative**

- `data/updates.json` size grows linearly; if it exceeds ~5 MB, switch to per-month sharding.
- GitHub Actions cron skew can be ±15 min; not suitable for time-critical pages.
- No private mode — anything in `data/` is public.

## Constraints this places on agents

- **Do not** introduce a database, API server, or build-time API call.
- **Do not** downgrade or replace Next.js, Tailwind, or shadcn without a superseding ADR.
- **Do not** add Vite, Webpack overrides, or alternate React renderers.
- All site data must come from files inside `data/`. Cross-build-time `fetch()` to live URLs is forbidden.
