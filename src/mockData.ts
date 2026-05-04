/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MediaUpdate, Category, Importance } from './types';
import { subDays, format, startOfWeek } from 'date-fns';

const generateMockUpdates = (count: number): MediaUpdate[] => {
  const platforms = [
    'tiktok', 'meta', 'snapchat', 'google', 'apple', 'youtube', 'linkedin', 
    'dv360', 'applovin', 'ironsource', 'pangle', 'huawei', 'kuaishou'
  ];
  const categories = Object.values(Category);
  const importances = Object.values(Importance);

  return Array.from({ length: count }).map((_, i) => {
    const date = subDays(new Date(), Math.floor(Math.random() * 60));
    const formattedDate = format(date, 'yyyy-MM-dd');
    const week = format(startOfWeek(date), 'yyyy-\'W\'ww');
    const month = format(date, 'yyyy-MM');
    const platformId = platforms[Math.floor(Math.random() * platforms.length)];
    
    return {
      id: `upd-${i}`,
      date: formattedDate,
      week,
      month,
      platformId,
      title: `新一代广告算法升级：${platformId.toUpperCase()} 提升 ${Math.floor(Math.random() * 20) + 10}% 转化效率`,
      titleOriginal: `${platformId.toUpperCase()} Next-Gen Ad Algorithm Upgrade: Boosting Conversion by ${Math.floor(Math.random() * 20) + 10}%`,
      summary: `本次更新涵盖了自动出价优化、新型创意素材支持以及更精准的受众定向功能。旨在帮助广告主在复杂环境下实现更稳健的增长。Key features include real-time bidding adjustments and privacy-first tracking.`,
      category: categories[Math.floor(Math.random() * categories.length)],
      importance: importances[Math.floor(Math.random() * importances.length)],
      source: `${platformId.charAt(0).toUpperCase() + platformId.slice(1)} Ads Blog`,
      sourceUrl: 'https://example.com/source',
      tags: ['Algorithm', 'Performance', 'AI', 'Global'],
      fetchedAt: new Date().toISOString(),
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const MOCK_UPDATES = generateMockUpdates(100);

export const WEEKLY_STATS = [
  { week: 'W12', count: 12 },
  { week: 'W13', count: 18 },
  { week: 'W14', count: 15 },
  { week: 'W15', count: 22 },
  { week: 'W16', count: 19 },
  { week: 'W17', count: 25 },
];
