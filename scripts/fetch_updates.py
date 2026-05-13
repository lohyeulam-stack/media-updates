"""Main entry — weekly scrape + AI extract + monthly report + self-validation."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).parent))

from ai_processor import extract_and_summarize, generate_monthly_report
from dedup import deduplicate
from dedup_similarity import deduplicate_by_similarity
from date_validator import validate_batch
from scraper import scrape_all
from sources_config import SOURCES
from validator import validate_weekly, validate_monthly_report, print_report

DATA_DIR = Path(__file__).parent.parent / "data"
WEEKLY_DIR = DATA_DIR / "weekly"
MONTHLY_DIR = DATA_DIR / "monthly"
UPDATES_FILE = DATA_DIR / "updates.json"
LOCAL_TZ = ZoneInfo(os.environ.get("MEDIA_UPDATES_TZ", "Asia/Shanghai"))


def now_local() -> datetime:
    return datetime.now(LOCAL_TZ)


def get_last_week_range() -> tuple[str, str, str]:
    """Return the last completed Monday-Sunday week in the business timezone."""
    today = now_local()
    last_monday = today - timedelta(days=today.weekday() + 7)
    last_sunday = last_monday + timedelta(days=6)
    iso = last_monday.isocalendar()
    week_label = f"{iso.year}-W{iso.week:02d}"
    return last_monday.strftime("%Y-%m-%d"), last_sunday.strftime("%Y-%m-%d"), week_label


def get_current_week_range() -> tuple[str, str, str]:
    """Return the current Monday-Sunday week in the business timezone."""
    today = now_local()
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)
    iso = today.isocalendar()
    week_label = f"{iso.year}-W{iso.week:02d}"
    return monday.strftime("%Y-%m-%d"), sunday.strftime("%Y-%m-%d"), week_label


def get_rolling_range(days: int) -> tuple[str, str, str]:
    """Return a rolling date window ending today in the business timezone."""
    today = now_local().date()
    start = today - timedelta(days=max(days, 1) - 1)
    return start.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d"), f"rolling-{days}d"


def get_default_month_label() -> str:
    """Default monthly report month.

    The scheduled month-end workflow runs at 22:00 UTC on the last UTC day of
    the month. Using UTC here keeps that run aligned to the month being closed,
    even though it is already the next morning in Asia/Shanghai.
    """
    return datetime.now(timezone.utc).strftime("%Y-%m")


def load_json(path: Path) -> list[dict]:
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_json(path: Path, data: list | dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def save_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def _normalize_date(date_str: str) -> str:
    """Normalize date string to YYYY-MM-DD format."""
    if not date_str:
        return ""
    # Already in correct format
    if len(date_str) == 10 and date_str[4] == '-' and date_str[7] == '-':
        return date_str
    # Handle ISO timestamps like 2026-05-13T10:00:00+08:00
    if 'T' in date_str:
        return date_str[:10]
    # Handle formats like 2026/05/13
    if '/' in date_str:
        parts = date_str.split('/')
        if len(parts) == 3 and len(parts[0]) == 4:
            return f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
    # Handle formats like 2026-5-1
    parts = date_str.split('-')
    if len(parts) == 3 and len(parts[0]) == 4:
        return f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
    return date_str


def _normalize_match_text(text: str) -> str:
    text = re.sub(r"[^\w\s]", " ", (text or "").lower())
    return re.sub(r"\s+", " ", text).strip()


def _resolve_source_url(art: dict, page) -> str:
    source_url = art.get("sourceUrl", "") or ""
    if source_url and source_url != page.url:
        return source_url

    titles = [
        _normalize_match_text(art.get("titleOriginal", "")),
        _normalize_match_text(art.get("title", "")),
    ]
    titles = [t for t in titles if len(t) >= 12]
    if not titles:
        return source_url or page.url

    best_url = ""
    best_score = 0.0
    for link in page.links:
        link_title = _normalize_match_text(link.get("title", ""))
        if not link_title:
            continue
        for title in titles:
            if title in link_title or link_title in title:
                score = 1.0
            else:
                score = SequenceMatcher(None, title, link_title).ratio()
            if score > best_score:
                best_score = score
                best_url = link.get("url", "")

    return best_url if best_url and best_score >= 0.72 else (source_url or page.url)


def _extract_for_page(page, week_start, week_end, week_label, now_iso, assign_week_from_date: bool = False):
    articles = extract_and_summarize(
        page_text=page.text,
        links=page.links,
        platform=page.platform,
        source_name=page.source_name,
        week_start=week_start,
        week_end=week_end,
    )
    results = []
    for i, art in enumerate(articles):
        art_date = art.get("date", "") or ""
        date_confidence = art.get("dateConfidence", "medium")
        # Only use week_end as fallback if no date at all - mark as low confidence
        if not art_date:
            art_date = week_end
            date_confidence = "low"
        item_week = _date_to_week_label(art_date) if assign_week_from_date else week_label
        source_url = _resolve_source_url(art, page)
        results.append({
            "id": f"{page.platform}-{art_date}-{i+1:03d}",
            "date": art_date,
            "week": item_week,
            "platform": page.platform,
            "title": art.get("title", ""),
            "titleOriginal": art.get("titleOriginal", ""),
            "summary": art.get("summary", ""),
            "category": art.get("category", "other"),
            "importance": art.get("importance", "medium"),
            "source": art.get("source", page.source_name),
            "sourceUrl": source_url,
            "tags": art.get("tags", []),
            "fetchedAt": now_iso,
            "dateConfidence": art.get("dateConfidence", "medium"),
        })
    return results


def _extract_for_page_backfill(page, month_start, month_end, now_iso):
    articles = extract_and_summarize(
        page_text=page.text,
        links=page.links,
        platform=page.platform,
        source_name=page.source_name,
        week_start=month_start,
        week_end=month_end,
    )
    results = []
    for i, art in enumerate(articles):
        art_date = art.get("date", "") or month_end
        source_url = _resolve_source_url(art, page)
        iso_week = _date_to_week_label(art_date)
        results.append({
            "id": f"{page.platform}-{art_date}-{i+1:03d}",
            "date": art_date,
            "week": iso_week,
            "platform": page.platform,
            "dateConfidence": art.get("dateConfidence", "medium"),
            "title": art.get("title", ""),
            "titleOriginal": art.get("titleOriginal", ""),
            "summary": art.get("summary", ""),
            "category": art.get("category", "other"),
            "importance": art.get("importance", "medium"),
            "source": art.get("source", page.source_name),
            "sourceUrl": source_url,
            "tags": art.get("tags", []),
            "fetchedAt": now_iso,
        })
    return results


def run_weekly(week_start: str, week_end: str, week_label: str, rolling: bool = False) -> None:
    label = "Rolling window" if rolling else "Week"
    print(f"[{label}] {week_label}: {week_start} ~ {week_end}")

    pages = scrape_all(SOURCES)
    print(f"\n[Scrape] Collected {len(pages)} pages from {len(SOURCES)} sources")

    now_iso = now_local().isoformat()
    all_new: list[dict] = []

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {
            executor.submit(_extract_for_page, page, week_start, week_end, week_label, now_iso, rolling): page
            for page in pages
        }
        for future in as_completed(futures):
            page = futures[future]
            try:
                results = future.result()
                if results:
                    print(f"[AI] Extracted {len(results)} articles from {page.source_name}")
                    all_new.extend(results)
            except Exception as e:
                print(f"[AI] Error for {page.source_name}: {e}")

    print(f"\n[Total] {len(all_new)} articles extracted")

    # Filter articles by date range before deduplication
    filtered = []
    for art in all_new:
        art_date = _normalize_date(art.get("date", ""))
        art["date"] = art_date  # Ensure normalized date is saved
        if art_date and week_start <= art_date <= week_end:
            filtered.append(art)
        elif not art_date:
            filtered.append(art)

    if len(filtered) < len(all_new):
        print(f"[Filter] {len(filtered)} articles within date range (removed {len(all_new) - len(filtered)} out-of-range)")

    # Validate dates and automatically filter out suspicious articles
    validation_result = validate_batch(filtered)
    if validation_result["suspicious"]:
        print(f"[Date Validation] Found {len(validation_result['suspicious'])} articles with suspicious dates - removing them:")
        for item in validation_result["suspicious"][:5]:
            print(f"  - {item['platform']}: {item['title']}... ({item['date']})")
            print(f"    Issues: {', '.join(item['issues'])}")

        suspicious_ids = {item['id'] for item in validation_result['suspicious']}
        filtered = [art for art in filtered if art.get('id') not in suspicious_ids]
        print(f"[Date Validation] {len(filtered)} articles remaining after removing suspicious dates")

    # Apply cosine similarity deduplication first
    similarity_deduped = deduplicate_by_similarity(filtered, threshold=0.70)
    if len(similarity_deduped) < len(filtered):
        print(f"[Similarity Dedup] {len(similarity_deduped)} articles after removing {len(filtered) - len(similarity_deduped)} similar duplicates")

    existing = load_json(UPDATES_FILE)
    unique = deduplicate(similarity_deduped, existing)
    print(f"[Dedup] {len(unique)} new unique articles")

    if unique:
        all_updates = unique + existing
        all_updates.sort(key=lambda x: x.get("date", ""), reverse=True)
        save_json(UPDATES_FILE, all_updates)
        print(f"[Save] {len(all_updates)} total in updates.json")

        by_week: dict[str, list[dict]] = {}
        for item in unique:
            by_week.setdefault(item.get("week") or week_label, []).append(item)

        for wk, items in sorted(by_week.items()):
            week_file = WEEKLY_DIR / f"{wk}.json"
            week_existing = load_json(week_file)
            week_merged = deduplicate(items, week_existing)
            if week_merged:
                save_json(week_file, week_existing + week_merged)
            print(f"[Weekly] {wk}: {len(week_merged)} new items")

    result = validate_weekly(unique or all_new, week_start, week_end)
    print_report(result, f"{'Rolling' if rolling else 'Weekly'} {week_label}")


def run_monthly(month_label: str | None = None) -> None:
    if not month_label:
        month_label = get_default_month_label()
    print(f"[Monthly] Generating report for {month_label}")

    all_updates = load_json(UPDATES_FILE)
    month_updates = [u for u in all_updates if u.get("date", "").startswith(month_label)]
    print(f"[Monthly] {len(month_updates)} updates this month")

    report = generate_monthly_report(month_label, month_updates)

    result = validate_monthly_report(report)
    print_report(result, f"Monthly {month_label}")

    report_file = MONTHLY_DIR / f"{month_label}.md"
    save_text(report_file, report)
    print(f"[Monthly] Report saved to {report_file}")


def run_backfill(year: int, start_month: int, end_month: int) -> None:
    """Backfill historical data by scanning all sources for a date range."""
    from datetime import date

    for month in range(start_month, end_month + 1):
        first_day = date(year, month, 1)
        if month == 12:
            last_day = date(year, 12, 31)
        else:
            last_day = date(year, month + 1, 1) - timedelta(days=1)

        month_start = first_day.strftime("%Y-%m-%d")
        month_end = last_day.strftime("%Y-%m-%d")
        month_label = first_day.strftime("%Y-%m")

        print(f"\n{'='*60}")
        print(f"[Backfill] {month_label}: {month_start} ~ {month_end}")
        print(f"{'='*60}")

        pages = scrape_all(SOURCES)
        print(f"\n[Scrape] Collected {len(pages)} pages")

        now_iso = now_local().isoformat()
        all_new: list[dict] = []

        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = {
                executor.submit(_extract_for_page_backfill, page, month_start, month_end, now_iso): page
                for page in pages
            }
            for future in as_completed(futures):
                page = futures[future]
                try:
                    results = future.result()
                    if results:
                        print(f"[AI] Extracted {len(results)} articles from {page.source_name}")
                        all_new.extend(results)
                except Exception as e:
                    print(f"[AI] Error for {page.source_name}: {e}")

        print(f"\n[Total] {len(all_new)} articles extracted")

        # Filter articles by date range before deduplication
        filtered = []
        for art in all_new:
            art_date = _normalize_date(art.get("date", ""))
            art["date"] = art_date  # Ensure normalized date is saved
            if art_date and month_start <= art_date <= month_end:
                filtered.append(art)
            elif not art_date:
                filtered.append(art)

        if len(filtered) < len(all_new):
            print(f"[Filter] {len(filtered)} articles within date range (removed {len(all_new) - len(filtered)} out-of-range)")

        # Validate dates and automatically filter out suspicious articles
        validation_result = validate_batch(filtered)
        if validation_result["suspicious"]:
            print(f"[Date Validation] Found {len(validation_result['suspicious'])} articles with suspicious dates - removing them:")
            for item in validation_result["suspicious"][:5]:  # Show first 5
                print(f"  - {item['platform']}: {item['title']}... ({item['date']})")
                print(f"    Issues: {', '.join(item['issues'])}")

            # Automatically remove suspicious articles
            suspicious_ids = {item['id'] for item in validation_result['suspicious']}
            filtered = [art for art in filtered if art.get('id') not in suspicious_ids]
            print(f"[Date Validation] {len(filtered)} articles remaining after removing suspicious dates")

        # Apply cosine similarity deduplication first
        similarity_deduped = deduplicate_by_similarity(filtered, threshold=0.70)
        if len(similarity_deduped) < len(filtered):
            print(f"[Similarity Dedup] {len(similarity_deduped)} articles after removing {len(filtered) - len(similarity_deduped)} similar duplicates")

        existing = load_json(UPDATES_FILE)
        unique = deduplicate(similarity_deduped, existing)
        print(f"[Dedup] {len(unique)} new unique articles")

        if unique:
            all_updates = unique + existing
            all_updates.sort(key=lambda x: x.get("date", ""), reverse=True)
            save_json(UPDATES_FILE, all_updates)

            weeks_in_month: dict[str, list[dict]] = {}
            for u in unique:
                wk = u.get("week", "unknown")
                weeks_in_month.setdefault(wk, []).append(u)
            for wk, items in weeks_in_month.items():
                week_file = WEEKLY_DIR / f"{wk}.json"
                week_existing = load_json(week_file)
                week_merged = deduplicate(items, week_existing)
                save_json(week_file, week_existing + week_merged)
                print(f"[Weekly] {wk}: {len(week_merged)} new items")

        run_monthly(month_label)


def _date_to_week_label(date_str: str) -> str:
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d")
        iso = d.isocalendar()
        return f"{iso.year}-W{iso.week:02d}"
    except (ValueError, TypeError):
        return "unknown"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["weekly", "monthly", "both", "backfill"], default="weekly")
    parser.add_argument("--current-week", action="store_true")
    parser.add_argument("--rolling-days", type=int, default=0, help="Use a rolling date window ending today for weekly sync")
    parser.add_argument("--month", help="Monthly report month override in YYYY-MM format")
    parser.add_argument("--backfill-year", type=int, default=2026)
    parser.add_argument("--backfill-start", type=int, default=1)
    parser.add_argument("--backfill-end", type=int, default=4)
    args = parser.parse_args()

    print(f"[Start] {now_local().isoformat()} ({LOCAL_TZ.key})")

    if args.mode == "backfill":
        run_backfill(args.backfill_year, args.backfill_start, args.backfill_end)
    else:
        if args.mode in ("weekly", "both"):
            if args.rolling_days:
                ws, we, wl = get_rolling_range(args.rolling_days)
                run_weekly(ws, we, wl, rolling=True)
            elif args.current_week:
                ws, we, wl = get_current_week_range()
                run_weekly(ws, we, wl)
            else:
                ws, we, wl = get_last_week_range()
                run_weekly(ws, we, wl)

        if args.mode in ("monthly", "both"):
            run_monthly(args.month)

    print(f"\n[Done] {now_local().isoformat()} ({LOCAL_TZ.key})")


if __name__ == "__main__":
    main()
