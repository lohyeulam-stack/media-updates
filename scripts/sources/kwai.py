"""快手磁力引擎公告抓取."""

from __future__ import annotations

import requests
from bs4 import BeautifulSoup

from .base import BaseSource, RawArticle

KWAI_MARKETING_URL = "https://developers.e.kuaishou.com/docs/changelog"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "zh-CN,zh;q=0.9",
}


class KwaiSource(BaseSource):
    platform = "kwai"
    source_name = "快手磁力引擎"

    def fetch(self) -> list[RawArticle]:
        results: list[RawArticle] = []
        try:
            resp = requests.get(KWAI_MARKETING_URL, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            items = soup.select("a[href*='changelog'], a[href*='docs'], .changelog-item, .list-item")
            seen: set[str] = set()

            for item in items[:20]:
                href = item.get("href", "")
                if not href or href in seen:
                    continue
                if not href.startswith("http"):
                    href = f"https://developers.e.kuaishou.com{href}"
                seen.add(href)

                title = item.get_text(strip=True)[:200]
                if not title or len(title) < 3:
                    continue

                results.append(self._make_article(
                    title=title,
                    url=href,
                    snippet="",
                    tags=["快手广告"],
                ))
        except Exception as e:
            print(f"[Kwai] Error: {e}")
        return results
