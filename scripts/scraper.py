"""Playwright-based page scraper. Renders JS pages and extracts clean text + links."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from playwright.sync_api import sync_playwright, Page


CTA_PATTERNS = {
    "learn more", "read more", "see more", "view more", "show more",
    "get started", "sign up", "log in", "contact us", "subscribe",
    "download", "try now", "start free", "explore", "watch now",
    "了解更多", "查看更多", "立即开始", "注册", "登录",
}


@dataclass
class PageContent:
    url: str
    platform: str
    source_name: str
    text: str
    links: list[dict] = field(default_factory=list)


def scrape_all(
    sources: list[dict],
    max_concurrent: int = 4,
    date_start: str = "",
    date_end: str = "",
) -> list[PageContent]:
    results: list[PageContent] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        batch_size = max_concurrent
        for batch_start in range(0, len(sources), batch_size):
            batch = sources[batch_start:batch_start + batch_size]

            for src in batch:
                print(f"[Scrape] {src['name']} ({src['url']})...")
                context = browser.new_context(
                    user_agent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/125.0.0.0 Safari/537.36"
                    ),
                    locale="en-US",
                )
                try:
                    content = _scrape_page(context, src, date_start, date_end)
                    results.append(content)
                    with_date = sum(1 for l in content.links if l.get("date"))
                    print(f"  Text: {len(content.text)} chars, Links: {len(content.links)} ({with_date} with date)")
                except Exception as e:
                    print(f"  Error: {e}")
                finally:
                    context.close()

        browser.close()

    return results


def _scrape_page(context, src: dict, date_start: str = "", date_end: str = "") -> PageContent:
    max_attempts = 3 if src.get("use_iframe") else 1

    for attempt in range(max_attempts):
        page = context.new_page()
        try:
            page.goto(src["url"], timeout=60000, wait_until="domcontentloaded")
            page.wait_for_timeout(src.get("wait_ms", 3000))

            if src.get("use_iframe"):
                text, links = _scrape_iframe(page, src)
                if text:
                    max_len = 50000 if src.get("use_iframe") else 15000
                    return PageContent(
                        url=src["url"],
                        platform=src["platform"],
                        source_name=src["name"],
                        text=text[:max_len],
                        links=links[:50],
                    )
                if attempt < max_attempts - 1:
                    print(f"  Retry {attempt+2}/{max_attempts}...")
                    page.close()
                    continue
            else:
                text = _clean_text(page.inner_text("body"))
                links = _extract_links(page, src["url"])

                # Enrich dates for links with no date by visiting article pages.
                # Only when most links lack dates (avoids waste for sources where
                # scraper already found dates in link text).
                if date_start and date_end and not src.get("has_rss"):
                    with_date = sum(1 for l in links if l.get("date"))
                    no_date = len(links) - with_date
                    if no_date > with_date and no_date > 0:
                        links = _enrich_dates_from_articles(
                            context, links, date_start, date_end
                        )

            return PageContent(
                url=src["url"],
                platform=src["platform"],
                source_name=src["name"],
                text=text[:15000],
                links=links[:50],
            )
        except Exception as e:
            if attempt < max_attempts - 1:
                print(f"  Attempt {attempt+1} failed: {e}, retrying...")
                page.close()
                continue
            return PageContent(
                url=src["url"],
                platform=src["platform"],
                source_name=src["name"],
                text="",
                links=[],
            )
        finally:
            if not page.is_closed():
                page.close()

    return PageContent(url=src["url"], platform=src["platform"],
                       source_name=src["name"], text="", links=[])


_JS_ARTICLE_DATE = """() => {
    // Walk JSON-LD for datePublished
    function walkJsonLd(obj) {
        if (!obj || typeof obj !== 'object') return null;
        if (obj.datePublished) return obj.datePublished;
        if (Array.isArray(obj)) { for (const x of obj) { const r = walkJsonLd(x); if (r) return r; } }
        if (obj['@graph']) { for (const x of obj['@graph']) { const r = walkJsonLd(x); if (r) return r; } }
        return null;
    }
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
        try { const d = walkJsonLd(JSON.parse(s.textContent)); if (d) return d; } catch(e) {}
    }
    // meta tags
    for (const sel of [
        'meta[property="article:published_time"]',
        'meta[name="date"]', 'meta[name="publish_date"]',
        'meta[name="pubdate"]', 'meta[itemprop="datePublished"]',
    ]) {
        const m = document.querySelector(sel);
        if (m) { const v = m.getAttribute('content'); if (v) return v; }
    }
    // <time datetime>
    for (const t of document.querySelectorAll('time[datetime]')) {
        const v = t.getAttribute('datetime');
        if (v && /\\d{4}/.test(v)) return v;
    }
    // date-classed elements (Netflix, Spotify, etc.)
    for (const sel of [
        '[class*="article-date"]', '[class*="publishDate"]', '[class*="publish-date"]',
        '[class*="post-date"]', '[class*="entry-date"]', '[class*="article-datestyles"]',
        '[class*="byline"] [class*="date"]', 'header [class*="date"]',
        '[class*="posted"]', '[class*="timestamp"]',
    ]) {
        const el = document.querySelector(sel);
        if (el) { const v = el.innerText.trim(); if (v && /\\d{4}/.test(v)) return v; }
    }
    // Mintegral-style: ISO date in body text near article header
    const bodyText = document.body ? document.body.innerText : '';
    const m = bodyText.match(/\\b(\\d{4}-\\d{2}-\\d{2})\\b/);
    if (m && parseInt(m[1].substring(0,4)) >= 2020) return m[1];
    return null;
}"""


def _parse_article_date(raw: str) -> str:
    """Parse a raw date string from an article page to YYYY-MM-DD."""
    if not raw:
        return ""
    raw = raw.strip()
    # ISO datetime
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", raw)
    if m:
        try:
            import datetime
            datetime.date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
            return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
        except ValueError:
            pass
    # Month-name formats
    _MONTH = {"jan":1,"feb":2,"mar":3,"apr":4,"may":5,"jun":6,
               "jul":7,"aug":8,"sep":9,"oct":10,"nov":11,"dec":12}
    m = re.search(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})", raw, re.I)
    if m:
        mo = _MONTH.get(m.group(1)[:3].lower(), 0)
        if mo:
            return f"{m.group(3)}-{mo:02d}-{int(m.group(2)):02d}"
    m = re.search(r"(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})", raw, re.I)
    if m:
        mo = _MONTH.get(m.group(2)[:3].lower(), 0)
        if mo:
            return f"{m.group(3)}-{mo:02d}-{int(m.group(1)):02d}"
    return ""


def _enrich_dates_from_articles(
    context,
    links: list[dict],
    date_start: str,
    date_end: str,
    max_articles: int = 8,
) -> list[dict]:
    """Visit article pages for links without dates to extract publish date.

    Only fetches up to max_articles pages. Links that already have a date are
    left unchanged. Links whose fetched date falls outside [date_start, date_end]
    are kept but with an empty date so downstream filtering can decide.
    """
    no_date_links = [
        l for l in links
        if not l.get("date") and l.get("url")
        # Only fetch pages with at least 2 path segments after host (real articles have a slug)
        and len(l["url"].replace("https://", "").replace("http://", "").split("/")) > 2
    ]
    if not no_date_links:
        return links

    to_fetch = no_date_links[:max_articles]
    print(f"  [DateEnrich] Fetching dates from {len(to_fetch)} article pages...")

    date_map: dict[str, str] = {}
    for link in to_fetch:
        url = link["url"]
        pg = context.new_page()
        try:
            pg.goto(url, timeout=12000, wait_until="domcontentloaded")
            pg.wait_for_timeout(1000)
            raw = pg.evaluate(_JS_ARTICLE_DATE)
            if raw:
                parsed = _parse_article_date(str(raw))
                if parsed:
                    date_map[url] = parsed
        except Exception as e:
            pass  # timeout or navigation error — leave date empty
        finally:
            try:
                pg.close()
            except Exception:
                pass

    enriched = sum(1 for v in date_map.values() if v)
    in_range = sum(1 for v in date_map.values() if v and date_start <= v <= date_end)
    print(f"  [DateEnrich] Got dates for {enriched}/{len(to_fetch)} articles, {in_range} in range")

    result = []
    for link in links:
        url = link.get("url", "")
        if url in date_map:
            link = dict(link)
            link["date"] = date_map[url]
            link["dateConfidence"] = "high"
        result.append(link)
    return result


def _scrape_iframe(page: Page, src: dict) -> tuple[str, list[dict]]:
    """Extract content from iframe-based pages like TikTok API docs."""
    # Wait progressively for iframe content to load (up to 90s)
    for attempt in range(18):
        page.wait_for_timeout(5000)
        for frame in page.frames[1:]:
            try:
                text = frame.inner_text("body")
                if len(text) > 500:
                    cleaned = _clean_text(text)
                    print(f"  iframe loaded after {(attempt+1)*5}s ({len(cleaned)} chars)")
                    return cleaned, []
            except Exception:
                pass

    # Fallback: try to get content from page.content() HTML
    try:
        html = page.content()
        if "What's New" in html or "changelog" in html.lower():
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, "html.parser")
            text = _clean_text(soup.get_text())
            if len(text) > 500:
                print(f"  iframe fallback via HTML ({len(text)} chars)")
                return text, []
    except Exception:
        pass

    print("  iframe: content not loaded after 90s")
    return "", []


def _extract_links(page: Page, base_url: str) -> list[dict]:
    """Extract article links with per-link date resolution using multiple DOM strategies."""
    raw_links = page.evaluate(r"""() => {
        const MONTH = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};

        function toISO(s) {
            if (!s) return '';
            s = s.trim();
            // Already ISO
            let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
            // datetime attr — may be full ISO
            try {
                const d = new Date(s);
                if (!isNaN(d.getTime()) && d.getFullYear() >= 2020) {
                    return d.toISOString().substring(0, 10);
                }
            } catch(e) {}
            // "May 12, 2026" or "May 12 2026"
            m = s.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i);
            if (m) {
                const mo = MONTH[m[1].substring(0,3).toLowerCase()];
                if (mo) return `${m[3]}-${String(mo).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`;
            }
            // "12 May 2026"
            m = s.match(/\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})\b/i);
            if (m) {
                const mo = MONTH[m[2].substring(0,3).toLowerCase()];
                if (mo) return `${m[3]}-${String(mo).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
            }
            return '';
        }

        // Date pattern for scanning text nodes
        const DATE_RE = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}/i;

        function findDateForLink(a) {
            // Strategy: check link's own text first (most reliable for carousel layouts),
            // then walk up to find card-scoped date elements.

            // S1: Date embedded in the link's own text (e.g. "May 12, 2026\nTitle...")
            // This is most reliable because it can't be shared across cards.
            const linkText = a.innerText || '';
            let m = linkText.match(DATE_RE);
            if (m) {
                const iso = toISO(m[0]);
                if (iso) return {date: iso, confidence: 'high'};
            }

            // S2: Date in URL path  /2026/05/07/
            const urlM = a.href.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
            if (urlM) {
                return {date: `${urlM[1]}-${urlM[2]}-${urlM[3]}`, confidence: 'high'};
            }

            // S3: Walk up to find the card boundary, then look for date elements inside
            let card = null;
            let el = a.parentElement;
            for (let i = 0; i < 8 && el; i++) {
                const tag = el.tagName;
                const cls = (el.className || '').toLowerCase();
                if (tag === 'ARTICLE' || tag === 'LI' ||
                    /\b(post|card|item|entry|blog-post|article)\b/.test(cls)) {
                    card = el;
                    break;
                }
                el = el.parentElement;
            }
            const scope = card || a.parentElement;

            if (scope) {
                // S3a: <time datetime> inside the card
                const t = scope.querySelector('time[datetime]');
                if (t) {
                    const iso = toISO(t.getAttribute('datetime'));
                    if (iso) return {date: iso, confidence: 'high'};
                }
                // S3b: element with date-specific class inside the card
                const dateEl = scope.querySelector(
                    '[class*="date"]:not([class*="update"]):not([class*="deadline"]), ' +
                    '[class*="publish"], [class*="posted"], [class*="stamp"], ' +
                    'time'
                );
                if (dateEl && dateEl !== scope) {
                    const txt = dateEl.getAttribute('datetime') || dateEl.innerText.trim();
                    const iso = toISO(txt);
                    if (iso) return {date: iso, confidence: 'high'};
                }
                // S3c: scan card text for date pattern — but only if card is small
                // (avoids picking up dates from unrelated content in large containers)
                const cardText = scope.innerText || '';
                if (cardText.length < 800) {
                    m = cardText.match(DATE_RE);
                    if (m) {
                        const iso = toISO(m[0]);
                        if (iso) return {date: iso, confidence: 'medium'};
                    }
                }
            }

            return {date: '', confidence: 'none'};
        }

        const results = [];
        const seen = new Set();

        document.querySelectorAll('a[href]').forEach(a => {
            const href = a.href;
            if (seen.has(href)) return;

            // Title extraction: prefer heading inside link, then aria-label, then text
            let text = '';
            const heading = a.querySelector('h1,h2,h3,h4,[class*="title"],[class*="heading"]');
            if (heading) text = heading.innerText.trim();
            if (!text) text = a.getAttribute('aria-label') || '';
            if (!text) text = a.innerText.trim();
            if (!text || text.length < 5) return;

            seen.add(href);

            const {date, confidence} = findDateForLink(a);

            // Snippet: nearest paragraph in card
            let snippet = '';
            let el = a.parentElement;
            for (let i = 0; i < 6 && el; i++) {
                const p = el.querySelector('p,[class*="desc"],[class*="excerpt"],[class*="summary"]');
                if (p && p.innerText.trim().length > 20) {
                    snippet = p.innerText.trim().substring(0, 300);
                    break;
                }
                el = el.parentElement;
            }

            results.push({href, text: text.substring(0, 300), date, dateConfidence: confidence, snippet});
        });
        return results;
    }""")

    results = []
    for link in raw_links:
        href = link.get("href", "")
        raw_title = _clean_text(link.get("text", ""))

        if not _is_article_link(href, base_url):
            continue
        if _is_cta_text(raw_title):
            continue

        # Strip leading date prefix from title text (e.g. "May 12, 2026\nActual Title")
        title, date_from_title = _strip_date_prefix(raw_title)
        if len(title) < 10:
            continue

        # Prefer date found by DOM strategy; fall back to date extracted from title text
        date = link.get("date", "")
        confidence = link.get("dateConfidence", "none")
        if not date and date_from_title:
            date = date_from_title
            confidence = "high"

        results.append({
            "title": title,
            "url": href,
            "date": date,
            "dateConfidence": confidence,
            "snippet": _clean_text(link.get("snippet", "")),
        })
    return results


def _strip_date_prefix(text: str) -> tuple[str, str]:
    """Remove a leading date string from text; return (clean_text, iso_date_or_empty)."""
    import re as _re
    _MONTH = {"jan":1,"feb":2,"mar":3,"apr":4,"may":5,"jun":6,
               "jul":7,"aug":8,"sep":9,"oct":10,"nov":11,"dec":12}
    _PREFIX = _re.compile(
        r"^(?:"
        r"(?P<mdy>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})"
        r"|(?P<dmy>\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})"
        r"|(?P<iso>\d{4}-\d{2}-\d{2})"
        r")[\s\n,.\-]*",
        _re.I,
    )
    m = _PREFIX.match(text)
    if not m:
        # Date might be anywhere in first line — extract but don't strip
        first_line = text.split("\n")[0]
        return first_line.strip() or text.strip(), ""

    date_str = m.group(0).strip().rstrip(",.-")
    rest = text[m.end():].split("\n")[0].strip()
    if not rest:
        rest = text[m.end():].strip()

    # Parse the date
    iso = ""
    if m.group("iso"):
        iso = m.group("iso")
    elif m.group("mdy"):
        dm = _re.search(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})", date_str, _re.I)
        if dm:
            mo = _MONTH.get(dm.group(1)[:3].lower(), 0)
            if mo:
                iso = f"{dm.group(3)}-{mo:02d}-{int(dm.group(2)):02d}"
    elif m.group("dmy"):
        dm = _re.search(r"(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})", date_str, _re.I)
        if dm:
            mo = _MONTH.get(dm.group(2)[:3].lower(), 0)
            if mo:
                iso = f"{dm.group(3)}-{mo:02d}-{int(dm.group(1)):02d}"

    return rest or text.strip(), iso



def _is_cta_text(text: str) -> bool:
    normalized = text.lower().strip()
    if normalized in CTA_PATTERNS:
        return True
    if len(normalized.split()) <= 3 and any(p in normalized for p in CTA_PATTERNS):
        return True
    return False


def _is_article_link(href: str, base_url: str) -> bool:
    import re
    from urllib.parse import urlparse
    href_lower = href.lower()
    path = urlparse(href_lower).path

    skip_substrings = [
        "/login", "/signup", "/register", "/search",
        "/privacy", "/terms", "/cookie", "/about",
        "javascript:", "mailto:", "#",
        "/tag/", "/category/", "/author/",
        ".pdf", ".zip", ".exe",
        # TikTok navigation/solution pages
        "/how-it-works", "/goals/", "/solutions/", "/products/",
        "/business-center", "/business-account", "/academy",
        "/inspiration", "/insights", "/creative-center",
        "/creativeexchange", "/marketplace",
        "/seller", "/shop", "/affiliates",
        "/brand-safety", "/marketing-partners",
        "/creatormarketplace", "/creativecenter",
        "/help/",
        # Meta developer docs navigation
        "/business/redirect/", "/docs/threads/", "/docs/facebook-platform",
        "/docs/messenger-platform", "/docs/instagram-platform",
        "/docs/marketing-api/", "/docs/pages/",
        "/reference/", "/tools-and-resources",
        "/troubleshooting", "/debug-access-token",
        # External/non-article sites
        "bytedance.com", "careers.tiktok.com",
        "forgood", "partners.tiktok.com",
        # LinkedIn campaign manager / training
        "/campaignmanager/", "training.marketing.linkedin.com",
        # LinkedIn legal/settings/utility pages
        "/legal/", "/psettings/", "/accessibility", "/topics",
        # LinkedIn nav links with tracking
        "trk=lms-blog", "trk=content_footer",
    ]

    for p in skip_substrings:
        if p in href_lower:
            return False

    # Skip LinkedIn category/archive pages (URL path ends with category slug)
    linkedin_category_endings = (
        "/channel", "/smb", "/brand", "/skills",
        "/marketing-toolbox", "/workplace-culture", "/vertical-insights",
        "/linkedin-ads", "/linkedin-pages", "/customer-stories",
        "/collective-conversation", "/lead-generation", "/measurement",
        "/targeting", "/trends-tips", "/small-business", "/ai-search",
        "/research-and-insights", "/marketing-collective",
        "/brand-building", "/social-media", "/diversity-in-marketing",
        "/content-marketing", "/marketing-with-linkedin",
        "/social-media-marketing",
    )
    for cat in linkedin_category_endings:
        if path.endswith(cat) or path.endswith(cat + "/"):
            return False

    # Skip Meta Business News locale/home links. Article pages have a slug after
    # /business/news/.
    if re.search(r'/business/news/?$', path):
        return False

    # Skip blog homepage URLs (no slug after /blog)
    if re.search(r'/blog/?$', href_lower):
        return False

    # Skip root domain links (no path)
    if re.match(r'^https?://[^/]+/?$', href_lower):
        return False

    return True


def _clean_text(text: str) -> str:
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    return text.strip()
