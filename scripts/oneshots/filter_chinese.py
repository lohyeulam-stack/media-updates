import json

def has_chinese(text):
    if not text:
        return False
    return any('一' <= c <= '鿿' for c in text)

with open('data/updates.json', encoding='utf-8') as f:
    data = json.load(f)

original_count = len(data)
kept = []
removed = []

for item in data:
    title = item.get('title', '')
    # Also check snippet/description
    snippet = item.get('snippet', '') or item.get('description', '')
    source_name = item.get('sourceName', '')

    if has_chinese(title) or has_chinese(snippet) or has_chinese(source_name):
        kept.append(item)
    else:
        removed.append(item)

print(f'Original: {original_count}')
print(f'Kept (Chinese): {len(kept)}')
print(f'Removed (English-only): {len(removed)}')

# Show removed by platform
from collections import Counter
removed_platforms = Counter(item.get('platform','') for item in removed)
print('\nRemoved by platform:')
for p, cnt in removed_platforms.most_common():
    print(f'  {p}: {cnt}')

# Save filtered
with open('data/updates.json', 'w', encoding='utf-8') as f:
    json.dump(kept, f, ensure_ascii=False, indent=2)

print('\nSaved to data/updates.json')