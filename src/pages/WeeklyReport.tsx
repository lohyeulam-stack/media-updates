/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWeeklyData } from '../data';
import { PLATFORMS, GROUP_ORDER, GROUP_LABELS } from '../constants';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import type { MediaUpdate, PlatformGroup } from '../types';

export function WeeklyReport() {
  const { week } = useParams<{ week: string }>();
  const [updates, setUpdates] = useState<MediaUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!week) return;
    setLoading(true);
    getWeeklyData(week).then((data) => {
      setUpdates(data);
      setLoading(false);
    });
  }, [week]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-white">
        <div className="text-center">
          <div className="text-6xl font-bold tracking-tighter text-brand-black/10 mb-4">Loading</div>
        </div>
      </div>
    );
  }

  // Group updates by platform group
  const byGroup = new Map<PlatformGroup, Map<string, MediaUpdate[]>>();
  for (const u of updates) {
    const pm = PLATFORMS[u.platform];
    if (!pm) continue;
    const group = pm.group;
    if (!byGroup.has(group)) byGroup.set(group, new Map());
    const platformMap = byGroup.get(group)!;
    if (!platformMap.has(u.platform)) platformMap.set(u.platform, []);
    platformMap.get(u.platform)!.push(u);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-brand-white min-h-screen"
    >
      {/* Header */}
      <header className="px-6 lg:px-12 py-16 lg:py-24 border-b border-brand-black">
        <div className="flex items-center justify-between mb-16">
          <Link
            to="/"
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue hover:text-brand-black transition-colors"
          >
            <ArrowLeft size={14} />
            Origin / Dispatch
          </Link>
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30">
            {week} REPORT
          </div>
        </div>

        <h1 className="text-6xl lg:text-[100px] font-medium tracking-tighter leading-[0.85] mb-6">
          Weekly{' '}
          <span className="italic-accent">Platform</span>
          <br />
          Roundup.
        </h1>
        <p className="text-xl lg:text-3xl font-light tracking-tight max-w-2xl text-brand-black/50">
          Insights covering algorithm changes, policy updates, and inevitable feature releases across our tracked nodes.
        </p>
      </header>

      {/* Content by group */}
      <div className="divide-y divide-brand-black">
        {GROUP_ORDER.map((group) => {
          const platformMap = byGroup.get(group);
          if (!platformMap || platformMap.size === 0) return null;

          return (
            <section key={group} className="px-6 lg:px-12 py-16 lg:py-20">
              <div className="section-label mb-10">
                <span className="w-10 h-px bg-brand-black" />
                Selection / {GROUP_LABELS[group]}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from(platformMap.entries()).map(([platformId, items]) => {
                  const platform = PLATFORMS[platformId as keyof typeof PLATFORMS];
                  return (
                    <div key={platformId} className="group border-t border-brand-black pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: platform?.color }} />
                        <span className="text-sm font-bold">{platform?.label}</span>
                        <span className="ml-auto text-[10px] font-bold bg-brand-black text-white px-2 py-0.5 rounded">
                          {items.length}
                        </span>
                      </div>
                      {items.map((u) => (
                        <div key={u.id} className="py-3 border-b border-brand-black/5 last:border-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-brand-black/30">{u.category}</span>
                            <span className="text-[9px] text-brand-black/30">{u.date}</span>
                          </div>
                          <a
                            href={u.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm font-medium leading-snug hover:text-brand-blue transition-colors mb-1"
                          >
                            {u.title}
                          </a>
                          <p className="text-xs text-brand-black/40 leading-relaxed line-clamp-2">{u.summary}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {u.tags.slice(0, 3).map((t) => (
                              <span key={t} className="text-[9px] text-brand-black/20">#{t}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {updates.length === 0 && (
          <div className="py-32 text-center">
            <p className="text-4xl font-bold text-brand-black/10">No data for {week}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-20 bg-brand-black text-white text-center">
        <h1 className="text-[12vw] font-bold tracking-tighter leading-none mb-8 uppercase">
          Inevitable
        </h1>
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-30">
          <span>Volume 04 / 2026</span>
          <span>©2026 TopTou</span>
        </div>
      </footer>
    </motion.div>
  );
}
