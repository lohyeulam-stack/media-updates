"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { BarChart3, ChevronLeft, ChevronRight, ExternalLink, LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react"
import { Sidebar } from "./sidebar"
import { TrendChart } from "./trend-chart"
import { SwissHeader, SwissFooter } from "./page-layout"
import { CATEGORY_LABELS, PLATFORM_META, type Category, type MediaUpdate, type Platform } from "@/lib/types"

interface HomeClientProps {
  updates: MediaUpdate[]
  months: string[]
  weeks: string[]
}

const CATEGORY_FILTERS: (Category | "all")[] = [
  "all", "ad-product", "api-change", "policy", "creative",
  "measurement", "targeting", "automation", "other",
]

const IMPORTANCE_META = {
  high: {
    label: "Priority",
    className: "bg-brand-blue text-white border-brand-blue",
  },
  medium: {
    label: "Info",
    className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
  },
  low: {
    label: "Active",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
  },
}

function categoryLabel(category: Category | "all") {
  if (category === "all") return "All"
  return CATEGORY_LABELS[category] || category
}

function BiStatStrip({
  totalUpdates,
  totalCompletionRate,
  totalPlatforms,
  thisWeekCount,
  currentWeek,
  totalPriority,
}: {
  totalUpdates: number
  totalCompletionRate: number
  totalPlatforms: number
  thisWeekCount: number
  currentWeek: string
  totalPriority: number
}) {
  const stats = [
    { label: "Total Updates", value: totalUpdates, sub: "All time", accent: false },
    { label: "Completion", value: `${totalCompletionRate}%`, sub: "With summary", accent: false },
    { label: "Platforms", value: totalPlatforms, sub: "Sources", accent: false },
    { label: "This Week", value: thisWeekCount, sub: currentWeek, accent: false },
    { label: "Priority", value: totalPriority, sub: "High importance", accent: true },
  ]

  return (
    <section className="border-b border-brand-black dark:border-white/10">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`px-6 lg:px-10 py-10 lg:py-14 border-r border-brand-black dark:border-white/10 last:border-r-0 ${
              s.accent ? "bg-brand-blue text-white" : "bg-background"
            }`}
          >
            <p className={`text-[10px] font-bold uppercase tracking-[0.12em] mb-3 ${s.accent ? "text-white/70" : "text-muted-foreground"}`}>
              {s.label}
            </p>
            <p className={`text-5xl lg:text-7xl font-bold tracking-tighter leading-none tabular-nums ${s.accent ? "text-white" : "text-foreground"}`}>
              {s.value}
            </p>
            <p className={`mt-2 text-xs ${s.accent ? "text-white/60" : "text-muted-foreground"}`}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function StudioUpdateCard({ update, size = "small" }: { update: MediaUpdate; size?: "large" | "small" }) {
  const platformMeta = PLATFORM_META[update.platform]
  const importanceMeta = IMPORTANCE_META[update.importance]
  const isLarge = size === "large"

  return (
    <article className="group flex flex-col border-t border-brand-black dark:border-white/10 pt-6 pb-8 h-full">
      {isLarge && update.imageUrl && (
        <div className="aspect-[16/10] mb-6 overflow-hidden relative bg-brand-gray dark:bg-white/5">
          <img
            src={update.imageUrl}
            alt={update.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
          />
        </div>
      )}
      <div className="flex flex-col gap-4 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border"
            style={{
              borderColor: `${platformMeta?.color || "#64748b"}40`,
              backgroundColor: `${platformMeta?.color || "#64748b"}15`,
              color: platformMeta?.color || "#475569",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: platformMeta?.color || "#64748b" }} />
            {platformMeta?.label || update.platform}
          </span>
          <span className={`inline-flex text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full border ${importanceMeta.className}`}>
            {importanceMeta.label}
          </span>
          <span className="inline-flex text-[10px] font-medium px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground">
            {CATEGORY_LABELS[update.category] || update.category}
          </span>
          <time className="ml-auto text-[10px] font-medium tabular-nums text-muted-foreground">{update.date}</time>
        </div>
        <div>
          <a
            href={update.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-start gap-2 font-bold leading-snug text-foreground transition-colors hover:text-brand-blue ${
              isLarge ? "text-2xl lg:text-3xl" : "text-lg lg:text-xl"
            }`}
          >
            <span>{update.title}</span>
            <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
          </a>
          {update.titleOriginal && update.titleOriginal !== update.title && (
            <p className="mt-1.5 italic-accent text-sm text-muted-foreground">{update.titleOriginal}</p>
          )}
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground flex-1">
          {update.summary || "Pending summary."}
        </p>
        <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
          <div className="flex flex-wrap gap-1.5">
            {update.tags.slice(0, isLarge ? 6 : 3).map((tag) => (
              <span key={tag} className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">
                {tag}
              </span>
            ))}
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{update.source}</span>
        </div>
      </div>
    </article>
  )
}

function UpdateTableView({ updates }: { updates: MediaUpdate[] }) {
  return (
    <div className="border-y border-brand-black dark:border-white/10" role="table">
      <div
        role="row"
        className="hidden sm:grid sm:grid-cols-[140px_1fr_auto_80px] gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-brand-black dark:border-white/10 bg-muted/20"
      >
        <div role="columnheader">Platform</div>
        <div role="columnheader">Title</div>
        <div role="columnheader">Category</div>
        <div role="columnheader">Date</div>
      </div>
      <div>
        {updates.map((update) => {
          const platformMeta = PLATFORM_META[update.platform]
          return (
            <div
              key={update.id}
              role="row"
              className="grid grid-cols-[1fr_auto] sm:grid-cols-[140px_1fr_auto_80px] gap-2 sm:gap-3 px-3 sm:px-4 h-10 border-b border-border/60 last:border-0 items-center transition-colors hover:bg-muted/20"
            >
              <div role="cell" className="flex items-center gap-1.5 overflow-hidden">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: platformMeta?.color }} />
                <span className="text-[11px] font-medium text-foreground truncate shrink-0">{platformMeta?.label || update.platform}</span>
              </div>
              <div role="cell" className="min-w-0">
                <a
                  href={update.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-medium text-foreground hover:text-brand-blue transition-colors line-clamp-1 leading-snug"
                >
                  {update.title}
                </a>
              </div>
              <div role="cell" className="hidden sm:block text-[10px] text-muted-foreground">
                {CATEGORY_LABELS[update.category] || update.category}
              </div>
              <div role="cell" className="hidden sm:flex items-center justify-end">
                <span className="text-[11px] tabular-nums text-muted-foreground">{update.date}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MasonryGroup({ items, groupIndex }: { items: MediaUpdate[]; groupIndex: number }) {
  // Editorial row-based layout: max 2 cards per row, varied proportions for rhythm
  // Uses inline gridColumn style (NOT Tailwind dynamic classes) to avoid CSS purge issues
  const rowPatterns: Array<[number, number?]> = [
    [8, 4],
    [6, 6],
    [4, 8],
    [12],
    [7, 5],
    [8, 4],
    [5, 7],
    [6, 6],
    [12],
    [4, 8],
  ]

  type Row = { items: MediaUpdate[]; spans: number[] }
  const rows: Row[] = []
  let i = 0
  let patternIdx = groupIndex % rowPatterns.length

  while (i < items.length) {
    const pattern = rowPatterns[patternIdx % rowPatterns.length]
    patternIdx++
    if (pattern.length === 1 || !items[i + 1]) {
      rows.push({ items: [items[i]], spans: [12] })
      i += 1
    } else {
      rows.push({ items: [items[i], items[i + 1]], spans: [pattern[0], pattern[1]!] })
      i += 2
    }
  }

  return (
    <div className="flex flex-col">
      {rows.map((row, rowIdx) => (
        <div
          key={row.items[0].id}
          className="grid gap-x-6 gap-y-0 animate-fade-up"
          style={{
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
            animationDelay: `${Math.min(groupIndex, 4) * 40 + rowIdx * 30 + 80}ms`,
          }}
        >
          {row.items.map((item, colIdx) => {
            const span = row.spans[colIdx]
            const size = span >= 7 ? "large" : "small"
            return (
              <div
                key={item.id}
                style={{ gridColumn: `span ${span} / span ${span}` }}
              >
                <StudioUpdateCard update={item} size={size} />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
function HomeClientInner({ updates, months, weeks }: HomeClientProps) {
  const searchParams = useSearchParams()
  const platformParam = searchParams.get("platform")
  const initialPlatform = (platformParam as Platform) || "all"

  const [platform, setPlatform] = useState<Platform | "all">(initialPlatform)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<Category | "all">("all")
  const [showTrend, setShowTrend] = useState(false)
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)
  const [tablePage, setTablePage] = useState(1)

  const fallbackWeekIndex = useMemo(() => {
    return weeks.findIndex((week) => updates.some((u) => u.week === week))
  }, [weeks, updates])

  const safeWeekIndex = fallbackWeekIndex >= 0
    ? Math.max(currentWeekIndex, fallbackWeekIndex === 0 ? currentWeekIndex : fallbackWeekIndex)
    : currentWeekIndex
  const currentWeek = weeks[safeWeekIndex] || weeks[0]

  useEffect(() => {
    if (currentWeekIndex >= weeks.length) setCurrentWeekIndex(0)
  }, [weeks, currentWeekIndex])

  useEffect(() => {
    setTablePage(1)
  }, [currentWeekIndex, platform, category, query])

  const weekFiltered = useMemo(() => {
    if (platform === "all") return updates
    return updates.filter((u) => u.week === currentWeek)
  }, [updates, currentWeek, platform])

  const filtered = useMemo(() => {
    let result = weekFiltered
    if (platform !== "all") result = result.filter((u) => u.platform === platform)
    if (category !== "all") result = result.filter((u) => u.category === category)
    if (query) {
      const q = query.toLowerCase()
      result = result.filter((u) =>
        u.title.toLowerCase().includes(q) ||
        u.summary.toLowerCase().includes(q) ||
        u.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }
    return result
  }, [weekFiltered, platform, query, category])

  useEffect(() => {
    const maxPage = Math.ceil(filtered.length / 10)
    if (tablePage > maxPage && maxPage > 0) setTablePage(maxPage)
  }, [filtered.length, tablePage])

  const grouped = useMemo(() => {
    const groups: Record<string, MediaUpdate[]> = {}
    for (const update of filtered) {
      const date = update.date || "unknown"
      if (!groups[date]) groups[date] = []
      groups[date].push(update)
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  const itemsPerPage = 10
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedTableData = useMemo(() => {
    const startIndex = (tablePage - 1) * itemsPerPage
    return filtered.slice(startIndex, startIndex + itemsPerPage)
  }, [filtered, tablePage])

  const totalUpdates = updates.length
  const totalCompleted = updates.filter((u) => u.summary?.trim()).length
  const totalCompletionRate = totalUpdates ? Math.round((totalCompleted / totalUpdates) * 100) : 0
  const totalPlatforms = new Set(updates.map((u) => u.platform)).size
  const totalPriority = updates.filter((u) => u.importance === "high").length

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SwissHeader onMenuOpen={() => setSidebarOpen(true)} />

      <Sidebar
        updates={updates}
        months={months}
        weeks={weeks}
        selectedPlatform={platform}
        onSelect={(p) => setPlatform(p)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1">
        <section className="px-6 lg:px-12 pt-24 pb-32 lg:pt-32 lg:pb-40 border-b border-brand-black dark:border-white/10 relative overflow-hidden">
          <div className="relative z-10 animate-fade-up">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6">
              多媒体平台更新追踪
            </p>
            <h1 className="swiss-h1 text-foreground mb-6">
              Media<br />
              <span className="italic-accent text-muted-foreground">Updates</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              覆盖 {totalPlatforms} 个广告平台 · {totalUpdates} 条更新记录 · TopTou 产品团队
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none" aria-hidden="true">
            <div
              className="absolute right-24 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
              style={{
                background: "radial-gradient(ellipse, rgba(0,26,255,0.15) 0%, transparent 70%)",
                filter: "blur(60px)",
              }}
            />
          </div>
        </section>

        <BiStatStrip
          totalUpdates={totalUpdates}
          totalCompletionRate={totalCompletionRate}
          totalPlatforms={totalPlatforms}
          thisWeekCount={weekFiltered.length}
          currentWeek={currentWeek || ""}
          totalPriority={totalPriority}
        />

        <section className="px-6 lg:px-12 py-6 border-b border-brand-black dark:border-white/10">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                placeholder="搜索更新、摘要或标签..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-6 pr-8 py-2 border-0 border-b border-brand-black dark:border-white/20 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-blue transition-colors"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex flex-wrap gap-2 flex-1">
                {CATEGORY_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setCategory(filter)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] rounded-full border transition-all ${
                      category === filter
                        ? "bg-brand-black text-white border-brand-black dark:bg-white dark:text-black dark:border-white"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {categoryLabel(filter)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setShowTrend(!showTrend)}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                    showTrend
                      ? "border-brand-black bg-brand-black text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-border text-muted-foreground hover:border-foreground"
                  }`}
                  title="Toggle trend chart"
                >
                  {showTrend ? <SlidersHorizontal className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setViewMode(viewMode === "card" ? "table" : "card")}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                    viewMode === "table"
                      ? "border-brand-black bg-brand-black text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-border text-muted-foreground hover:border-foreground"
                  }`}
                  aria-label={viewMode === "card" ? "Switch to table view" : "Switch to card view"}
                  aria-pressed={viewMode === "table"}
                >
                  {viewMode === "card" ? <List className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {showTrend && (
          <section className="px-6 lg:px-12 py-6 border-b border-brand-black dark:border-white/10">
            <TrendChart updates={weekFiltered} />
          </section>
        )}

        <div className="flex items-center justify-between gap-3 px-6 lg:px-12 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground border-b border-brand-black dark:border-white/10">
          <span>{filtered.length} updates</span>
          <span>{viewMode === "card" ? `${grouped.length} days` : "table view"}</span>
        </div>

        <div className="px-6 lg:px-12 py-8">
          {viewMode === "card" ? (
            <div className="space-y-12">
              {grouped.map(([date, items], groupIndex) => (
                <section key={date} className="animate-fade-up" style={{ animationDelay: `${Math.min(groupIndex, 4) * 40 + 80}ms` }}>
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-lg font-bold tracking-tight text-foreground">{date}</h2>
                    <div className="h-px flex-1 bg-brand-black/10 dark:bg-white/10" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{items.length}</span>
                  </div>
                  <MasonryGroup items={items} groupIndex={groupIndex} />
                </section>
              ))}
            </div>
          ) : (
            <div className="animate-fade-up space-y-3">
              <UpdateTableView updates={platform === "all" ? filtered : paginatedTableData} />
              {platform !== "all" && totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-4">
                  <button
                    onClick={() => setTablePage(tablePage - 1)}
                    disabled={tablePage === 1}
                    className="inline-flex h-8 items-center gap-1.5 px-4 text-[10px] font-bold uppercase tracking-wider border border-brand-black dark:border-white/20 transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed rounded-full"
                  >
                    <ChevronLeft className="h-3 w-3" /> Prev
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-wider tabular-nums text-muted-foreground">{tablePage} / {totalPages}</span>
                  <button
                    onClick={() => setTablePage(tablePage + 1)}
                    disabled={tablePage >= totalPages}
                    className="inline-flex h-8 items-center gap-1.5 px-4 text-[10px] font-bold uppercase tracking-wider border border-brand-black dark:border-white/20 transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed rounded-full"
                  >
                    Next <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="animate-fade-up border border-dashed border-brand-black/20 dark:border-white/10 py-24 text-center">
              <p className="text-2xl font-bold tracking-tight text-foreground">No updates found</p>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters or search terms.</p>
            </div>
          )}

          {platform !== "all" && (
            <div className="flex items-center justify-center gap-4 py-8">
              <button
                onClick={() => setCurrentWeekIndex(currentWeekIndex + 1)}
                disabled={currentWeekIndex >= weeks.length - 1}
                className="inline-flex h-8 items-center gap-1.5 px-4 text-[10px] font-bold uppercase tracking-wider border border-brand-black dark:border-white/20 transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed rounded-full"
              >
                <ChevronLeft className="h-3 w-3" /> Previous Week
              </button>
              <span className="text-sm font-bold text-muted-foreground">{currentWeek}</span>
              <button
                onClick={() => setCurrentWeekIndex(currentWeekIndex - 1)}
                disabled={currentWeekIndex === 0}
                className="inline-flex h-8 items-center gap-1.5 px-4 text-[10px] font-bold uppercase tracking-wider border border-brand-black dark:border-white/20 transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed rounded-full"
              >
                Next Week <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </main>

      <SwissFooter months={months} />
    </div>
  )
}

export function HomeClient(props: HomeClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <HomeClientInner {...props} />
    </Suspense>
  )
}
