"""Date validation for media updates to detect suspicious patterns."""

from __future__ import annotations

from datetime import datetime, timedelta


def validate_article_date(article: dict) -> dict:
    """
    Validate article date and detect suspicious patterns.

    Returns a dict with:
    - is_valid: bool
    - issues: list of issue descriptions
    - confidence: "high" | "medium" | "low"
    """
    date_str = article.get("date", "")
    fetched_at_str = article.get("fetchedAt", "")
    date_confidence = article.get("dateConfidence", "medium")

    issues = []

    # Check if date is missing
    if not date_str:
        issues.append("Missing date")
        return {"is_valid": False, "issues": issues, "confidence": "low"}

    try:
        article_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        issues.append(f"Invalid date format: {date_str}")
        return {"is_valid": False, "issues": issues, "confidence": "low"}

    # Check if date matches fetchedAt (suspicious - likely AI used default)
    if fetched_at_str:
        try:
            fetched_date = datetime.fromisoformat(fetched_at_str.replace("Z", "+00:00"))
            # Check if dates are on the same day
            if article_date.date() == fetched_date.date():
                issues.append(f"Date matches fetch date ({date_str}) - AI may have used default")
        except (ValueError, AttributeError):
            pass

    # Check if date is in the future
    now = datetime.now(article_date.tzinfo) if article_date.tzinfo else datetime.now()
    if article_date > now + timedelta(days=1):
        issues.append(f"Date is in the future: {date_str}")

    # Check if date is too old (before 2026)
    if article_date.year < 2026:
        issues.append(f"Date is before 2026: {date_str}")

    # Check dateConfidence if available
    if date_confidence == "low":
        issues.append("AI reported low confidence in date extraction")

    # Determine overall validity
    is_valid = len(issues) == 0
    confidence = date_confidence if date_confidence else ("high" if is_valid else "low")

    return {
        "is_valid": is_valid,
        "issues": issues,
        "confidence": confidence
    }


def validate_batch(articles: list[dict]) -> dict:
    """
    Validate a batch of articles and return summary statistics.

    Returns:
    - total: total number of articles
    - valid: number of valid articles
    - suspicious: list of articles with issues
    """
    suspicious = []

    for article in articles:
        validation = validate_article_date(article)
        if not validation["is_valid"]:
            suspicious.append({
                "id": article.get("id", "unknown"),
                "platform": article.get("platform", "unknown"),
                "date": article.get("date", "unknown"),
                "title": article.get("title", "")[:60],
                "issues": validation["issues"],
                "confidence": validation["confidence"]
            })

    return {
        "total": len(articles),
        "valid": len(articles) - len(suspicious),
        "suspicious": suspicious
    }
