# ADR 0002 — Data flow pipeline

- **Status**: Accepted
- **Date**: 2026-01-22

## Context

The site serves Chinese summaries of ad-platform updates. We need a deterministic pipeline that:

1. Scrapes 53 official sources covering 40 platforms.
2. Filters to a specific date range (a single week or a calendar month).
3. Produces structured JSON the frontend can render without runtime AI.
4. Commits the output to git so deploys are reproducible.

Failure modes to design against: source-site outages, AI hallucination, date drift, duplicate items, off-topic CTAs.

## Decision

The pipeline runs in 5 stages, each idempotent and locally re-runnable:

```
┌─ Stage 1 ─ Scrape (scripts/scraper.py)
│   Playwright renders 53 URLs in parallel.
│   iframe pages get up to 3 retries with 90 s timeout.
│   A single source's failure does not abort the run.
│
├─ Stage 2 ─ Extract (scripts/ai_processor.py)
│   MiniMax M2.7 receives page text + link list + date range.
│   Returns JSON: title, titleOriginal, summary (CN), category,
│                 importance, tags, sourceUrl, date.
│   Hard rules in prompt: only items inside date range,
│                          no "Learn more" CTAs,
│                          API changelog same-day items merge.
│
├─ Stage 3 ─ Validate (scripts/validator.py + date_validator.py)
│   5 deterministic checks per weekly batch:
│     (1) all dates inside requested range
│     (2) no garbage / CTA titles
│     (3) ≥80% have non-empty Chinese summaries
│     (4) no HTML residue in title or summary
│     (5) every record has the required fields
│   A failure aborts the commit step.
│
├─ Stage 4 ─ Persist
│   data/weekly/YYYY-WNN.json   (week shard, ISO 8601)
│   data/monthly/YYYY-MM.md     (AI article-style report)
│   data/updates.json           (rolling full-history file)
│
└─ Stage 5 ─ Publish
    git commit + push  →  Vercel auto-deploys main
```

### Triggers (UTC → Beijing)

| Cron | Beijing time | Mode | Scope |
|---|---|---|---|
| `0 16 * * *` | 00:00 daily | `--mode=weekly --rolling-days=8` | Last 8 days (always current week) |
| `0 16 1 * *` | 00:00 day-1 | `--mode=both` | Weekly **and** previous-month report |
| `0 15 28-31 * *` | 23:00 month-end | `--mode=monthly` | Whole calendar month |

Beijing date is computed inside the workflow (see `daily-fetch.yml` step `Determine run mode`) so DST and month-end edge cases are handled in one place.

### Naming contract (immutable)

| Type | Format | Example | Notes |
|---|---|---|---|
| Weekly file | `YYYY-WNN.json` | `2026-W17.json` | ISO 8601 week. **Never** `M01` etc. |
| Monthly file | `YYYY-MM.md` | `2026-04.md` | Calendar month. |
| Update id | `{platform}-{YYYY-MM-DD}-{NNN}` | `tiktok-2026-04-24-001` | Stable across re-runs of the same date. |
| `week` field | `YYYY-WNN` | `2026-W17` | Computed via `isocalendar()`; matches the weekly filename. |

## Consequences

**Positive**

- Each stage can be re-run in isolation when debugging.
- A failed AI extraction never corrupts `data/updates.json` — Stage 4 only writes after Stage 3 passes.
- Re-running with `--mode=backfill` reproduces historical state deterministically because IDs are date-derived.

**Negative**

- A bug in Stage 2's prompt requires a re-run of all affected weeks.
- iframe scraping (TikTok API changelog) has ~70% success rate; the cron's 8-day rolling window is the recovery mechanism.

## Constraints this places on agents

- **Do not** add a Stage 6 (e.g., post-process AI rewriting) — every transform must live in an existing stage so the pipeline stays auditable.
- **Do not** write directly to `data/` from CI without going through `fetch_updates.py`.
- **Do not** invent new naming formats. ISO 8601 week is mandatory; the regex `\d{4}-W\d{2}` is enforced by `scripts/check_data_schema.py`.
- The `Stage 3` validator is the contract. Adding a field to `MediaUpdate` requires updating the validator AND the schema check script in the same commit.
