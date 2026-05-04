"""Base source class for all platform scrapers."""

from __future__ import annotations

import abc
import hashlib
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class RawArticle:
    title: str
    url: str
    snippet: str
    platform: str
    source_name: str
    published_at: str | None = None
    tags: list[str] = field(default_factory=list)

    @property
    def content_hash(self) -> str:
        return hashlib.md5(self.url.encode()).hexdigest()[:12]


class BaseSource(abc.ABC):
    platform: str = ""
    source_name: str = ""

    @abc.abstractmethod
    def fetch(self) -> list[RawArticle]:
        ...

    def _make_article(
        self,
        title: str,
        url: str,
        snippet: str,
        published_at: str | None = None,
        tags: list[str] | None = None,
    ) -> RawArticle:
        return RawArticle(
            title=title,
            url=url,
            snippet=snippet[:1000],
            platform=self.platform,
            source_name=self.source_name,
            published_at=published_at or datetime.now().strftime("%Y-%m-%d"),
            tags=tags or [],
        )
