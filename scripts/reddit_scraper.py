"""Reddit scraper — fetch top posts from ad-related subreddits.

Uses Reddit's public JSON API (no auth). Rate-limited per reddit_config.py
(2.5 s between requests). Handles 429 rate-limit responses with backoff.

See docs/adr/0007-reddit-aggregation.md.
"""

from __future__ import annotations

import html
import json
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from reddit_config import (
    SUBREDDITS,
    MIN_UPVOTES,
    SORT,
    TIME,
    LIMIT,
    REQUEST_DELAY,
    BASE_URL,
    USER_AGENT,
)


def _fetch(subreddit: str) -> dict[str, Any]:
    """Fetch top posts for a single subreddit. Returns the parsed JSON body."""
    url = f"{BASE_URL}/r/{subreddit}/{SORT}.json?t={TIME}&limit={LIMIT}"
    return _request(url, subreddit)


def _request(url: str, subreddit: str, attempt: int = 1) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        if exc.code == 429 and attempt <= 3:
            backoff = attempt * 5
            print(f"  429 rate limit from r/{subreddit} — backing off {backoff}s",
                  file=sys.stderr)
            time.sleep(backoff)
            return _request(url, subreddit, attempt + 1)
        raise
    except Exception:
        print(f"  r/{subreddit}: request failed (attempt {attempt}) — skipping",
              file=sys.stderr)
        return {"data": {"children": []}}


def scrape_all() -> list[dict[str, Any]]:
    posts: list[dict[str, Any]] = []
    for subreddit in SUBREDDITS:
        print(f"  r/{subreddit} …", end=" ", flush=True)
        try:
            body = _fetch(subreddit)
        except Exception as exc:
            print(f"SKIP ({exc})")
            continue
        children = body.get("data", {}).get("children", [])
        count = 0
        for child in children:
            data = child.get("data", {})
            if not isinstance(data, dict):
                continue
            score = data.get("score", 0)
            if score < MIN_UPVOTES:
                continue
            created_utc = data.get("created_utc")
            if not created_utc:
                continue
            dt = datetime.fromtimestamp(created_utc, tz=timezone.utc)
            date_str = dt.strftime("%Y-%m-%d")
            week_iso = dt.isocalendar()
            week_label = f"{week_iso.year}-W{week_iso.week:02d}"

            url_path = data.get("permalink", "")
            full_url = f"https://reddit.com{url_path}" if url_path else ""

            # Extract image URLs from Reddit API.
            # thumbnail: "self"|"default"|"nsfw"|URL. Only keep actual URLs.
            thumbnail_raw = data.get("thumbnail") or ""
            thumbnail = thumbnail_raw if thumbnail_raw.startswith("http") else ""
            # preview.images[] — Reddit generates these for link posts.
            preview_url = ""
            preview = data.get("preview")
            if isinstance(preview, dict):
                images = preview.get("images") or []
                if images:
                    src = images[0].get("source", {}).get("url") or ""
                    if src:
                        preview_url = html.unescape(src)
            # media_metadata — for Reddit-hosted gallery images (pick first).
            gallery_url = ""
            media_meta = data.get("media_metadata")
            if isinstance(media_meta, dict):
                for _k, v in media_meta.items():
                    if isinstance(v, dict) and v.get("e") == "Image":
                        src = v.get("s", {}).get("u") or v.get("p", [{}])[0].get("u", "")
                        if src:
                            gallery_url = html.unescape(src)
                            break

            posts.append({
                "post_id": data.get("id", ""),
                "subreddit": subreddit,
                "title": (data.get("title") or "").strip(),
                "url": full_url,
                "author": data.get("author") or "",
                "upvotes": score,
                "commentCount": data.get("num_comments", 0),
                "date": date_str,
                "week": week_label,
                "flair": data.get("link_flair_text") or "",
                "flairCss": data.get("link_flair_css_class") or "",
                "selftext": (data.get("selftext") or "")[:2000],
                "imageUrl": preview_url or gallery_url or thumbnail or "",
                "postHint": data.get("post_hint") or "",
                "isSelf": bool(data.get("is_self")),
                "domain": data.get("domain") or "",
                "fetchedAt": datetime.now(timezone.utc).isoformat(),
            })
            count += 1
        print(f"{count} posts (≥{MIN_UPVOTES}↑)")
        if subreddit != SUBREDDITS[-1]:
            time.sleep(REQUEST_DELAY)
    return posts


def main() -> int:
    print("[reddit-scraper] Starting fetch from Reddit JSON API")
    print(f"  Subreddits: {SUBREDDITS}")
    print(f"  Min upvotes: {MIN_UPVOTES}")
    print(f"  Sort / Time / Limit: {SORT} / {TIME} / {LIMIT}")

    posts = scrape_all()
    print(f"  Total fetched: {len(posts)} posts")
    if not posts:
        print("[reddit-scraper] No posts met the criteria.", file=sys.stderr)
        return 0

    out_path = Path(__file__).parent.parent / "data" / "reddit_raw.json"
    out_path.write_text(
        json.dumps(posts, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"  Written to {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
