"""Google Ads Blog scraper using RSS/Atom feed."""

from __future__ import annotations

import requests
from bs4 import BeautifulSoup

from .base import BaseSource, RawArticle

GOOGLE_ADS_BLOG = "https://blog.google/products/ads-commerce/"
GOOGLE_DEV_BLOG_FEED = "https://ads-developers.googleblog.com/feeds/posts/default"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
}


class GoogleAdsSource(BaseSource):
    platform = "google"
    source_name = "Google Ads Blog"

    def fetch(self) -> list[RawArticle]:
        articles: list[RawArticle] = []
        articles.extend(self._fetch_dev_feed())
        articles.extend(self._fetch_ads_blog())
        return articles

    def _fetch_dev_feed(self) -> list[RawArticle]:
        results: list[RawArticle] = []
        try:
            resp = requests.get(GOOGLE_DEV_BLOG_FEED, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "xml")

            entries = soup.find_all("entry")
            for entry in entries[:15]:
                title_el = entry.find("title")
                link_el = entry.find("link", {"rel": "alternate"})
                summary_el = entry.find("summary") or entry.find("content")
                published_el = entry.find("published") or entry.find("updated")

                title = title_el.get_text(strip=True) if title_el else ""
                url = link_el.get("href", "") if link_el else ""
                snippet = summary_el.get_text(strip=True)[:500] if summary_el else ""
                published = published_el.get_text(strip=True)[:10] if published_el else None

                if not title or not url:
                    continue

                results.append(self._make_article(
                    title=title,
                    url=url,
                    snippet=snippet,
                    published_at=published,
                    tags=["Google Ads API"],
                ))
        except Exception as e:
            print(f"[Google Dev Feed] Error: {e}")
        return results

    def _fetch_ads_blog(self) -> list[RawArticle]:
        results: list[RawArticle] = []
        try:
            resp = requests.get(GOOGLE_ADS_BLOG, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            links = soup.select("a[href*='/products/ads']")
            seen: set[str] = set()

            for link in links[:15]:
                href = link.get("href", "")
                if not href or href in seen or href == "/products/ads-commerce/":
                    continue
                if not href.startswith("http"):
                    href = f"https://blog.google{href}"
                seen.add(href)

                title = link.get_text(strip=True)[:200]
                if not title or len(title) < 10:
                    continue

                results.append(self._make_article(
                    title=title,
                    url=href,
                    snippet="",
                    tags=["Google Ads"],
                ))
        except Exception as e:
            print(f"[Google Ads Blog] Error: {e}")
        return results
