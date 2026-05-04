/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useApp } from '../App';

interface TrendChartProps {
  updates?: { week: string }[];
  weeks?: string[];
}

function Sparkline({ values, color = '#001AFF' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 100;
  const height = 40;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  return (
    <svg className="h-10 w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function TrendChart({ updates = [], weeks = [] }: TrendChartProps) {
  const { locale } = useApp();

  const labels = {
    cn: { title: '趋势分析', updates: '更新数', platforms: '活跃平台' },
    en: { title: 'Trend Analysis', updates: 'Updates', platforms: 'Platforms' },
  }[locale];

  // Compute weekly counts from updates
  const weeklyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of updates) {
      counts.set(u.week, (counts.get(u.week) || 0) + 1);
    }
    return counts;
  }, [updates]);

  const displayWeeks = weeks.length > 0 ? weeks : Array.from(weeklyCounts.keys()).sort();
  const values = displayWeeks.map((w) => weeklyCounts.get(w) || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-blue">{labels.title}</h3>
        <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest opacity-40">
          <span>{labels.updates}</span>
        </div>
      </div>
      <Sparkline values={values} color="#001AFF" />
      <div className="flex justify-between">
        {displayWeeks.slice(-8).map((w) => (
          <span key={w} className="text-[9px] font-bold uppercase tracking-wider opacity-30">
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
