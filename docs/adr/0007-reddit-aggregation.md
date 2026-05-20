# ADR 0007 — Reddit ad-discussion aggregation

- **Status**: Accepted
- **Date**: 2026-05-20
- **Context authors**: bran.yang, angie.yi, zicky.cai, gztd-03-02523
- **Supersedes**: No previous Reddit work.
- **Related**: [ADR 0002](./0002-data-flow-pipeline.md) (pipeline), [ADR 0003](./0003-ai-extraction-rules.md) (AI rules), [ADR 0006](./0006-platform-source-registration.md) (source registration)

## Context

The TopTou team currently tracks *platform-side* ad updates (changelogs, policy, new features). bran.yang surfaced a complementary need: *advertiser-side* first-hand experience. The most concentrated source is Reddit — subreddits like r/FacebookAds, r/PPC, r/advertising are filled with:

- Campaign post-mortems with real ROAS/CPA numbers.
- Bid-strategy comparison threads.
- "Here's what the rep told me" platform-insider threads.
- UGC creative test results ("Human won attention. AI won conversions.").

The existing `media-updates` pipeline can serve as a scaffold; Reddit posts are a different *entity*, but the same *pattern*: scrape → AI extract → validate → display.

Zicky's comment "圆头圆脑圆肚皮" captures the UX goal: everything visible at a glance, no scrolling required. Bran's "不用刷到才看" motivates the aggregation-first approach.

## Decision

Reddit posts enter the system as a **separate data entity** under `data/reddit_updates.json`, with a dedicated scraper and AI processor. They do **not** mix into `data/updates.json` because:

1. `MediaUpdate` requires fields Reddit posts don't have (`category`, `importance`, `sourceUrl` as changelog link).
2. The frontend card design is different (discussion cards vs. update cards).
3. Running one pipeline shouldn't slow the other.

### Data model — `RedditPost`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | `reddit-{subreddit}-{reddit_post_id}` |
| `subreddit` | string | yes | e.g. `FacebookAds`, `PPC` |
| `title` | string | yes | original Reddit title |
| `url` | string | yes | `https://reddit.com/r/{subreddit}/comments/{post_id}/...` |
| `author` | string | optional | Reddit username |
| `upvotes` | number | yes | score from Reddit |
| `commentCount` | number | yes | number of comments |
| `date` | string | yes | `YYYY-MM-DD` (UTC from Reddit created_utc) |
| `week` | string | optional | `YYYY-WNN` ISO week label |
| `summary` | string | yes | Chinese summary (MiniMax, ~150 chars) |
| `keyInsight` | string | optional | standout quote or finding (AI extracts if present) |
| `flair` | string | optional | Reddit post flair |
| `fetchedAt` | string | yes | ISO timestamp set by pipeline |

### Initial subreddit list (8 subreddits)

```
r/FacebookAds, r/PPC, r/advertising, r/marketing,
r/GoogleAds, r/programmatic, r/adops, r/socialmedia
```

Each subreddit → `top.json?t=week&limit=20`. Posts below 25 upvotes are dropped. This yields roughly 30–60 posts per fetch.

### Pipeline (similar pattern to ADR 0002)

```
Reddit JSON API (no auth, 1 req/sec rate limit)
  → reddit_scraper.py (fetch top/week from each subreddit)
  → Deduplicate (by Reddit post ID — same post can appear in multiple subreddits)
  → MiniMax M2.7 summarizes each post + extracts key insight
  → Validate (date ≥ 7 days ago, summary present, url valid)
  → Write to data/reddit_updates.json (rolling 90-day window)
```

Trigger: same `daily-fetch.yml` at 16:00 UTC (Beijing 00:00), appended as a new job `reddit-fetch` after the main pipeline.

### Frontend

| Route | Content |
|---|---|
| `/reddit` | Feed of Reddit posts, sorted newest → oldest, filtered to last 30 days. Cards show: subreddit badge, upvote count, title, AI summary, key insight highlighted, link to thread. |
| Sidebar | "Reddit / Community" entry under a new "Community" section (or adjacent to Elsewhere links). |

### Constraints

- **Do not** scrap last-hour or `new.json` — Reddit's rate limit is 1 req/s without API key. `top?t=week` is one request per subreddit per day.
- **Do not** store comment bodies — summarization is per-post, not per-thread, to stay within MiniMax context limits.
- **Do not** proxy or republish full Reddit content. Only titles + AI summaries live in our JSON. Users click through to Reddit to read the thread.
- Fetched posts older than 90 days are trimmed on each run (rolling window).

## Consequences

**Positive**

- Splitting Reddit from MediaUpdate avoids schema bloat. Each data type evolves independently.
- The daily CI job already handles two modes (weekly + monthly); adding a third parallel job is a small workflow change.
- No new API keys or paid services required — Reddit JSON API is free for our request volume.

**Negative**

- Reddit occasionally changes its JSON structure without notice. The scraper must validate shape at runtime.
- Rate limit violation (too many requests in one second) returns a 429 that must be handled with a backoff.
- No comment-level tracking means we miss gold in comment threads. If this proves valuable, a follow-up ADR can add top-comment extraction.

## Constraints this places on agents

- **Do not** merge Reddit posts into `data/updates.json`. Use `data/reddit_updates.json` exclusively.
- **Do not** add subreddits beyond the initial 8 without user approval — the 1 req/s rate limit is per IP; more subreddits → more delay.
- **Do not** add a Reddit API key without an ADR (it changes the auth model and rate budget).
- **Do not** import Reddit types into `src/lib/types.ts` without a dedicated `src/lib/reddit-types.ts` or a `RedditPost` type annotation.

## Status of subreddit list

The initial list is opinionated toward paid-social / performance marketing subreddits (bran.yang's focus). To propose additions, the user can update the list in `scripts/reddit_config.py` using the existing source-addition workflow pattern from ADR 0006.
