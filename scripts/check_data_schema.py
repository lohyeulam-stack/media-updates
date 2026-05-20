"""
scripts/check_data_schema.py — single source of truth for runtime data validation.

Mirrors src/lib/types.ts and the rules in docs/adr/0005-data-schema-contract.md.
This script is invoked by:
  - .github/workflows/harness-checks.yml (every PR)
  - .github/workflows/ci.yml (legacy, kept until ci.yml is migrated)
  - scripts/fetch_updates.py Stage 3 validator (via subprocess)
  - manual local check: `python scripts/check_data_schema.py`

Exit code:
  0 — all checks passed
  1 — one or more violations found (full list printed)

The script is intentionally dependency-free (stdlib only) so it runs anywhere.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any, Iterable

# ---- Canonical enums (mirror src/lib/types.ts) ----

PLATFORMS: set[str] = {
    # social
    "tiktok", "meta", "snapchat", "pinterest", "x", "linkedin", "quora",
    # search
    "google", "apple", "bing",
    # video
    "youtube", "spotify", "netflix", "uber",
    # asia
    "kwai", "line", "naver", "kakao", "bigo", "newsbreak", "smartnews",
    "vk", "yandex", "mediago",
    # dsp
    "dv360", "applovin", "ironsource", "mintegral", "pangle", "amazon",
    "ttd", "taboola", "outbrain", "criteo", "moloco", "miq",
    # cn-oem
    "huawei", "xiaomi", "oppo", "vivo",
}

CATEGORIES: set[str] = {
    "ad-product", "api-change", "policy", "creative",
    "measurement", "targeting", "automation", "other",
}

IMPORTANCE: set[str] = {"high", "medium", "low"}

REQUIRED_FIELDS: set[str] = {
    "id", "date", "platform", "title", "summary",
    "category", "importance", "source", "sourceUrl",
    "tags", "fetchedAt",
}

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
WEEK_RE = re.compile(r"^\d{4}-W\d{2}$")
URL_RE = re.compile(r"^https?://", re.IGNORECASE)
HTML_RESIDUE_RE = re.compile(r"<[A-Za-z]")
CTA_TITLES = {
    "learn more", "read more", "see more", "view more",
    "get started", "sign up", "click here",
}

# Legacy data quality issues — files that violated ≥80% summary coverage
# *before* check_data_schema.py was mechanized. The check is downgraded to
# advisory for these specific paths so existing PRs can land while a backfill
# is scheduled. To remove an entry: re-run
#   python scripts/fetch_updates.py --mode=backfill --backfill-year=2026 \
#       --backfill-start=<m> --backfill-end=<m>
# with MINIMAX_API_KEY set, then drop the path from this set.
LEGACY_LOW_SUMMARY_FILES: set[str] = {
    "data/weekly/2026-W05.json",  # 34% summary coverage (Feb 2026)
    "data/weekly/2026-W09.json",  # 40% summary coverage (Feb–Mar 2026)
}


def _check_record(idx: int, item: dict[str, Any], file_id: str) -> tuple[list[str], bool]:
    """Return (hard_issues, has_empty_summary). Empty summary is advisory."""
    where = f"{file_id}[{idx}]"
    issues: list[str] = []
    empty_summary = False

    missing = REQUIRED_FIELDS - set(item)
    if missing:
        issues.append(f"{where} missing fields: {sorted(missing)}")
        return issues, empty_summary  # bail early; further checks would mislead

    if item["platform"] not in PLATFORMS:
        issues.append(f"{where} unknown platform '{item['platform']}' — register in src/lib/types.ts (ADR 0006)")
    if item["category"] not in CATEGORIES:
        issues.append(f"{where} unknown category '{item['category']}' — must be one of {sorted(CATEGORIES)}")
    if item["importance"] not in IMPORTANCE:
        issues.append(f"{where} invalid importance '{item['importance']}' — must be high/medium/low")
    if not isinstance(item.get("tags"), list):
        issues.append(f"{where} tags must be a list, got {type(item.get('tags')).__name__}")

    title = item.get("title") or ""
    if not title.strip():
        issues.append(f"{where} empty title")
    elif title.strip().lower() in CTA_TITLES:
        issues.append(f"{where} CTA-like title '{title}' — add to validator.py CTA_GARBAGE")
    elif HTML_RESIDUE_RE.search(title):
        issues.append(f"{where} HTML residue in title: '{title[:80]}'")

    summary = item.get("summary") or ""
    if not summary.strip():
        empty_summary = True
    elif HTML_RESIDUE_RE.search(summary):
        issues.append(f"{where} HTML residue in summary")

    if not DATE_RE.match(str(item.get("date") or "")):
        issues.append(f"{where} invalid date format '{item.get('date')}' — must be YYYY-MM-DD")

    week = item.get("week")
    if week is not None and not WEEK_RE.match(str(week)):
        issues.append(f"{where} invalid week '{week}' — must be YYYY-WNN (ISO 8601), see ADR 0002")

    src_url = item.get("sourceUrl") or ""
    if not URL_RE.match(src_url):
        issues.append(f"{where} sourceUrl must start with http(s)://, got '{src_url[:80]}'")

    return issues, empty_summary


def _check_file(path: Path, expect_week: str | None = None) -> tuple[list[str], list[str]]:
    """Return (hard_issues, advisories)."""
    file_id = str(path)
    issues: list[str] = []
    advisories: list[str] = []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return [f"{file_id} does not exist"], advisories
    except json.JSONDecodeError as exc:
        return [f"{file_id} is not valid JSON: {exc}"], advisories

    if not isinstance(data, list):
        return [f"{file_id} must be a JSON array"], advisories

    seen_ids: set[str] = set()
    empty_summary_count = 0
    for idx, item in enumerate(data):
        if not isinstance(item, dict):
            issues.append(f"{file_id}[{idx}] is not an object")
            continue
        item_id = item.get("id")
        if item_id and item_id in seen_ids:
            issues.append(f"{file_id} duplicate id: {item_id}")
        if item_id:
            seen_ids.add(item_id)
        rec_issues, empty_sum = _check_record(idx, item, file_id)
        issues.extend(rec_issues)
        if empty_sum:
            empty_summary_count += 1
        if expect_week and item.get("week") and item["week"] != expect_week:
            issues.append(
                f"{file_id}[{idx}] week='{item['week']}' does not match filename "
                f"'{expect_week}' (ADR 0002 invariant)"
            )

    # Per-file aggregate: ≥80% must have non-empty summaries (matches Stage 3
    # validator round 3 in scripts/validator.py).
    if data:
        non_empty_pct = (len(data) - empty_summary_count) / len(data)
        # Normalize the file path so allowlist entries match regardless of
        # absolute vs relative invocation.
        try:
            rel_path = str(path.relative_to(Path(__file__).resolve().parent.parent))
            rel_path = rel_path.replace("\\", "/")
        except ValueError:
            rel_path = str(path)
        is_legacy = rel_path in LEGACY_LOW_SUMMARY_FILES

        if non_empty_pct < 0.80:
            msg = (
                f"{file_id} only {non_empty_pct:.0%} of {len(data)} records have summaries "
                f"(min 80%, ADR 0003 round 3)"
            )
            if is_legacy:
                advisories.append(
                    msg + " — LEGACY exemption; remove from LEGACY_LOW_SUMMARY_FILES after backfill"
                )
            else:
                issues.append(msg)
        elif empty_summary_count:
            advisories.append(
                f"{file_id} has {empty_summary_count}/{len(data)} empty summaries "
                f"(under threshold; advisory only)"
            )

    return issues, advisories


def _check_monthly_md(path: Path) -> list[str]:
    issues: list[str] = []
    try:
        text = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return [f"{path} does not exist"]

    char_count = len(text)
    if char_count < 500:
        issues.append(f"{path} too short ({char_count} chars; min 500)")
    elif char_count > 20000:
        issues.append(f"{path} too long ({char_count} chars; max 20000)")
    if not re.search(r"\[[^\]]+\]\([^)]+\)", text):
        issues.append(f"{path} contains no Markdown hyperlinks (ADR 0003 requires inline links)")
    if HTML_RESIDUE_RE.search(text):
        issues.append(f"{path} contains HTML-like residue")

    return issues


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    data_dir = repo_root / "data"

    if not data_dir.is_dir():
        print(f"data/ not found at {data_dir}", file=sys.stderr)
        return 1

    all_issues: list[str] = []
    all_advisories: list[str] = []

    updates = data_dir / "updates.json"
    if updates.exists():
        i, a = _check_file(updates)
        all_issues.extend(i)
        all_advisories.extend(a)
    else:
        all_issues.append("data/updates.json does not exist")

    weekly_dir = data_dir / "weekly"
    if weekly_dir.is_dir():
        for w in sorted(weekly_dir.glob("*.json")):
            stem = w.stem
            if not WEEK_RE.match(stem):
                all_issues.append(
                    f"{w} has non-ISO filename — must be YYYY-WNN (ADR 0002)"
                )
                continue
            i, a = _check_file(w, expect_week=stem)
            all_issues.extend(i)
            all_advisories.extend(a)

    monthly_dir = data_dir / "monthly"
    if monthly_dir.is_dir():
        for m in sorted(monthly_dir.glob("*.md")):
            if not re.match(r"^\d{4}-\d{2}$", m.stem):
                all_issues.append(f"{m} has non-YYYY-MM filename")
                continue
            all_issues.extend(_check_monthly_md(m))

    archive_dir = data_dir / "archive"
    if archive_dir.is_dir():
        for a in sorted(archive_dir.rglob("*.json")):
            i, adv = _check_file(a)
            all_issues.extend(i)
            all_advisories.extend(adv)

    if all_advisories:
        print("Advisories (non-blocking):")
        for adv in all_advisories[:20]:
            print(f"  · {adv}")
        if len(all_advisories) > 20:
            print(f"  · ... and {len(all_advisories) - 20} more")
        print()

    if all_issues:
        for issue in all_issues[:100]:
            print(issue)
        if len(all_issues) > 100:
            print(f"... and {len(all_issues) - 100} more")
        print(f"\nFAIL: {len(all_issues)} schema issue(s)", file=sys.stderr)
        return 1

    print("OK: data schema valid (updates.json + weekly/ + monthly/ + archive/)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
