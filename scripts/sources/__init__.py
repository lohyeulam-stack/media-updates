from .base import BaseSource, RawArticle
from .tiktok import TikTokSource
from .meta import MetaSource
from .google_ads import GoogleAdsSource
from .snapchat import SnapchatSource
from .kwai import KwaiSource

ALL_SOURCES: list[BaseSource] = [
    TikTokSource(),
    MetaSource(),
    GoogleAdsSource(),
    SnapchatSource(),
    KwaiSource(),
]

__all__ = [
    "BaseSource",
    "RawArticle",
    "ALL_SOURCES",
    "TikTokSource",
    "MetaSource",
    "GoogleAdsSource",
    "SnapchatSource",
    "KwaiSource",
]
