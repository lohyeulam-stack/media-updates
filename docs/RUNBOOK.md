# Runbook — operational commands & troubleshooting

> Architecture decisions live in [`docs/adr/`](./adr/). This file is for "how do I do X right now?"

## Local commands

```bash
# Frontend
npm run dev                # http://localhost:3000
npm run build              # production build (also: typecheck via Next)
npm run lint               # eslint
npm run typecheck          # tsc --noEmit
npm test                   # Playwright e2e (run `npm run build` first)

# Pipeline (Windows users: replace `python` with `py`)
python scripts/fetch_updates.py --mode=weekly --current-week     # this week
python scripts/fetch_updates.py --mode=weekly --rolling-days=8   # last 8 days (cron default)
python scripts/fetch_updates.py --mode=monthly                   # current month report
python scripts/fetch_updates.py --mode=both --rolling-days=8     # weekly + last-month report
python scripts/fetch_updates.py --mode=backfill \
    --backfill-year=2026 --backfill-start=1 --backfill-end=4     # historical fill

# Harness checks (mirror what CI runs)
python scripts/check_data_schema.py
python scripts/check_arch_layers.py
```

## Required env vars

| Var | Where | Why |
|---|---|---|
| `MINIMAX_API_KEY` | local `.env`, GitHub Secrets | AI extraction + monthly report |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | Vercel project | Analytics (optional) |

## Triggers (production)

| When (Beijing) | Workflow | Mode |
|---|---|---|
| 00:00 every day | `daily-fetch.yml` | `weekly --rolling-days=8` |
| 00:00 day-1 of month | `daily-fetch.yml` | `both --rolling-days=8` (also previous-month report) |
| 23:00 month last day | `daily-fetch.yml` | `monthly` |
| Every PR | `ci.yml` + `harness-checks.yml` | lint, typecheck, build, schema, arch |

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| TikTok API Changelog returns 0 rows | iframe load timeout | Re-run; the cron's 8-day rolling window catches it next day. Retry budget is 3 × 90 s in `scraper.py`. |
| 2025-dated articles in a 2026 batch | AI date filter slipped | Inspect the prompt clauses listed in [ADR 0003](./adr/0003-ai-extraction-rules.md); validator round 1 should have caught this — check it ran. |
| `"Learn more"` titles | CTA filter regression | Append the new pattern to `CTA_GARBAGE` in `scripts/validator.py` and the prompt's exclusion list. |
| Monthly report has no hyperlinks | AI ignored `[text](url)` requirement | Verify `MONTHLY_REPORT_PROMPT` still contains the inline-link clause from ADR 0003. |
| `npm run build` fails on Vercel | repo went private | Vercel free tier rejects private repos. Set repo back to public. |
| Weekly file named `M01.json` | Backfill used month code as week | Use `isocalendar()` — re-read ADR 0002 §"Naming contract". |
| `harness-checks.yml` fails on `PLATFORM_META missing source platforms` | New `Platform` literal without source | Follow [ADR 0006](./adr/0006-platform-source-registration.md). |
| `harness-checks.yml` fails on `arch layer violation` | TSX file imported `data/` directly or client component imported `lib/data.ts` | Fix per [ADR 0004](./adr/0004-dependency-layers.md). |

## When something else breaks

1. Read the error. Most failure messages here are written to be the fix.
2. Check the relevant ADR.
3. If it's not in the ADR and not in this runbook, ask the user before improvising.
