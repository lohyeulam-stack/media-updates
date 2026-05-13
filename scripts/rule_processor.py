"""Rule-based extractor — replaces AI for article extraction and monthly report."""

from __future__ import annotations

import re
from collections import defaultdict
from datetime import datetime, timezone
from urllib.parse import urlparse

import feedparser

# ── RSS feed registry ─────────────────────────────────────────────────────────

SOURCE_URL_TO_FEED: dict[str, str] = {
    "https://www.facebook.com/business/news":           "https://www.facebook.com/business/news/rss",
    "https://developers.facebook.com/blog/":            "https://developers.facebook.com/blog/feed/",
    "https://blog.google/products/ads-commerce/":       "https://blog.google/products/ads-commerce/rss/",
    "https://ads-developers.googleblog.com/":           "https://ads-developers.googleblog.com/feeds/posts/default",
    "https://blog.google/products/marketingplatform/":  "https://blog.google/products/marketingplatform/rss/",
    "https://about.ads.microsoft.com/en-us/blog":       "https://about.ads.microsoft.com/en-us/blog/rss",
    "https://blog.youtube/":                            "https://blog.youtube/rss/",
}

# ── Category / importance rules ───────────────────────────────────────────────

_CATEGORY_RULES: list[tuple[str, list[str]]] = [
    ("api-change",  ["api", "sdk", "changelog", "endpoint", "deprecat", "breaking change",
                     "migration", "release note", "developer", "graph api", "marketing api"]),
    ("policy",      ["policy", "terms", "compliance", "privacy", "guideline", "regulation",
                     "enforcement", "prohibited", "restricted", "rule change"]),
    ("measurement", ["measurement", "attribution", "reporting", "analytics", "conversion",
                     "tracking", "pixel", "signal", "incrementality", "lift", "mmm"]),
    ("targeting",   ["targeting", "audience", "segment", "lookalike", "custom audience",
                     "interest", "demographic", "retarget", "remarketing"]),
    ("creative",    ["creative", "image", "asset", "template", "dynamic", "carousel",
                     "story", "reel", "short", "visual", "ad format"]),
    ("automation",  ["automation", "smart", "advantage", "performance max", "pmax",
                     "ai-powered", "machine learning", "bidding", "budget optimization"]),
    ("ad-product",  ["launch", "introduce", "announcing", "new feature", "campaign",
                     "placement", "inventory", "objective", "ad unit"]),
]

_HIGH_SIGNALS = ["breaking", "major", "critical", "deprecat", "sunset", "required",
                 "mandatory", "deadline", "significant", "important update", "new feature",
                 "launch", "introducing", "changes to", "update to"]
_LOW_SIGNALS  = ["tip", "how to", "best practice", "case study", "success story",
                 "webinar", "podcast", "insight", "trend", "guide"]


def _classify(text: str) -> tuple[str, str, list[str]]:
    lower = text.lower()
    category = "other"
    for cat, kws in _CATEGORY_RULES:
        if any(kw in lower for kw in kws):
            category = cat
            break
    importance = "medium"
    if any(s in lower for s in _HIGH_SIGNALS):
        importance = "high"
    elif any(s in lower for s in _LOW_SIGNALS):
        importance = "low"
    tags: list[str] = []
    for kw, tag in [("api","api"),("sdk","sdk"),("video","video"),("creative","creative"),
                    ("measurement","measurement"),("attribution","attribution"),
                    ("targeting","targeting"),("automation","automation"),
                    ("policy","policy"),(" ai ","ai"),("shopping","shopping")]:
        if kw in lower and tag not in tags:
            tags.append(tag)
    return category, importance, tags[:4]


# ── Date parsing ──────────────────────────────────────────────────────────────

_MONTH_MAP = {"jan":1,"feb":2,"mar":3,"apr":4,"may":5,"jun":6,
              "jul":7,"aug":8,"sep":9,"oct":10,"nov":11,"dec":12}

_RE_ISO   = re.compile(r"\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b")
_RE_MDY   = re.compile(r"\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b", re.I)
_RE_DMY   = re.compile(r"\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})\b", re.I)
_RE_URL_DATE = re.compile(r"/(\d{4})/(\d{2})/(\d{2})/")


