"""Data quality validator — 5 checks for automated self-verification."""

from __future__ import annotations

import json
import re
from datetime import datetime


CTA_GARBAGE = {"learn more", "read more", "see more", "view more", "get started", "sign up"}


def validate_weekly(data: list[dict], week_start: str, week_end: str) -> dict:
    results = {
        "pass": True,
        "checks": [],
        "total": len(data),
    }

    c1 = _check_dates(data, week_start, week_end)
    c2 = _check_no_garbage_titles(data)
    c3 = _check_summaries(data)
    c4 = _check_no_html(data)
    c5 = _check_structure(data)

    results["checks"] = [c1, c2, c3, c4, c5]
    results["pass"] = all(c["pass"] for c in results["checks"])
    return results


def validate_monthly_report(report_md: str) -> dict:
    results = {
        "pass": True,
        "checks": [],
    }

    c1 = {"name": "report_not_empty", "pass": len(report_md) > 200}
    c2 = {"name": "has_platform_sections", "pass": report_md.count("##") >= 2}
    c3 = {"name": "has_hyperlinks", "pass": bool(re.search(r'\[.+?\]\(https?://.+?\)', report_md))}
    c4 = {"name": "no_raw_json", "pass": '"platform"' not in report_md}
    c5 = {"name": "reasonable_length", "pass": 500 < len(report_md) < 20000}

    results["checks"] = [c1, c2, c3, c4, c5]
    results["pass"] = all(c["pass"] for c in results["checks"])
    return results


def _check_dates(data: list[dict], start: str, end: str) -> dict:
    bad = [u for u in data if u.get("date", "") and (u["date"] < start or u["date"] > end)]
    return {
        "name": "dates_in_range",
        "pass": len(bad) == 0,
        "detail": f"{len(bad)} items out of range" if bad else "OK",
    }


def _check_no_garbage_titles(data: list[dict]) -> dict:
    bad = [u for u in data if u.get("title", "").lower().strip() in CTA_GARBAGE]
    return {
        "name": "no_garbage_titles",
        "pass": len(bad) == 0,
        "detail": f"{len(bad)} garbage titles" if bad else "OK",
    }


def _check_summaries(data: list[dict]) -> dict:
    missing = [u for u in data if not u.get("summary")]
    ratio = 1 - len(missing) / max(len(data), 1)
    return {
        "name": "summaries_present",
        "pass": ratio >= 0.8,
        "detail": f"{ratio:.0%} have summaries ({len(missing)} missing)",
    }


def _check_no_html(data: list[dict]) -> dict:
    html_pattern = re.compile(r'<[a-z]+[\s>]|&[a-z]+;|&#\d+;', re.IGNORECASE)
    bad = []
    for u in data:
        for field in ["title", "summary"]:
            if html_pattern.search(u.get(field, "")):
                bad.append(u.get("title", "")[:40])
                break
    return {
        "name": "no_html_in_text",
        "pass": len(bad) == 0,
        "detail": f"{len(bad)} items with HTML" if bad else "OK",
    }


def _check_structure(data: list[dict]) -> dict:
    required = {"id", "date", "platform", "title", "summary", "category", "sourceUrl"}
    bad = [u for u in data if not required.issubset(u.keys())]
    return {
        "name": "valid_structure",
        "pass": len(bad) == 0,
        "detail": f"{len(bad)} items missing fields" if bad else "OK",
    }


def print_report(result: dict, label: str = "Validation") -> None:
    status = "PASS" if result["pass"] else "FAIL"
    print(f"\n[{label}] {status} ({result.get('total', '-')} items)")
    for c in result["checks"]:
        icon = "v" if c["pass"] else "x"
        detail = c.get("detail", "")
        print(f"  [{icon}] {c['name']}: {detail}")
