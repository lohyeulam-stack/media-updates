# ADR 0005 — Data schema contract

- **Status**: Accepted
- **Date**: 2026-02-25
- **Related**: [0002-data-flow-pipeline.md](./0002-data-flow-pipeline.md), [0003-ai-extraction-rules.md](./0003-ai-extraction-rules.md)

## Context

`data/updates.json` is read at build time by Next.js Server Components and rendered to HTML. Any field rename or type change without a corresponding code change produces a silent runtime crash — and the cron commits silently overwrite the previous good state.

We need a single, machine-checked contract.

## Decision

The contract has two layers, kept in lockstep:

1. **TypeScript** — `src/lib/types.ts` defines `MediaUpdate`. The frontend reads against this.
2. **Python check** — `scripts/check_data_schema.py` validates every JSON file in `data/`. CI runs it on every PR.

Any change to one layer that is not mirrored in the other is a contract violation and must fail the build.

### `MediaUpdate` (canonical shape)

| Field | Type | Required | Constraint |
|---|---|---|---|
| `id` | string | yes | `{platform}-{YYYY-MM-DD}-{NNN}`, unique across `updates.json` |
| `date` | string | yes | `YYYY-MM-DD` |
| `week` | string | optional | `YYYY-WNN` (ISO 8601 week); set by pipeline, not by AI |
| `platform` | string | yes | must be a key of `PLATFORM_META` |
| `title` | string | yes | non-empty, ≤ 200 chars, no HTML, no CTA strings |
| `titleOriginal` | string | optional | source-language original |
| `summary` | string | yes | non-empty Chinese (≥ 1 CJK char), no HTML |
| `category` | enum string | yes | `ad-product` \| `api-change` \| `policy` \| `creative` \| `measurement` \| `targeting` \| `automation` \| `other` |
| `importance` | enum string | yes | `high` \| `medium` \| `low` |
| `source` | string | yes | human-readable source name (e.g. "TikTok for Business Blog") |
| `sourceUrl` | string | yes | absolute http(s) URL |
| `imageUrl` | string \| null | optional | absolute URL or `null`; populated by `fetch_og_images.mjs` |
| `tags` | string[] | yes | 0–5 short tags |
| `fetchedAt` | string | yes | ISO 8601 timestamp |

### File-level invariants

- `data/updates.json` — JSON array, every entry conforms to `MediaUpdate`, all `id` values unique.
- `data/weekly/YYYY-WNN.json` — JSON array of `MediaUpdate`; every record's `week` field equals the filename stem.
- `data/monthly/YYYY-MM.md` — UTF-8 Markdown, between 500 and 20000 characters, contains at least one `[text](url)` link.
- `data/archive/**` — frozen historical snapshots; the schema check still applies.

### Where the contract lives

| File | Role |
|---|---|
| `src/lib/types.ts` | Single TypeScript source of truth. **Edit here first**, then mirror to Python. |
| `scripts/check_data_schema.py` | Single Python source of truth for runtime validation. Imports the canonical enums by re-declaring them — keep in sync manually. |
| `.github/workflows/harness-checks.yml` | Runs `check_data_schema.py` on every PR. |
| `scripts/validator.py` | Runs the same checks at pipeline time (Stage 3). |

## Consequences

**Positive**

- A renamed field cannot ship — both TS compile and Python schema check will fail before the data commit.
- New consumers (e.g. RSS feed in `src/app/feed.xml/route.ts`) can rely on field presence without defensive `?? ""` everywhere.

**Negative**

- TS and Python carry duplicated enum lists. Mitigation: both are checked against `PLATFORM_META` at CI time (already done in `ci.yml`).
- Adding a field is a 3-file change: `types.ts`, `check_data_schema.py`, `validator.py`. This friction is intentional.

## Constraints this places on agents

- **Do not** add a field to `MediaUpdate` without updating both `check_data_schema.py` and `validator.py` in the same commit.
- **Do not** loosen a constraint (e.g. allow `null` summary) without an ADR-supersession.
- **Do not** rename `id`, `date`, `platform`, `category`, `importance` — historical data uses these names; renaming silently breaks `data/archive/`.
