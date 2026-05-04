/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { PLATFORMS, GROUP_ORDER, GROUP_LABELS } from '../constants';
import { useApp, useData } from '../App';
import { Layers, Calendar, Bookmark } from 'lucide-react';
import { clsx } from 'clsx';
import type { PlatformGroup, Platform } from '../types';

export function Sidebar({ onClose }: { onClose: () => void }) {
  const { locale } = useApp();
  const { weeks, months } = useData();

  const t = {
    cn: {
      platforms: 'Network Index',
      reports: 'Intelligence Archive',
    },
    en: {
      platforms: 'Network Index',
      reports: 'Intelligence Archive',
    },
  }[locale];

  // Group platforms
  const groupedPlatforms = new Map<PlatformGroup, Platform[]>();
  for (const p of Object.keys(PLATFORMS) as Platform[]) {
    const meta = PLATFORMS[p];
    if (!groupedPlatforms.has(meta.group)) groupedPlatforms.set(meta.group, []);
    groupedPlatforms.get(meta.group)!.push(p);
  }

  return (
    <div className="h-full flex flex-col py-16 px-8 lg:px-12 overflow-y-auto">
      <div className="text-[10px] uppercase tracking-[0.4em] font-bold mb-10 opacity-20">Navigation / Portal</div>

      <nav className="flex-1 space-y-10">
        {/* Platforms */}
        <section>
          <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-blue mb-6 flex items-center gap-2">
            <Layers size={12} />
            {t.platforms}
          </h3>

          {GROUP_ORDER.map((group) => {
            const platforms = groupedPlatforms.get(group);
            if (!platforms || platforms.length === 0) return null;

            return (
              <div key={group} className="mb-6">
                <div className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-30 mb-3 pl-1">
                  {GROUP_LABELS[group]}
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                  {platforms.map((p) => {
                    const meta = PLATFORMS[p];
                    return (
                      <NavLink
                        key={p}
                        to={`/?platform=${p}`}
                        onClick={onClose}
                        className={({ isActive }) =>
                          clsx(
                            'text-sm font-medium flex items-center gap-2 hover:text-brand-blue transition-colors',
                            isActive ? 'text-brand-blue' : 'text-brand-black/70'
                          )
                        }
                      >
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                        <span className="truncate">{meta.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {/* Weekly Reports */}
        <section>
          <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-blue mb-6 flex items-center gap-2">
            <Calendar size={12} />
            Weekly
          </h3>
          <div className="space-y-1">
            {weeks.map((w) => (
              <NavLink
                key={w}
                to={`/weekly/${w}`}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'block text-xs font-medium py-2 px-3 rounded transition-colors',
                    isActive ? 'bg-brand-blue text-white' : 'text-brand-black/60 hover:bg-brand-gray'
                  )
                }
              >
                {w}
              </NavLink>
            ))}
          </div>
        </section>

        {/* Monthly Reports */}
        <section>
          <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-blue mb-6 flex items-center gap-2">
            <Bookmark size={12} />
            Monthly
          </h3>
          <div className="space-y-1">
            {months.map((m) => (
              <NavLink
                key={m}
                to={`/report/${m}`}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'block text-xs font-medium py-2 px-3 rounded transition-colors',
                    isActive ? 'bg-brand-blue text-white' : 'text-brand-black/60 hover:bg-brand-gray'
                  )
                }
              >
                {m}
              </NavLink>
            ))}
          </div>
        </section>
      </nav>

      {/* Footer */}
      <div className="pt-8 border-t border-brand-black/10">
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest opacity-20">
          <span>Instagram</span>
          <span>LinkedIn</span>
          <span>Twitter</span>
        </div>
      </div>
    </div>
  );
}
