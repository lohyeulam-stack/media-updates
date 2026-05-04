"""Snapchat for Business Blog scraper."""

from __future__ import annotations

import requests
from bs4 import BeautifulSoup

from .base import BaseSource, RawArticle

SNAP_BLOG_URL = "https://forbusiness.snapchat.com/blog"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
}


class SnapchatSource(BaseSource):
    platform = "snapchat"
    source_name = "Snapchat for Business"

    def fetch(self) -> list[RawArticle]:
        results: list[RawArticle] = []
        try:
            resp = requests.get(SNAP_BLOG_URL, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            links = soup.select("a[href*='/blog/']")
            seen: set[str] = set()

            for link in links[:20]:
                href = link.get("href", "")
                if not href or href in seen or href == "/blog/":
                    continue
                if not href.startswith("http"):
                    href = f"https://forbusiness.snapchat.com{href}"
                seen.add(href)

                title = link.get_text(strip=True)[:200]
                if not title or len(title) < 5:
                    continue

                results.append(self._make_article(
                    title=title,
                    url=href,
                    snippet="",
                    tags=["Snapchat Ads"],
                ))
        except Exception as e:
            print(f"[Snapchat] Error: {e}")
        return results
