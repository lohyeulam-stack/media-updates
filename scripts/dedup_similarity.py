"""Cosine similarity-based deduplication for media updates."""

from __future__ import annotations

import re
from collections import Counter
from math import sqrt


def _tokenize(text: str) -> list[str]:
    """Tokenize text into words, removing punctuation and converting to lowercase."""
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    return text.split()


def _cosine_similarity(text1: str, text2: str) -> float:
    """Calculate cosine similarity between two texts."""
    tokens1 = _tokenize(text1)
    tokens2 = _tokenize(text2)

    if not tokens1 or not tokens2:
        return 0.0

    # Create word frequency vectors
    counter1 = Counter(tokens1)
    counter2 = Counter(tokens2)

    # Get all unique words
    all_words = set(counter1.keys()) | set(counter2.keys())

    # Calculate dot product and magnitudes
    dot_product = sum(counter1[word] * counter2[word] for word in all_words)
    magnitude1 = sqrt(sum(count ** 2 for count in counter1.values()))
    magnitude2 = sqrt(sum(count ** 2 for count in counter2.values()))

    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0

    return dot_product / (magnitude1 * magnitude2)


def deduplicate_by_similarity(
    articles: list[dict],
    threshold: float = 0.88,
) -> list[dict]:
    """
    Remove duplicate articles based on title and summary similarity.

    Groups articles by platform and date first, then checks similarity within groups
    to avoid false positives across different platforms or dates.

    Args:
        articles: List of article dictionaries
        threshold: Cosine similarity threshold (0-1). Articles with similarity
                  above this threshold are considered duplicates.

    Returns:
        List of unique articles
    """
    if not articles:
        return []

    # Group by platform and date for more accurate deduplication
    groups: dict[tuple[str, str], list[dict]] = {}
    for article in articles:
        platform = article.get('platform', '')
        date = article.get('date', '')
        key = (platform, date)
        if key not in groups:
            groups[key] = []
        groups[key].append(article)

    all_unique = []

    for (platform, date), group_articles in groups.items():
        unique = []
        seen_texts = []

        for article in group_articles:
            # Use titleOriginal for better English similarity matching
            title_original = article.get('titleOriginal', '')
            title_chinese = article.get('title', '')
            summary = article.get('summary', '')

            # Prefer original English title for similarity, fallback to Chinese
            title_for_comparison = title_original if title_original else title_chinese
            combined_text = f"{title_for_comparison} {summary}"

            is_duplicate = False
            best_match_idx = -1
            best_similarity = 0.0

            for idx, seen_text in enumerate(seen_texts):
                similarity = _cosine_similarity(combined_text, seen_text)
                if similarity >= threshold and similarity > best_similarity:
                    is_duplicate = True
                    best_match_idx = idx
                    best_similarity = similarity

            if not is_duplicate:
                unique.append(article)
                seen_texts.append(combined_text)
            else:
                # Keep the article with more detailed summary
                existing = unique[best_match_idx]
                existing_summary_len = len(existing.get('summary', ''))
                current_summary_len = len(summary)

                if current_summary_len > existing_summary_len:
                    # Replace with more detailed version
                    unique[best_match_idx] = article
                    seen_texts[best_match_idx] = combined_text

        all_unique.extend(unique)

    return all_unique
