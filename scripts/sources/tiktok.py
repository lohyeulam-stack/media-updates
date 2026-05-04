"""TikTok for Business Blog scraper."""

from __future__ import annotations

import requests
from bs4 import BeautifulSoup

from .base import BaseSource, RawArticle

TIKTOK_BLOG_URL = "https://www.tiktok.com/business/en-US/blog"
TIKTOK_DEV_URL = "https://developers.tiktok.com/changelog"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


class TikTokSource(BaseSource):
    platform = "tiktok"
    source_name = "TikTok for Business Blog"

    def fetch(self) -> list[RawArticle]:
        articles: list[RawArticle] = []
        articles.extend(self._fetch_blog())
        return articles

    def _fetch_blog(self) -> list[RawArticle]:
        results: list[RawArticle] = []
        try:
            resp = requests.get(TIKTOK_BLOG_URL, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            cards = soup.select("a[href*='/blog/']")
            seen_urls: set[str] = set()

            for card in cards[:20]:
                href = card.get("href", "")
                if not href or href in seen_urls:
                    continue
                if not href.startswith("http"):
                    href = f"https://www.tiktok.com{href}"
                seen_urls.add(href)

                title_el = card.select_one("h3, h2, .title, [class*='title']")
                title = title_el.get_text(strip=True) if title_el else card.get_text(strip=True)[:100]
                if not title:
                    continue

                snippet_el = card.select_one("p, .description, [class*='desc']")
                snippet = snippet_el.get_text(strip=True) if snippet_el else ""

                results.append(self._make_article(
                    title=title,
                    url=href,
                    snippet=snippet,
                    tags=["TikTok Ads"],
                ))
        except Exception as e:
            print(f"[TikTok Blog] Error: {e}")
        return results
