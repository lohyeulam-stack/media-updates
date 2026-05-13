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


def scrape_all(sources: list[dict], max_concurrent: int = 4) -> list[PageContent]:
    results: list[PageContent] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Process sources in batches for better performance
        batch_size = max_concurrent
        for batch_start in range(0, len(sources), batch_size):
            batch = sources[batch_start:batch_start + batch_size]
            pages = []

            # Open all pages in batch simultaneously
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
                    content = _scrape_page(context, src)
                    results.append(content)
                    print(f"  Text: {len(content.text)} chars, Links: {len(content.links)}")
                except Exception as e:
                    print(f"  Error: {e}")
                finally:
                    context.close()

        browser.close()

    return results


def _scrape_page(context, src: dict) -> PageContent:
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
    raw_links = page.evaluate("""() => {
        const links = [];
        const seen = new Set();

        // Helper to parse various date formats to ISO
        function parseDate(dateStr) {
            if (!dateStr) return '';

            // Already ISO format
            if (/^\\d{4}-\\d{2}-\\d{2}/.test(dateStr)) {
                return dateStr.substring(0, 10);
            }

            // Try parsing with Date
            try {
                const d = new Date(dateStr);
                if (!isNaN(d.getTime())) {
                    return d.toISOString().substring(0, 10);
                }
            } catch (e) {}

            return dateStr; // Return original if can't parse
        }

        document.querySelectorAll('a[href]').forEach(a => {
            const href = a.href;

            // Try to find a proper article title
            // Priority: h1/h2/h3 inside the link > aria-label > link text
            let text = '';
            const heading = a.querySelector('h1, h2, h3, h4, [class*="title"], [class*="heading"]');
            if (heading) {
                text = heading.innerText.trim();
            }
            if (!text) {
                text = a.getAttribute('aria-label') || '';
            }
            if (!text) {
                // Use link text but skip if it looks like a CTA button
                text = a.innerText.trim();
            }
            text = text.substring(0, 300);

            if (href && text && text.length > 5 && !seen.has(href)) {
                seen.add(href);

                // Look for nearby date elements - expanded search
                const parent = a.closest('article, [class*="card"], [class*="post"], [class*="item"], [class*="entry"], section, li, div[class*="blog"]');
                let date = '';

                if (parent) {
                    // Try multiple selectors for date
                    const timeEl = parent.querySelector('time, [datetime], [class*="date"], [class*="time"], [class*="publish"], span[class*="meta"]');
                    if (timeEl) {
                        date = timeEl.getAttribute('datetime') ||
                               timeEl.getAttribute('data-date') ||
                               timeEl.innerText.trim();
                        date = parseDate(date);
                    }
                }

                // If no date found in parent, try meta tags in document
                if (!date) {
                    const metaDate = document.querySelector('meta[property="article:published_time"], meta[name="date"], meta[name="publish_date"]');
                    if (metaDate) {
                        date = parseDate(metaDate.getAttribute('content') || '');
                    }
                }

                // Also try to get a snippet from nearby paragraph
                let snippet = '';
                if (parent) {
                    const pEl = parent.querySelector('p, [class*="desc"], [class*="excerpt"], [class*="summary"]');
                    if (pEl) {
                        snippet = pEl.innerText.trim().substring(0, 300);
                    }
                }

                links.push({href, text, date, snippet});
            }
        });
        return links;
    }""")

    results = []
    for link in raw_links:
        href = link.get("href", "")
        title = _clean_text(link.get("text", ""))

        if not _is_article_link(href, base_url):
            continue
        if _is_cta_text(title):
            continue
        if len(title) < 10:
            continue

        results.append({
            "title": title,
            "url": href,
            "date": link.get("date", ""),
            "snippet": _clean_text(link.get("snippet", "")),
        })
    return results


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
