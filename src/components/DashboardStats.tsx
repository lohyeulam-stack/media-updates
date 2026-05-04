/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../App';
import { MOCK_UPDATES } from '../mockData';
import { Importance } from '../types';

interface StatItemProps {
  label: string;
  value: string | number;
  change: string;
  onClick?: () => void;
  highlight?: boolean;
}

function StatItem({ label, value, change, onClick, highlight }: StatItemProps) {
  if (highlight) {
    return (
      <div className="py-10 lg:py-14 px-6 lg:px-10 flex flex-col justify-between items-start bg-brand-blue text-white group cursor-pointer">
        <div className="flex items-baseline justify-between w-full">
          <span className="text-5xl lg:text-7xl font-bold tracking-tighter">{value}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest translate-y-[-8px] opacity-60">{change}</span>
        </div>
        <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-60 mt-4">{label}</p>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="py-10 lg:py-14 px-6 lg:px-10 flex flex-col justify-between items-start hover:bg-brand-gray transition-colors group cursor-pointer"
    >
      <div className="flex items-baseline justify-between w-full">
        <span className="stat-value group-hover:scale-105 transition-transform origin-left duration-500">{value}</span>
        <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest translate-y-[-8px]">{change}</span>
      </div>
      <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-brand-black/40 mt-4">{label}</p>
    </div>
  );
}

interface DashboardStatsProps {
  onWeekFilter?: (week: string | null) => void;
}

export function DashboardStats({ onWeekFilter }: DashboardStatsProps) {
  const { locale } = useApp();

  const t = {
    cn: {
      total: 'Active Portfolio',
      completion: 'Weekly Clear',
      platforms: 'Tracked Node',
      thisWeek: 'New Insights',
      priority: 'Critical Hub',
    },
    en: {
      total: 'Active Portfolio',
      completion: 'Weekly Clear',
      platforms: 'Tracked Node',
      thisWeek: 'New Insights',
      priority: 'Critical Hub',
    },
  }[locale];

  const totalUpdates = MOCK_UPDATES.length;
  const completed = MOCK_UPDATES.filter((u) => u.summary?.trim()).length;
  const completionRate = Math.round((completed / totalUpdates) * 100);
  const platforms = new Set(MOCK_UPDATES.map((u) => u.platformId)).size;
  const thisWeek = MOCK_UPDATES.filter((u) => u.week === '2026-W17').length;
  const priority = MOCK_UPDATES.filter((u) => u.importance === Importance.High).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 border-b border-brand-black divide-x divide-brand-black/10">
      <StatItem label={t.total} value={totalUpdates.toLocaleString()} change="All time" />
      <StatItem label={t.completion} value={`${completionRate}%`} change="STABLE" />
      <StatItem label={t.platforms} value={platforms} change="GLOBAL" />
      <StatItem
        label={t.thisWeek}
        value={thisWeek}
        change="2026-W17"
        onClick={() => onWeekFilter?.('2026-W17')}
      />
      <StatItem label={t.priority} value={priority} change="HIGH" highlight />
    </div>
  );
}
