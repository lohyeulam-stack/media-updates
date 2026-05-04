"""Main entry — weekly scrape + AI extract + monthly report + self-validation."""

from __future__ import annotations

import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from ai_processor import extract_and_summarize, generate_monthly_report
from dedup import deduplicate
from scraper import scrape_all
from sources_config import SOURCES
from validator import validate_weekly, validate_monthly_report, print_report

DATA_DIR = Path(__file__).parent.parent / "data"
WEEKLY_DIR = DATA_DIR / "weekly"
MONTHLY_DIR = DATA_DIR / "monthly"
UPDATES_FILE = DATA_DIR / "updates.json"


def get_last_week_range() -> tuple[str, str, str]:
    today = datetime.now()
    last_monday = today - timedelta(days=today.weekday() + 7)
    last_sunday = last_monday + timedelta(days=6)
    week_label = f"{last_monday.year}-W{last_monday.isocalendar()[1]:02d}"
    return last_monday.strftime("%Y-%m-%d"), last_sunday.strftime("%Y-%m-%d"), week_label


def get_current_week_range() -> tuple[str, str, str]:
    today = datetime.now()
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)
    week_label = f"{today.year}-W{today.isocalendar()[1]:02d}"
    return monday.strftime("%Y-%m-%d"), sunday.strftime("%Y-%m-%d"), week_label


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


def _extract_for_page(page, week_start, week_end, week_label, now_iso):
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
        art_date = art.get("date", "") or week_end
        source_url = art.get("sourceUrl", "") or page.url
        results.append({
            "id": f"{page.platform}-{art_date}-{i+1:03d}",
            "date": art_date,
            "week": week_label,
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
        source_url = art.get("sourceUrl", "") or page.url
        iso_week = _date_to_week_label(art_date)
        results.append({
            "id": f"{page.platform}-{art_date}-{i+1:03d}",
            "date": art_date,
            "week": iso_week,
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
        })
    return results


def run_weekly(week_start: str, week_end: str, week_label: str) -> None:
    print(f"[Week] {week_label}: {week_start} ~ {week_end}")

    pages = scrape_all(SOURCES)
    print(f"\n[Scrape] Collected {len(pages)} pages from {len(SOURCES)} sources")

    now_iso = datetime.now().isoformat()
    all_new: list[dict] = []

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {
            executor.submit(_extract_for_page, page, week_start, week_end, week_label, now_iso): page
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

    existing = load_json(UPDATES_FILE)
    unique = deduplicate(all_new, existing)
    print(f"[Dedup] {len(unique)} new unique articles")

    if unique:
        all_updates = unique + existing
        all_updates.sort(key=lambda x: x.get("date", ""), reverse=True)
        save_json(UPDATES_FILE, all_updates)
        print(f"[Save] {len(all_updates)} total in updates.json")

        week_file = WEEKLY_DIR / f"{week_label}.json"
        week_existing = load_json(week_file)
        week_merged = deduplicate(unique, week_existing)
        save_json(week_file, week_existing + week_merged)
        print(f"[Weekly] Saved to {week_file}")

    result = validate_weekly(unique or all_new, week_start, week_end)
    print_report(result, f"Weekly {week_label}")


def run_monthly(month_label: str | None = None) -> None:
    if not month_label:
        month_label = datetime.now().strftime("%Y-%m")
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

        now_iso = datetime.now().isoformat()
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

        existing = load_json(UPDATES_FILE)
        unique = deduplicate(all_new, existing)
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
        return f"{iso[0]}-W{iso[1]:02d}"
    except (ValueError, TypeError):
        return "unknown"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["weekly", "monthly", "both", "backfill"], default="weekly")
    parser.add_argument("--current-week", action="store_true")
    parser.add_argument("--backfill-year", type=int, default=2026)
    parser.add_argument("--backfill-start", type=int, default=1)
    parser.add_argument("--backfill-end", type=int, default=4)
    args = parser.parse_args()

    print(f"[Start] {datetime.now().isoformat()}")

    if args.mode == "backfill":
        run_backfill(args.backfill_year, args.backfill_start, args.backfill_end)
    else:
        if args.mode in ("weekly", "both"):
            if args.current_week:
                ws, we, wl = get_current_week_range()
            else:
                ws, we, wl = get_last_week_range()
            run_weekly(ws, we, wl)

        if args.mode in ("monthly", "both"):
            run_monthly()

    print(f"\n[Done] {datetime.now().isoformat()}")


if __name__ == "__main__":
    main()
