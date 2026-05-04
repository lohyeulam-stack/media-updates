"""Deduplication logic for media updates."""

from __future__ import annotations

from urllib.parse import urlparse


def _normalize_url(url: str) -> str:
    """Normalize URL: remove trailing slash, query params for same-path checks."""
    if not url:
        return ""
    parsed = urlparse(url)
    # Remove trailing slash
    path = parsed.path.rstrip("/")
    # Return without query params for comparison
    return f"{parsed.netloc}{path}"


def _title_similarity(t1: str, t2: str) -> float:
    """Compute title similarity based on word overlap. Returns 0-1."""
    if not t1 or not t2:
        return 0.0
    words1 = set(t1.lower().split())
    words2 = set(t2.lower().split())
    if not words1 or not words2:
        return 0.0
    intersection = words1 & words2
    union = words1 | words2
    # Jaccard similarity
    return len(intersection) / len(union)


def deduplicate(
    new_items: list[dict], existing_items: list[dict]
) -> list[dict]:
    existing_urls = {item.get("sourceUrl", "") for item in existing_items}
    existing_normalized = {_normalize_url(item.get("sourceUrl", "")) for item in existing_items}
    existing_titles = {item.get("title", "").lower() for item in existing_items}

    unique: list[dict] = []
    seen_urls: set[str] = set()
    seen_normalized: set[str] = set()
    seen_titles_lower: set[str] = set()

    for item in new_items:
        url = item.get("sourceUrl", item.get("url", ""))
        title = item.get("title", "")
        title_lower = title.lower()
        normalized = _normalize_url(url)

        # Skip if exact URL match
        if url in existing_urls or url in seen_urls:
            continue
        # Skip if normalized URL match (same article, different query params)
        if normalized in existing_normalized or normalized in seen_normalized:
            continue
        # Skip if exact title match
        if title_lower in existing_titles or title_lower in seen_titles_lower:
            continue

        # Semantic dedup: check title similarity against recently added
        is_duplicate = False
        duplicate_to_remove = None
        for seen_item in unique[-20:]:  # Check last 20 for near-duplicates
            seen_title = seen_item.get("title", "")
            sim = _title_similarity(title, seen_title)
            # If similarity > 0.6 and both from same platform, likely duplicate
            if sim > 0.6 and item.get("platform") == seen_item.get("platform"):
                # Prefer the one with longer/more specific URL path (more slug depth)
                seen_norm = _normalize_url(seen_item.get("sourceUrl",""))
                current_depth = len(normalized.split("/"))
                seen_depth = len(seen_norm.split("/"))
                if current_depth > seen_depth:
                    # New item has more specific URL, mark old as duplicate
                    duplicate_to_remove = seen_item
                    break
                elif seen_depth > current_depth:
                    # Old item has more specific URL, mark new as duplicate
                    is_duplicate = True
                    break
                # Same depth - keep both (might be different articles)

        if is_duplicate:
            continue
        if duplicate_to_remove:
            unique.remove(duplicate_to_remove)

        seen_urls.add(url)
        seen_normalized.add(normalized)
        seen_titles_lower.add(title_lower)
        unique.append(item)

    return unique
