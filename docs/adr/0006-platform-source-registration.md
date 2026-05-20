# ADR 0006 — Platform & source registration

- **Status**: Accepted
- **Date**: 2026-03-08
- **Related**: [0004-dependency-layers.md](./0004-dependency-layers.md), [0005-data-schema-contract.md](./0005-data-schema-contract.md)

## Context

Adding a new ad platform or a new URL for an existing platform is the most common change to this repo. Without a checklist, half the PRs ship missing one of: the source-config entry, the type literal, the platform metadata, or the sidebar grouping.

## Decision

Adding a **new source URL for an existing platform** requires two edits:

1. Append an entry to `SOURCES` in `scripts/sources_config.py` with all required keys:
   ```python
   {
       "platform": "<platform-key>",       # must already exist in PLATFORM_META
       "name": "<human-readable name>",
       "url": "<absolute https URL>",
       "wait_ms": 5000,                    # bump to 8000+ for heavy SPAs
       "category": "<existing category>",
       # Optional flags:
       # "use_iframe": True,               # required for sites that frame their changelog
       # "no_enrich": True,                # skip OG-image fetch (e.g. iframe pages)
       # "has_rss": True,                  # use RSS path before falling back to scrape
   }
   ```
2. Re-run `python scripts/fetch_updates.py --mode=weekly --current-week` and verify at least one record is extracted.

Adding a **new platform** requires four edits, all in the same commit:

1. Append to `SOURCES` (as above).
2. Add the platform key to the `Platform` union in `src/lib/types.ts`.
3. Add an entry to `PLATFORM_META` with `label`, `color`, and `group`. Pick `group` from: `social` | `search` | `video` | `asia` | `dsp` | `cn-oem`.
4. (Optional) Add a custom selector / skip list to `scripts/scraper.py` if the page needs special handling.

### What `harness-checks.yml` will reject

- A `Platform` literal that has no source in `sources_config.py`.
- A source whose `platform` key is missing from `PLATFORM_META`.
- A source whose `category` is not one of the six recognized groups.
- A `PLATFORM_META` group that is not in `GROUP_LABELS`.

### Naming rules

| Field | Rule | Example |
|---|---|---|
| Platform key | lowercase ASCII, kebab- or single-word | `tiktok`, `cn-oem` (group only) |
| `label` | display name | `"TikTok"`, `"快手"` |
| `color` | brand hex | `#FF4906` |
| `group` | one of the six existing groups | `social` |
| Source `name` | identifies the **specific page** | `"TikTok API Changelog"` not `"TikTok"` |

A new group requires an ADR; there are six and this is intentional — the sidebar grid is laid out for six.

## Consequences

**Positive**

- Adding a source is a four-line change in one file (existing platform) or four files (new platform); both fit in a single PR.
- The CI cross-check makes "I forgot the type" impossible.
- Historical data using a removed platform key still validates because the key only needs to exist in `PLATFORM_META`, not in `SOURCES`.

**Negative**

- A platform you stop scraping but want to keep historical for must remain in `PLATFORM_META`. The CI flags this as "stale" but does not fail.

## Constraints this places on agents

- **Do not** add a `Platform` literal without a matching `SOURCES` entry in the same commit.
- **Do not** rename a platform key. The `id` field in `data/updates.json` embeds the key; renaming orphans every historical record.
- **Do not** delete a `PLATFORM_META` entry while historical `data/` records still reference it. The frontend will throw at render time.
- **Do not** add a seventh `group`. Propose an ADR first.