def _parse_date(s: str) -> str | None:
    if not s:
        return None
    m = _RE_ISO.search(s)
    if m:
        try:
            return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3))).strftime("%Y-%m-%d")
        except ValueError:
            pass
    m = _RE_MDY.search(s)
    if m:
        try:
            mo = _MONTH_MAP[m.group(1)[:3].lower()]
            return datetime(int(m.group(3)), mo, int(m.group(2))).strftime("%Y-%m-%d")
        except (ValueError, KeyError):
            pass
    m = _RE_DMY.search(s)
    if m:
        try:
            mo = _MONTH_MAP[m.group(2)[:3].lower()]
            return datetime(int(m.group(3)), mo, int(m.group(1))).strftime("%Y-%m-%d")
        except (ValueError, KeyError):
            pass
    return None


def _date_from_url(url: str) -> str | None:
    m = _RE_URL_DATE.search(url)
    if m:
        try:
            return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3))).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return None


# ── RSS extraction ────────────────────────────────────────────────────────────

def fetch_rss(feed_url: str, platform: str, source_name: str,
              date_start: str, date_end: str) -> list[dict]:
    feed = feedparser.parse(feed_url)
    start_dt = datetime.fromisoformat(date_start).replace(tzinfo=timezone.utc)
    end_dt   = datetime.fromisoformat(date_end).replace(tzinfo=timezone.utc).replace(
        hour=23, minute=59, second=59)

    results = []
    for entry in feed.entries:
        pub = entry.get("published_parsed") or entry.get("updated_parsed")
        if not pub:
            continue
        dt = datetime(*pub[:6], tzinfo=timezone.utc)
        if not (start_dt <= dt <= end_dt):
            continue

        title = entry.get("title", "").strip()
        link  = entry.get("link", "")
        raw   = entry.get("summary", "") or ""
        if not raw and entry.get("content"):
            raw = entry["content"][0].get("value", "")
        summary = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", raw)).strip()[:300]

        cat, imp, tags = _classify(f"{title} {summary}")
        results.append({
            "title": title, "titleOriginal": title, "summary": summary,
            "category": cat, "importance": imp, "tags": tags,
            "sourceUrl": link, "date": dt.strftime("%Y-%m-%d"),
            "dateConfidence": "high", "source": source_name, "platform": platform,
        })
    return results


# ── Link-based extraction (non-RSS) ──────────────────────────────────────────

_CTA = {"learn more","read more","see more","view more","show more","get started",
        "sign up","log in","contact us","subscribe","download","try now","explore",
        "watch now","了解更多","查看更多"}


# Regex to strip leading date prefix from titles like "May 12, 2026\nActual Title"
_RE_TITLE_DATE_PREFIX = re.compile(
    r"^(?:\d{4}[/-]\d{1,2}[/-]\d{1,2}|"
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}|"
    r"\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})"
    r"[\s\n,.-]*",
    re.I,
)


def _clean_title(raw: str) -> tuple[str, str | None]:
    """Strip leading date from title text; return (clean_title, date_str_or_None)."""
    date_from_title = _parse_date(raw)
    cleaned = _RE_TITLE_DATE_PREFIX.sub("", raw).strip()
    # Take only first line if multi-line
    cleaned = cleaned.split("\n")[0].strip()
    return cleaned, date_from_title


def extract_from_links(links: list[dict], platform: str, source_name: str,
                       page_url: str, date_start: str, date_end: str) -> list[dict]:
    """Extract articles from scraper link list using rule-based date/category detection."""
    results = []
    for link in links:
        raw_title = (link.get("title") or "").strip()
        if not raw_title or len(raw_title) < 10:
            continue
        if raw_title.lower() in _CTA:
            continue

        url = link.get("url", "") or page_url

        # Date resolution priority:
        # 1. Date embedded in title text (e.g. "May 12, 2026\nActual Title...")
        # 2. link['date'] field from scraper (only if it differs from a shared/wrong date)
        # 3. Date pattern in URL path
        # 4. Skip — never guess
        title, date_from_title = _clean_title(raw_title)
        if not title or len(title) < 8:
            continue

        date = date_from_title
        confidence = "high" if date else None

        if not date:
            # Only trust link['date'] if it looks like it came from a <time> element
            # (i.e. it's a clean ISO date, not a shared/wrong date from a sibling element)
            raw_link_date = link.get("date", "")
            candidate = _parse_date(raw_link_date)
            if candidate and candidate != _parse_date(page_url):
                date = candidate
                confidence = "medium"

        if not date:
            date = _date_from_url(url)
            confidence = "medium" if date else None

        if not date:
            continue

        # Filter by date range
        if not (date_start <= date <= date_end):
            continue

        snippet = (link.get("snippet") or "")[:300]
        # If snippet also has a date prefix, clean it
        snippet_clean = _RE_TITLE_DATE_PREFIX.sub("", snippet).strip().split("\n")[0][:300]

        cat, imp, tags = _classify(f"{title} {snippet_clean}")
        results.append({
            "title": title, "titleOriginal": title,
            "summary": snippet_clean or title,
            "category": cat, "importance": imp, "tags": tags,
            "sourceUrl": url, "date": date,
            "dateConfidence": confidence,
            "source": source_name, "platform": platform,
        })
    return results


