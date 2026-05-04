/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrendChart } from '../components/TrendChart';
import { getUpdates } from '../data';
import { CATEGORIES, PLATFORMS, PLATFORM_LIST, type CategoryFilter } from '../constants';
import { useApp } from '../App';
import { Search, ExternalLink, ChevronLeft, ChevronRight, LayoutGrid, List, BarChart2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { MediaUpdate } from '../types';

type ViewMode = 'card' | 'table';

function getImportanceClass(imp: string) {
  if (imp === 'high') return 'importance-high';
  if (imp === 'medium') return 'importance-medium';
  return 'importance-low';
}

function UpdateCard({ update, index }: { update: MediaUpdate; index: number }) {
  const platform = PLATFORMS[update.platform];
  const isLarge = index % 3 === 0;
  const colSpan = isLarge ? 'md:col-span-8' : 'md:col-span-4';

  return (
    <motion.article
      className={`${colSpan} group`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
    >
      <div className="border-t border-brand-black pt-6 pb-8">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: platform?.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: platform?.color }} />
            {platform?.label}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${getImportanceClass(update.importance)}`}>
            {update.importance}
          </span>
          <span className="text-[10px] text-brand-black/40 uppercase tracking-wider">
            {update.category}
          </span>
          <span className="text-[10px] text-brand-black/30 ml-auto">{update.date}</span>
        </div>

        {/* Title */}
        <a
          href={update.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block group/title"
        >
          <h3
            className={`font-bold tracking-tight leading-tight mb-2 hover:text-brand-blue transition-colors ${
              isLarge ? 'text-3xl lg:text-4xl' : 'text-xl lg:text-2xl'
            }`}
          >
            {update.title}
            <ExternalLink
              size={16}
              className="inline ml-2 opacity-0 group-hover/title:opacity-100 transition-opacity align-baseline"
            />
          </h3>
        </a>

        {update.titleOriginal && (
          <p className="text-sm italic text-brand-black/40 mb-3 font-serif">"{update.titleOriginal}"</p>
        )}

        {/* Summary */}
        <p className="text-sm text-brand-black/60 leading-relaxed line-clamp-3 mb-4">
          {update.summary || 'Pending summary.'}
        </p>

        {/* Tags + Source */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-brand-black/5">
          <div className="flex flex-wrap gap-2">
            {update.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-[9px] font-bold uppercase tracking-wider text-brand-black/30">
                #{tag}
              </span>
            ))}
          </div>
          <span className="text-[10px] font-medium text-brand-black/40 shrink-0">{update.source}</span>
        </div>
      </div>
    </motion.article>
  );
}

function UpdateTableRow({ update }: { update: MediaUpdate }) {
  const platform = PLATFORMS[update.platform];

  return (
    <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[140px_1fr_auto_80px] gap-2 sm:gap-3 px-4 py-3 border-b border-brand-black/5 last:border-0 items-center hover:bg-brand-gray/50 transition-colors">
      <div className="flex items-center gap-1.5 overflow-hidden">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: platform?.color }} />
        <span className="text-[11px] font-medium truncate">{platform?.label}</span>
        <span className="text-[10px] text-brand-black/40 truncate">{update.category}</span>
      </div>
      <a
        href={update.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[13px] font-medium hover:text-brand-blue transition-colors line-clamp-1 min-w-0"
      >
        {update.title}
      </a>
      <span className={`hidden sm:block text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${getImportanceClass(update.importance)}`}>
        {update.importance}
      </span>
      <span className="hidden sm:block text-[11px] text-brand-black/40 text-right tabular-nums shrink-0">
        {update.date}
      </span>
    </div>
  );
}

export function Home() {
  const { locale } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const platformParam = searchParams.get('platform');

  const [updates, setUpdates] = useState<MediaUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [showTrend, setShowTrend] = useState(false);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [tablePage, setTablePage] = useState(1);

  const weeks = ['2026-W17', '2026-W16', '2026-W15', '2026-W14', '2026-W13', '2026-W12'];
  const currentWeek = weeks[currentWeekIndex] || weeks[0];

  // Fetch real data
  useEffect(() => {
    getUpdates().then((data) => {
      setUpdates(data);
      setLoading(false);
    });
  }, []);

  // Filter logic
  const filtered = useMemo(() => {
    let result = updates;

    if (platformParam && platformParam !== 'all') {
      result = result.filter((u) => u.platform === platformParam);
    }

    if (selectedCategory !== 'All') {
      result = result.filter((u) => u.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.title.toLowerCase().includes(q) ||
          u.summary.toLowerCase().includes(q) ||
          u.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [updates, search, selectedCategory, platformParam]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, MediaUpdate[]>();
    for (const u of filtered) {
      const arr = map.get(u.date) || [];
      arr.push(u);
      map.set(u.date, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  // Table pagination
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = useMemo(() => {
    const start = (tablePage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, tablePage]);

  // Platform count map
  const platformCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of updates) {
      map.set(u.platform, (map.get(u.platform) || 0) + 1);
    }
    return map;
  }, [updates]);

  const handlePlatformClear = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('platform');
    setSearchParams(params);
  };

  const handlePlatformSelect = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('platform', id);
    setSearchParams(params);
  };

  const t = {
    cn: { title: 'Intelligence created at moments where change becomes inevitable.', search: '搜索更新...' },
    en: { title: 'Intelligence created at moments where change becomes inevitable.', search: 'SEARCH ARCHIVE...' },
  }[locale];

  // BI metrics from real data
  const totalUpdates = updates.length;
  const completed = updates.filter((u) => u.summary?.trim()).length;
  const completionRate = totalUpdates ? Math.round((completed / totalUpdates) * 100) : 0;
  const platforms = new Set(updates.map((u) => u.platform)).size;
  const thisWeek = updates.filter((u) => u.week === currentWeek).length;
  const priority = updates.filter((u) => u.importance === 'high').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-white">
        <div className="text-center">
          <div className="text-6xl font-bold tracking-tighter text-brand-black/10 mb-4">Loading</div>
          <div className="text-sm text-brand-black/30">Fetching intelligence...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-white min-h-screen">
      {/* Hero Section */}
      <section className="px-6 lg:px-12 pt-16 pb-20 lg:pt-24 lg:pb-32 border-b border-brand-black overflow-hidden relative">
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="section-label mb-8">
            <span className="w-8 h-px bg-brand-black" />
            Ambition / Intelligence
          </div>
          <h1 className="swiss-h1 mb-8">
            Making the <span className="italic-accent">new</span> possible.
          </h1>
          <p className="text-xl lg:text-3xl font-light tracking-tight max-w-2xl leading-[1.2] text-brand-black/60">
            {t.title} {platforms}+ Platforms. One source of truth.
          </p>
        </motion.div>
        <div className="absolute -right-20 -top-20 w-[40vw] h-[40vw] bg-brand-blue blur-[120px] opacity-[0.07] rounded-full pointer-events-none" />
      </section>

      {/* BI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 border-b border-brand-black divide-x divide-brand-black/10">
        <StatItem label="Total Updates" value={totalUpdates.toLocaleString()} change="All time" />
        <StatItem label="Completion" value={`${completionRate}%`} change="STABLE" />
        <StatItem label="Platforms" value={platforms} change="GLOBAL" />
        <StatItem label="This Week" value={thisWeek} change={currentWeek} />
        <StatItem label="Priority" value={priority} change="HIGH" highlight />
      </div>

      {/* Search + Filters */}
      <section className="px-6 lg:px-12 py-8 border-b border-brand-black">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-brand-black/30" />
            <input
              type="text"
              placeholder={t.search}
              className="w-full pl-7 pr-4 py-2 bg-transparent text-sm font-medium outline-none border-b border-brand-black/10 focus:border-brand-blue transition-colors placeholder:text-brand-black/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-brand-black/30 hover:text-brand-black"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap flex-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all ${
                    selectedCategory === cat
                      ? 'bg-brand-black text-white'
                      : 'bg-brand-gray text-brand-black/60 hover:bg-brand-black/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex border border-brand-black/10 rounded-full overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 ${viewMode === 'card' ? 'bg-brand-black text-white' : 'bg-brand-white text-brand-black/60 hover:bg-brand-gray'}`}
                title="Card view"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 ${viewMode === 'table' ? 'bg-brand-black text-white' : 'bg-brand-white text-brand-black/60 hover:bg-brand-gray'}`}
                title="Table view"
              >
                <List size={14} />
              </button>
            </div>

            <button
              onClick={() => setShowTrend(!showTrend)}
              className={`p-2 border rounded-full transition-all ${
                showTrend ? 'bg-brand-black text-white border-brand-black' : 'border-brand-black/10 text-brand-black/60 hover:border-brand-black/30'
              }`}
              title="Toggle trend"
            >
              <BarChart2 size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Trend Chart */}
      <AnimatePresence>
        {showTrend && (
          <motion.section
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-brand-black"
          >
            <div className="px-6 lg:px-12 py-8">
              <TrendChart updates={updates} weeks={['2026-W17','2026-W16','2026-W15','2026-W14','2026-W13','2026-W12']} />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Mobile Platform Pills */}
      <div className="lg:hidden border-b border-brand-black/10 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={handlePlatformClear}
            className={`shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all ${
              !platformParam || platformParam === 'all'
                ? 'bg-brand-black text-white'
                : 'bg-brand-gray text-brand-black/60'
            }`}
          >
            All
          </button>
          {PLATFORM_LIST.map((p) => {
            const count = platformCounts.get(p) || 0;
            if (count === 0) return null;
            return (
              <button
                key={p}
                onClick={() => handlePlatformSelect(p)}
                className={`shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-1.5 ${
                  platformParam === p
                    ? 'bg-brand-black text-white'
                    : 'bg-brand-gray text-brand-black/60'
                }`}
              >
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: PLATFORMS[p]?.color }} />
                {PLATFORMS[p]?.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active platform banner */}
      {platformParam && platformParam !== 'all' && (
        <div className="px-6 lg:px-12 py-3 bg-brand-blue/5 border-b border-brand-blue/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PLATFORMS[platformParam as keyof typeof PLATFORMS]?.color }} />
            <span>Filtering by: <strong>{PLATFORMS[platformParam as keyof typeof PLATFORMS]?.label}</strong></span>
            <span className="text-brand-black/40">— {filtered.length} updates</span>
          </div>
          <button onClick={handlePlatformClear} className="text-[10px] font-bold uppercase tracking-wider hover:text-brand-blue">
            Clear ×
          </button>
        </div>
      )}

      {/* Content area */}
      <section className="px-6 lg:px-12 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-black/40">
            {filtered.length} INTELLIGENCE UNITS
          </div>
          {viewMode === 'card' && (
            <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-black/40">
              {grouped.length} DAYS
            </div>
          )}
        </div>

        {/* Card Grid */}
        {viewMode === 'card' && (
          <div className="space-y-12">
            {grouped.length > 0 ? (
              grouped.map(([date, items], gi) => (
                <div key={date}>
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-lg font-bold">{date}</h2>
                    <div className="h-px flex-1 bg-brand-black/10" />
                    <span className="text-[10px] font-bold text-brand-black/30 uppercase tracking-wider">{items.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-y-8 gap-x-6">
                    {items.map((u, i) => (
                      <UpdateCard key={u.id} update={u} index={gi * 3 + i} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-32 text-center">
                <p className="text-4xl font-bold text-brand-black/10">No intelligence found.</p>
                <p className="text-sm text-brand-black/30 mt-2">Try adjusting your filters.</p>
              </div>
            )}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div>
            <div className="border-y border-brand-black">
              <div className="hidden sm:grid grid-cols-[140px_1fr_auto_80px] gap-3 px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-brand-black/30 border-b bg-brand-gray/30">
                <div>Platform</div>
                <div>Title</div>
                <div>Priority</div>
                <div className="text-right">Date</div>
              </div>
              {paginated.map((u) => (
                <UpdateTableRow key={u.id} update={u} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-6">
                <button
                  onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                  disabled={tablePage === 1}
                  className="inline-flex items-center gap-1 px-4 py-2 text-[11px] font-bold uppercase tracking-wider border border-brand-black/10 rounded-full hover:bg-brand-black hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={12} /> Prev
                </button>
                <span className="text-[11px] tabular-nums text-brand-black/40">
                  {tablePage} / {totalPages}
                </span>
                <button
                  onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                  disabled={tablePage >= totalPages}
                  className="inline-flex items-center gap-1 px-4 py-2 text-[11px] font-bold uppercase tracking-wider border border-brand-black/10 rounded-full hover:bg-brand-black hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Week pagination (when platform selected) */}
        {platformParam && platformParam !== 'all' && weeks.length > 1 && (
          <div className="flex items-center justify-center gap-4 pt-8 border-t border-brand-black/5 mt-8">
            <button
              onClick={() => setCurrentWeekIndex((i) => Math.min(weeks.length - 1, i + 1))}
              disabled={currentWeekIndex >= weeks.length - 1}
              className="inline-flex items-center gap-1 px-4 py-2 text-[11px] font-bold uppercase tracking-wider border border-brand-black/10 rounded-full hover:bg-brand-black hover:text-white transition-all disabled:opacity-30"
            >
              <ChevronLeft size={12} /> Previous Week
            </button>
            <span className="text-sm font-medium">{currentWeek}</span>
            <button
              onClick={() => setCurrentWeekIndex((i) => Math.max(0, i - 1))}
              disabled={currentWeekIndex === 0}
              className="inline-flex items-center gap-1 px-4 py-2 text-[11px] font-bold uppercase tracking-wider border border-brand-black/10 rounded-full hover:bg-brand-black hover:text-white transition-all disabled:opacity-30"
            >
              Next Week <ChevronRight size={12} />
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-brand-blue text-white px-6 lg:px-12 py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          <h2 className="text-5xl lg:text-7xl font-bold tracking-tighter leading-none">
            Build Your<br />New Future<br />With Us
          </h2>
          <div className="flex flex-col justify-between">
            <p className="text-lg lg:text-xl font-light opacity-80 max-w-md">
              MediaStudio is a global intelligence collective helping organizations navigate growth, reinvention, and change.
            </p>
            <div className="grid grid-cols-2 gap-8 mt-12">
              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Visit</div>
                <div className="text-sm font-medium">26 Broadway, 10th Floor<br />New York, NY 10004</div>
              </div>
              <div className="space-y-3">
                <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Contact</div>
                <div className="text-sm font-medium underline decoration-white/20">hello@mediastudio.ag</div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-10">
          <h1 className="text-[18vw] font-bold tracking-[-0.06em] leading-none mb-8">MediaStudio</h1>
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 text-[10px] uppercase font-bold tracking-widest opacity-40">
            <div className="flex gap-6">
              <span>Instagram</span>
              <span>TikTok</span>
              <span>GitHub</span>
              <span>LinkedIn</span>
            </div>
            <span>© 2026 Media Studio Partners Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// StatItem inline (replaces DashboardStats dependency)
function StatItem({ label, value, change, highlight }: { label: string; value: string | number; change: string; highlight?: boolean }) {
  if (highlight) {
    return (
      <div className="py-10 lg:py-14 px-6 lg:px-10 flex flex-col justify-between items-start bg-brand-blue text-white">
        <div className="flex items-baseline justify-between w-full">
          <span className="text-5xl lg:text-7xl font-bold tracking-tighter">{value}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest translate-y-[-8px] opacity-60">{change}</span>
        </div>
        <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-60 mt-4">{label}</p>
      </div>
    );
  }
  return (
    <div className="py-10 lg:py-14 px-6 lg:px-10 flex flex-col justify-between items-start hover:bg-brand-gray transition-colors">
      <div className="flex items-baseline justify-between w-full">
        <span className="stat-value">{value}</span>
        <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest translate-y-[-8px]">{change}</span>
      </div>
      <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-brand-black/40 mt-4">{label}</p>
    </div>
  );
}
