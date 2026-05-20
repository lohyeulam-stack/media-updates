# ADR 0003 — AI extraction & validation rules

- **Status**: Accepted
- **Date**: 2026-02-04
- **Related**: [0002-data-flow-pipeline.md](./0002-data-flow-pipeline.md)

## Context

MiniMax M2.7 produces all human-readable text on the site (titles, summaries, monthly reports). LLM output is non-deterministic. Without strong rules + post-validation, three failure modes recur:

1. **Date drift** — articles from 2025 leak into a 2026 weekly batch.
2. **CTA pollution** — "Learn more" / "Read more" / "Sign up" become titles.
3. **HTML residue** — markup leaks into `summary` and breaks Markdown rendering.

## Decision

### Weekly extraction prompt invariants (`scripts/ai_processor.py:extract_and_summarize`)

Every prompt change must preserve these clauses:

| Invariant | Why |
|---|---|
| "**Only** return articles dated inside `[week_start, week_end]`. Articles from 2025 or earlier MUST be excluded." | Prevents date drift. |
| "Exclude `Learn more`, `Read more`, `See more`, `View more`, `Get started`, `Sign up`, and similar CTA strings." | Prevents CTA pollution. |
| "API changelog entries with the same date and adjacent versions MUST be merged into a single record." | Avoids 50× duplicates from changelog pages. |
| "If `sourceUrl` is missing from the page text, fall back to the page URL." | Avoids null-link entries that the frontend cannot render. |
| Output is a JSON array — no prose preamble, no Markdown fences. | Required by the JSON parser. |

### Required output fields (per record)

```
id              string  e.g. "tiktok-2026-04-24-001"
date            string  YYYY-MM-DD, inside requested range
week            string  YYYY-WNN, ISO 8601, optional in extract step
platform        string  must be a registered Platform literal (see types.ts)
title           string  Chinese, ≤ 80 chars, no HTML, no CTA strings
titleOriginal   string  source-language original (optional but recommended)
summary         string  Chinese, ~200 chars, no HTML
category        string  one of: ad-product | api-change | policy | creative |
                                measurement | targeting | automation | other
importance      string  one of: high | medium | low
source          string  the human-readable source name
sourceUrl       string  absolute URL
tags            string[]  up to 5 short tags
fetchedAt       string  ISO timestamp set by the pipeline
```

### Five-round validator (`scripts/validator.py`)

Every weekly batch must pass all five before Stage 4 writes:

1. `dates_in_range` — every record's `date` ∈ `[week_start, week_end]`.
2. `no_garbage_titles` — no record has a CTA-like title.
3. `summaries_present` — at least 80% of records have a non-empty Chinese summary.
4. `no_html_in_text` — `title` and `summary` contain no `<` followed by an alpha character.
5. `valid_structure` — every required field is present and the right type.

Failure of any check aborts the commit step. The full failing record list is logged so a re-run can target the source.

### Monthly report rules (`scripts/ai_processor.py:generate_monthly_report`)

| Rule | Why |
|---|---|
| Output is Markdown, 2000–4000 Chinese characters. | Readable on phone + desktop without scrolling fatigue. |
| Open with a 100-character month overview. | Sets context above the fold. |
| Group by **platform category**, not platform — exactly one `##` heading per category that has updates. | Avoids 40 stub sections. |
| Each headline-worthy update is rendered as `[标题](sourceUrl)` inline. | Makes the report scannable + traceable. |
| **No** raw JSON, no `<` followed by alpha, no Chinese-and-English mixed in titles. | Validator round 2–4 enforce. |
| **Skip** categories with zero updates. | No "无更新" filler. |

## Consequences

**Positive**

- A single set of prompts is the source of behavioral truth. No "magic" post-processing.
- Re-runs are reproducible because the date filter is in the prompt + the validator, not in shifting page contents.

**Negative**

- Prompt edits ripple: a change to "exclude CTA" wording can re-introduce "Learn more" titles in the next run. Test against `scripts/oneshots/analyze.py` after every prompt change.

## Constraints this places on agents

- **Do not** remove any of the five validator checks. To loosen a check, add a new check that supersedes it and update this ADR.
- **Do not** ship a prompt change without re-running on at least one historical week and inspecting the diff in `data/weekly/`.
- **Do not** add a sixth `category` value without updating `src/lib/types.ts`, `scripts/check_data_schema.py`, and the relevant CI check together.
- **Do not** call `web_search` from within the AI prompt — it is non-functional in this MiniMax context.
