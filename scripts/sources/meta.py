"""Meta for Business Blog scraper."""

from __future__ import annotations

import requests
from bs4 import BeautifulSoup

from .base import BaseSource, RawArticle

META_BLOG_URL = "https://www.facebook.com/business/news"
META_DEV_BLOG = "https://developers.facebook.com/blog/"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
}


class MetaSource(BaseSource):
    platform = "meta"
    source_name = "Meta for Business"

    def fetch(self) -> list[RawArticle]:
        articles: list[RawArticle] = []
        articles.extend(self._fetch_business_blog())
        articles.extend(self._fetch_dev_blog())
        return articles

    def _fetch_business_blog(self) -> list[RawArticle]:
        results: list[RawArticle] = []
        try:
            resp = requests.get(META_BLOG_URL, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            links = soup.select("a[href*='/business/news/']")
            seen: set[str] = set()

            for link in links[:20]:
                href = link.get("href", "")
                if not href or href in seen or href == "/business/news/":
                    continue
                if not href.startswith("http"):
                    href = f"https://www.facebook.com{href}"
                seen.add(href)

                title = link.get_text(strip=True)[:200]
                if not title or len(title) < 5:
                    continue

                results.append(self._make_article(
                    title=title,
                    url=href,
                    snippet="",
                    tags=["Meta Ads"],
                ))
        except Exception as e:
            print(f"[Meta Business] Error: {e}")
        return results

    def _fetch_dev_blog(self) -> list[RawArticle]:
        results: list[RawArticle] = []
        try:
            resp = requests.get(META_DEV_BLOG, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            cards = soup.select("a[href*='/blog/post/']")
            seen: set[str] = set()

            for card in cards[:15]:
                href = card.get("href", "")
                if not href or href in seen:
                    continue
                if not href.startswith("http"):
                    href = f"https://developers.facebook.com{href}"
                seen.add(href)

                title = card.get_text(strip=True)[:200]
                if not title or len(title) < 5:
                    continue

                results.append(self._make_article(
                    title=title,
                    url=href,
                    snippet="",
                    tags=["Meta API"],
                ))
        except Exception as e:
            print(f"[Meta Dev] Error: {e}")
        return results