# ── Monthly report (template) ─────────────────────────────────────────────────

_CATEGORY_LABELS = {
    "social": "社交/短视频", "search": "搜索/应用商店", "video": "视频",
    "asia": "亚洲区域", "dsp": "程序化/DSP", "cn-oem": "国内厂商海外渠道",
}

_PLATFORM_CATEGORY = {
    "tiktok":"social","meta":"social","snapchat":"social","pinterest":"social",
    "x":"social","linkedin":"social","quora":"social",
    "google":"search","apple":"search","bing":"search",
    "youtube":"video","spotify":"video","netflix":"video","uber":"video",
    "kwai":"asia","line":"asia","naver":"asia","kakao":"asia","bigo":"asia",
    "newsbreak":"asia","smartnews":"asia","vk":"asia","yandex":"asia","mediago":"asia",
    "dv360":"dsp","applovin":"dsp","ironsource":"dsp","mintegral":"dsp","pangle":"dsp",
    "amazon":"dsp","ttd":"dsp","taboola":"dsp","outbrain":"dsp","criteo":"dsp",
    "moloco":"dsp","miq":"dsp",
    "huawei":"cn-oem","xiaomi":"cn-oem","oppo":"cn-oem","vivo":"cn-oem",
}

_IMP_LABEL = {"high": "🔴 重要", "medium": "🟡 一般", "low": "⚪ 参考"}


def generate_monthly_report(month_label: str, updates: list[dict]) -> str:
    if not updates:
        return f"# {month_label} 媒体平台更新月报\n\n本月暂无收录更新。"

    # Group by platform category → platform
    by_cat: dict[str, dict[str, list[dict]]] = defaultdict(lambda: defaultdict(list))
    for u in updates:
        plat = u.get("platform", "other")
        cat  = _PLATFORM_CATEGORY.get(plat, "dsp")
        by_cat[cat][plat].append(u)

    high_count = sum(1 for u in updates if u.get("importance") == "high")
    plat_count = len({u.get("platform") for u in updates})

    lines = [
        f"# {month_label} 媒体平台更新月报\n",
        f"> 本月共收录 **{len(updates)}** 条更新，涉及 **{plat_count}** 个平台，"
        f"其中重要更新 **{high_count}** 条。\n",
    ]

    cat_order = ["social","search","video","asia","dsp","cn-oem"]
    for cat in cat_order:
        if cat not in by_cat:
            continue
        lines.append(f"\n## {_CATEGORY_LABELS.get(cat, cat)}\n")
        for plat in sorted(by_cat[cat]):
            items = sorted(by_cat[cat][plat], key=lambda x: x.get("date",""), reverse=True)
            lines.append(f"\n### {plat.upper()}\n")
            for item in items:
                url   = item.get("sourceUrl","")
                title = item.get("title","")
                date  = item.get("date","")
                imp   = _IMP_LABEL.get(item.get("importance","medium"), "")
                link  = f"[{title}]({url})" if url else title
                lines.append(f"- {imp} {link}（{date}）")

    return "\n".join(lines)


# ── Drop-in replacement for ai_processor.extract_and_summarize ───────────────

def extract_and_summarize(
    page_text: str,
    links: list[dict],
    platform: str,
    source_name: str,
    week_start: str,
    week_end: str,
    source_url: str = "",
) -> list[dict]:
    """Drop-in replacement for ai_processor.extract_and_summarize.

    Uses RSS feed if available for the source URL, otherwise falls back to
    rule-based extraction from the scraper's link list.
    """
    feed_url = SOURCE_URL_TO_FEED.get(source_url)
    if feed_url:
        results = fetch_rss(feed_url, platform, source_name, week_start, week_end)
        print(f"[Rule/RSS] {source_name}: {len(results)} articles from feed")
        return results

    results = extract_from_links(links, platform, source_name, source_url, week_start, week_end)
    print(f"[Rule/Links] {source_name}: {len(results)} articles from {len(links)} links")
    return results
