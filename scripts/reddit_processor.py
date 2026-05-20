"""Reddit AI processor — summarize posts + extract key insights via MiniMax M2.7.

Input:  data/reddit_raw.json (from reddit_scraper.py) or a passed-in list
Output: data/reddit_updates.json (rolling 90-day window of summarised posts)

See docs/adr/0007-reddit-aggregation.md.
"""

from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from ai_processor import _call_minimax

SUMMARIZE_SYSTEM = """
You are an ad-industry analyst. Below is a Reddit discussion post from an advertising-related subreddit.

For each post, write a short Chinese summary (100-200 characters) that captures:

1. What the OP tested / asked / discovered.
2. Key quantitative findings (ROAS, CPA, CPM, CTR, etc.) if mentioned.
3. The community consensus or top-voted takeaway (if any).

Then extract one "key insight" — a single sentence (Chinese, ≤ 100 chars) that captures the most actionable finding. This should be a quotable, tweet-style insight.

Return ONLY a JSON array (no Markdown, no preamble). Each object:

[
  {
    "post_id": "string — matches input",
    "summary": "中文摘要",
    "keyInsight": "最核心的一句话洞察"
  }
]
"""

MAX_AGE_DAYS = 90


def _make_user_content(posts: list[dict]) -> str:
    """Render the batch of posts as structured input for the AI."""
    items = [{
        "post_id": p["post_id"],
        "subreddit": p["subreddit"],
        "title": p["title"],
        "selftext": p.get("selftext", "")[:1000],
        "flair": p.get("flair", ""),
        "upvotes": p["upvotes"],
    } for p in posts]
    return json.dumps(items, ensure_ascii=False, indent=2)


def _parse_response(text: str) -> list[dict]:
    stripped = text.strip()
    if stripped.startswith("```"):
        lines = stripped.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        stripped = "\n".join(lines)
    return json.loads(stripped)


def _load_raw() -> list[dict]:
    path = Path(__file__).parent.parent / "data" / "reddit_raw.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def _load_existing() -> list[dict]:
    path = Path(__file__).parent.parent / "data" / "reddit_updates.json"
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def _needs_summary(post_id: str, existing: list[dict]) -> bool:
    existing_ids = {item.get("id", "") for item in existing}
    return post_id not in existing_ids


def process_reddit_posts(
    raw_posts: list[dict[str, Any]],
    *,  # keyword-only below
    api_key: str = "",
    batch_size: int = 10,
) -> list[dict[str, Any]]:
    """Summarise raw Reddit posts. Returns merged RedditPost records.

    Callable from fetch_updates.py — does NOT read/write files directly.
    The caller is responsible for persisting the output.
    """
    if not raw_posts:
        return []

    existing = _load_existing()
    to_process = [p for p in raw_posts if _needs_summary(p["post_id"], existing)]
    new_count = len(to_process)
    print(f"[reddit-processor] {new_count} new posts to summarise "
          f"(out of {len(raw_posts)} total)")

    results: list[dict] = []
    if new_count and api_key:
        for i in range(0, new_count, batch_size):
            batch = to_process[i:i + batch_size]
            user_content = _make_user_content(batch)
            try:
                response = _call_minimax(SUMMARIZE_SYSTEM, user_content)
                parsed = _parse_response(response)
                results.extend(parsed)
                print(f"  Batch {i // batch_size + 1}: {len(parsed)} summaries")
            except Exception as exc:
                print(f"  Batch {i // batch_size + 1} FAILED: {exc}", file=sys.stderr)
            time.sleep(0.5)
    elif new_count:
        print("[reddit-processor] No API key — posts will have no AI summary")
    else:
        print("[reddit-processor] All posts already summarised")
        return existing

    summary_map = {r["post_id"]: r for r in results}
    merged: list[dict[str, Any]] = []
    cutoff = (datetime.now(timezone.utc) - timedelta(days=MAX_AGE_DAYS)).strftime("%Y-%m-%d")
    data_dir = Path(__file__).parent.parent / "data"
    reddit_raw_path = data_dir / "reddit_raw.json"
    raw_source: list[dict[str, Any]]
    if reddit_raw_path.exists():
        raw_source = json.loads(reddit_raw_path.read_text(encoding="utf-8"))
    else:
        raw_source = raw_posts

    for post in raw_source:
        item_id = f"reddit-{post['subreddit']}-{post['post_id']}"
        sm = summary_map.get(post["post_id"], {})
        if post.get("date", "") < cutoff:
            continue
        merged.append({
            "id": item_id,
            "subreddit": post["subreddit"],
            "title": post["title"],
            "url": post["url"],
            "author": post.get("author") or "",
            "upvotes": post["upvotes"],
            "commentCount": post["commentCount"],
            "date": post["date"],
            "week": post.get("week", ""),
            "summary": sm.get("summary", "") or "（待 AI 总结）",
            "keyInsight": sm.get("keyInsight") or "",
            "flair": post.get("flair") or "",
            "fetchedAt": post.get("fetchedAt", ""),
        })
    return merged


def main() -> int:
    """Standalone entry: read raw file, AI summarise, write updates file."""
    api_key = os.environ.get("MINIMAX_API_KEY", "").strip()
    raw = _load_raw()
    if not raw:
        print("[reddit-processor] No raw data — run reddit_scraper.py first",
              file=sys.stderr)
        return 0

    merged = process_reddit_posts(raw, api_key=api_key)

    out_path = Path(__file__).parent.parent / "data" / "reddit_updates.json"
    out_path.write_text(
        json.dumps(merged, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"[reddit-processor] Written {len(merged)} posts to {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
