import json
with open('data/updates.json', encoding='utf-8') as f:
    data = json.load(f)
print(f'Total entries: {len(data)}')
from collections import Counter
platforms = Counter(item.get('platform','') for item in data)
print('Platforms:', dict(platforms))
count = 0
non_chinese = []
for item in data:
    title = item.get('title','')
    has_chinese = any('一' <= c <= '鿿' for c in title)
    if not has_chinese:
        non_chinese.append(item)
        if count < 20:
            count += 1
            print(f"  [{item.get('platform')}] {title[:80]}")
print(f'\nTotal non-Chinese entries: {len(non_chinese)}')
print('\nSources of non-Chinese:')
src_count = Counter(item.get('sourceName','') or item.get('source','') for item in non_chinese)
for src, cnt in src_count.most_common(10):
    print(f"  {src}: {cnt}")