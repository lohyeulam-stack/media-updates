"""Normalize generated media update data before validation and commit.

This script is intentionally conservative: it does not delete records. It only
normalizes category values into the frontend enum and rewrites duplicate IDs into
stable deterministic IDs based on source URL/title/source.
"""

from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).parent.parent / "data"
UPDATES_FILE = DATA_DIR / "updates.json"
WEEKLY_DIR = DATA_DIR / "weekly"

ALLOWED_CATEGORIES = {
    "ad-product",
    "api-change",
    "policy",
    "creative",
    "measurement",
    "targeting",
    "automation",
    "other",
}

CATEGORY_ALIASES = {
    "campaign-management": "ad-product",
    "campaign_management": "ad-product",
    "campaign management": "ad-product",
    "campaign": "ad-product",
    "ads-product": "ad-product",
    "ads product": "ad-product",
    "ad product": "ad-product",
    "product": "ad-product",
    "products": "ad-product",
    "culture-trends": "other",
    "culture trends": "other",
    "culture_and_trends": "other",
    "trends": "other",
    "trend": "other",
    "content-marketing": "creative",
    "content marketing": "creative",
    "brand-marketing": "creative",
    "brand marketing": "creative",
    "case-study": "other",
    "case study": "other",
    "developer": "api-change",
    "api": "api-change",
    "measurement-analytics": "measurement",
    "analytics": "measurement",
    "attribution": "measurement",
    "privacy": "policy",
    "compliance": "policy",
    "safety": "policy",
    "ai": "automation",
}


def load_json(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize_category(value: Any) -> str:
    raw = str(value or "other").strip()
    normalized = raw.lower().replace("_", "-")
    if normalized in ALLOWED_CATEGORIES:
        return normalized
    return CATEGORY_ALIASES.get(normalized, "other")


def stable_suffix(item: dict[str, Any]) -> str:
    basis = "|".join(
        str(item.get(key, ""))
        for key in ("sourceUrl", "titleOriginal", "title", "source")
    )
    return hashlib.sha1(basis.encode("utf-8")).hexdigest()[:6]


def normalize_items(items: list[dict[str, Any]], global_seen: set[str] | None = None) -> tuple[list[dict[str, Any]], int, int]:
    category_changes = 0
    duplicate_changes = 0
    local_seen: set[str] = set()
    global_seen = global_seen if global_seen is not None else set()

    for item in items:
        old_category = item.get("category")
        new_category = normalize_category(old_category)
        if old_category != new_category:
            item["category"] = new_category
            category_changes += 1

        base_id = str(item.get("id") or "").strip()
        if not base_id:
            platform = item.get("platform", "unknown")
            date = item.get("date", "unknown")
            base_id = f"{platform}-{date}-{stable_suffix(item)}"
            item["id"] = base_id
            duplicate_changes += 1

        if base_id in local_seen or base_id in global_seen:
            item["id"] = f"{base_id}-{stable_suffix(item)}"
            duplicate_changes += 1

        local_seen.add(item["id"])
        global_seen.add(item["id"])

    return items, category_changes, duplicate_changes


def normalize_updates_file() -> set[str]:
    items = load_json(UPDATES_FILE)
    normalized, category_changes, duplicate_changes = normalize_items(items)
    save_json(UPDATES_FILE, normalized)
    print(
        f"[normalize] updates.json: {len(items)} items, "
        f"{category_changes} category fixes, {duplicate_changes} id fixes"
    )
    return {item.get("id", "") for item in normalized}


def normalize_weekly_files() -> None:
    if not WEEKLY_DIR.exists():
        return

    for path in sorted(WEEKLY_DIR.glob("*.json")):
        items = load_json(path)
        normalized, category_changes, duplicate_changes = normalize_items(items)
        save_json(path, normalized)
        if category_changes or duplicate_changes:
            print(
                f"[normalize] weekly/{path.name}: {len(items)} items, "
                f"{category_changes} category fixes, {duplicate_changes} id fixes"
            )


def main() -> None:
    if not UPDATES_FILE.exists():
        raise SystemExit("data/updates.json does not exist")
    normalize_updates_file()
    normalize_weekly_files()

    # Final sanity check for duplicate IDs in the aggregate file.
    items = load_json(UPDATES_FILE)
    counts = Counter(item.get("id") for item in items)
    duplicates = [item_id for item_id, count in counts.items() if count > 1]
    if duplicates:
        raise SystemExit(f"Duplicate IDs remain after normalization: {duplicates[:20]}")


if __name__ == "__main__":
    main()
