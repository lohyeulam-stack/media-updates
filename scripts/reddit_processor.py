"""Reddit AI processor — summarize posts + extract key insights via MiniMax M2.7.

Input:  data/reddit_raw.json (from reddit_scraper.py)
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

from ai_processor import _call_minimax

# Hardcoded prompt — see ADR 0007 for the design rationale.
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


def _load_raw() -> list[dict]:
    path = Path(__file__).parent.parent / "data" / "reddit_raw.json"
    if not path.exists():
        print(f"[reddit-processor] No raw data found at {path}", file=sys.stderr)
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


def main() -> int:
    api_key = os.environ.get("MINIMAX_API_KEY", "").strip()
    if not api_key:
        print("[reddit-processor] MINIMAX_API_KEY not set — skipping AI summarization",
              file=sys.stderr)
        return 1

    raw = _load_raw()
    if not raw:
        return 0

    existing = _load_existing()
    to_process = [p for p in raw if _needs_summary(p["post_id"], existing)]
    print(f"[reddit-processor] {len(to_process)} new posts to summarise "
          f"(out of {len(raw)} total)")

    if not to_process:
        return 0

    # Batch by 10 posts per AI call (same as the main pipeline's batch strategy).
    batch_size = 10
    results = []
    for i in range(0, len(to_process), batch_size):
        batch = to_process[i:i + batch_size]
        input_text = _make_user_content(batch)
        try:
            response = _call_minimax(prompt)
            parsed = _parse_response(response)
            results.extend(parsed)
            print(f"  Batch {i//batch_size + 1}: {len(parsed)} summaries")
        except Exception as exc:
            print(f"  Batch {i//batch_size + 1} FAILED: {exc}", file=sys.stderr)
            # Don't abort — keep the previous batch results.
        time.sleep(0.5)  # gentle rate limit

    # Merge AI results back into raw posts.
    summary_map = {r["post_id"]: r for r in results}
    merged = []
    cutoff = (datetime.now(timezone.utc) - timedelta(days=90)).strftime("%Y-%m-%d")
    for post in raw:
        item_id = f"reddit-{post['subreddit']}-{post['post_id']}"
        sm = summary_map.get(post["post_id"], {})
        if post["date"] < cutoff:
            continue  # trim beyond MAX_AGE_DAYS
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

    out_path = Path(__file__).parent.parent / "data" / "reddit_updates.json"
    out_path.write_text(
        json.dumps(merged, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"[reddit-processor] Written {len(merged)} posts to {out_path}")
    return 0


def _parse_response(text: str) -> list[dict]:
    """Extract JSON array from the AI response."""
    stripped = text.strip()
    # Strip code fences if present.
    if stripped.startswith("```"):
        lines = stripped.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        stripped = "\n".join(lines)
    return json.loads(stripped)


if __name__ == "__main__":
    sys.exit(main())
