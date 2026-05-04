"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { BarChart3, ChevronLeft, ChevronRight, ExternalLink, FileText, LayoutGrid, List, Menu, Rss, Search, SlidersHorizontal, X } from "lucide-react"
import { Sidebar } from "./sidebar"
import { TrendChart } from "./trend-chart"
import { ThemeToggle } from "./theme-toggle"
import { LocaleToggle } from "./locale"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CATEGORY_LABELS, PLATFORM_META, type Category, type MediaUpdate, type Platform } from "@/lib/types"

interface HomeClientProps {
  updates: MediaUpdate[]
  months: string[]
  weeks: string[]
}

const CATEGORY_FILTERS: (Category | "all")[] = [
  "all",
  "ad-product",
  "api-change",
  "policy",
  "creative",
  "measurement",
  "targeting",
  "automation",
  "other",
]

const IMPORTANCE_META = {
  high: {
    label: "Priority",
    className: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
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

function Sparkline({ values }: { values: number[]; color?: string }) {
  const safeValues = values.length > 1 ? values : [0, values[0] ?? 0]
  const min = Math.min(...safeValues)
  const max = Math.max(...safeValues)
  const range = max - min || 1
  const points = safeValues.map((value, index) => {
    const x = (index / (safeValues.length - 1)) * 100
    const y = 28 - ((value - min) / range) * 24
    return `${x},${y}`
  })

  return (
    <svg className="h-8 w-full overflow-visible" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="currentColor"
        className="text-foreground"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function MetricCard({
  label,
  value,
  trend,
  helper,
}: {
  label: string
  value: string | number
  trend: number[]
  helper?: string
}) {
  return (
    <div className="flex h-[120px] flex-col justify-between py-4">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold leading-none tracking-tight text-foreground tabular-nums sm:text-2xl">{value}</span>
        {helper && (
          <span className="text-xs text-muted-foreground/50">{helper}</span>
        )}
      </div>
      <div>
        <Sparkline values={trend} />
      </div>
    </div>
  )
}

function getRecentDateCounts(updates: MediaUpdate[]) {
  const counts = new Map<string, number>()
  for (const update of updates) {
    const date = update.date || "unknown"
    counts.set(date, (counts.get(date) || 0) + 1)
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([, count]) => count)
}

function getRecentWeekCounts(updates: MediaUpdate[]) {
  const counts = new Map<string, number>()
  for (const update of updates) {
    const week = update.week || update.date?.slice(0, 7) || "unknown"
    counts.set(week, (counts.get(week) || 0) + 1)
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([, count]) => count)
}

function getCompletionTrend(updates: MediaUpdate[]) {
  const byDate = new Map<string, { complete: number; total: number }>()
  for (const update of updates) {
    const date = update.date || "unknown"
    const bucket = byDate.get(date) || { complete: 0, total: 0 }
    bucket.total += 1
    if (update.summary?.trim()) bucket.complete += 1
    byDate.set(date, bucket)
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([, bucket]) => Math.round((bucket.complete / bucket.total) * 100))
}

function getPlatformTrend(updates: MediaUpdate[]) {
  const byDate = new Map<string, Set<Platform>>()
  for (const update of updates) {
    const date = update.date || "unknown"
    const bucket = byDate.get(date) || new Set<Platform>()
    bucket.add(update.platform)
    byDate.set(date, bucket)
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([, bucket]) => bucket.size)
}

function categoryLabel(category: Category | "all") {
  if (category === "all") return "All"
  return CATEGORY_LABELS[category] || category
}

function UpdateDashboardCard({ update }: { update: MediaUpdate }) {
  const platformMeta = PLATFORM_META[update.platform]
  const importanceMeta = IMPORTANCE_META[update.importance]

  return (
    <article className="group rounded-xl border bg-card p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-[0_18px_44px_rgba(15,23,42,0.1)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
            style={{
              borderColor: `${platformMeta?.color || "#64748b"}30`,
              backgroundColor: `${platformMeta?.color || "#64748b"}12`,
              color: platformMeta?.color || "#475569",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: platformMeta?.color || "#64748b" }} />
            {platformMeta?.label || update.platform}
          </span>
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${importanceMeta.className}`}>
            {importanceMeta.label}
          </span>
          <span className="inline-flex rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {CATEGORY_LABELS[update.category] || update.category}
          </span>
        </div>
        <time className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">{update.date}</time>
      </div>

      <div className="mt-4">
        <a
          href={update.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-start gap-2 text-base font-semibold leading-snug text-foreground transition-colors hover:text-blue-600"
        >
          <span>{update.title}</span>
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
        </a>
        {update.titleOriginal && update.titleOriginal !== update.title && (
          <p className="mt-1 text-xs italic leading-relaxed text-muted-foreground">{update.titleOriginal}</p>
        )}
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {update.summary || "Pending summary."}
      </p>

      <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {update.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
        <span className="text-xs font-medium text-muted-foreground">{update.source}</span>
      </div>
    </article>
  )
}

function UpdateTableView({ updates }: { updates: MediaUpdate[] }) {
  const gridCols = "grid-cols-[1fr_auto] sm:grid-cols-[140px_1fr_auto_80px]"

  return (
    <div className="border-y" role="table">
      <div role="row" className={`hidden sm:grid ${gridCols} gap-3 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b bg-muted/30`}>
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
              className="grid grid-cols-[1fr_auto] sm:grid-cols-[140px_1fr_auto_80px] gap-2 sm:gap-3 px-3 sm:px-4 h-10 border-b border-border/60 last:border-0 items-center transition-colors hover:bg-muted/30"
            >
              {/* 平台 + 分类 */}
              <div role="cell" className="flex items-center gap-1.5 overflow-hidden">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: platformMeta?.color }} />
                <span className="text-[11px] font-medium text-foreground truncate shrink-0">{platformMeta?.label || update.platform}</span>
                <span className="text-[10px] text-muted-foreground/60 truncate shrink-0">
                  {CATEGORY_LABELS[update.category] || update.category}
                </span>
                <span className={`shrink-0 text-[9px] px-1 py-px rounded ${IMPORTANCE_META[update.importance].className} opacity-60`}>
                  {IMPORTANCE_META[update.importance].label}
                </span>
              </div>

              {/* 标题 */}
              <div role="cell" className="min-w-0">
                <a
                  href={update.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-medium text-foreground hover:text-blue-600 transition-colors line-clamp-1 leading-snug"
                >
                  {update.title}
                </a>
              </div>

              {/* 分类（仅桌面端显示在平台旁） */}
              <div role="cell" className="hidden sm:block" />

              {/* 日期 */}
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

  // 找到第一个在 updates.json 中实际有数据的周，避免最新周文件损坏导致首页空白
  const fallbackWeekIndex = useMemo(() => {
    return weeks.findIndex((week) => updates.some((u) => u.week === week))
  }, [weeks, updates])

  const safeWeekIndex = fallbackWeekIndex >= 0 ? Math.max(currentWeekIndex, fallbackWeekIndex === 0 ? currentWeekIndex : fallbackWeekIndex) : currentWeekIndex
  const currentWeek = weeks[safeWeekIndex] || weeks[0]

  // 确保 currentWeekIndex 不越界
  useEffect(() => {
    if (currentWeekIndex >= weeks.length) {
      setCurrentWeekIndex(0)
    }
  }, [weeks, currentWeekIndex])

  // 筛选条件变化时重置表格页码
  useEffect(() => {
    setTablePage(1)
  }, [currentWeekIndex, platform, category, query])

  // 先按周过滤（ALL 时不过滤）
  const weekFiltered = useMemo(() => {
    if (platform === "all") return updates
    return updates.filter((u) => u.week === currentWeek)
  }, [updates, currentWeek, platform])

  // 再按 platform/category/query 过滤
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

  // updates 变化时确保 tablePage 不越界
  useEffect(() => {
    const maxPage = Math.ceil(filtered.length / 10)
    if (tablePage > maxPage && maxPage > 0) {
      setTablePage(maxPage)
    }
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

  // 表格分页
  const itemsPerPage = 10
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedTableData = useMemo(() => {
    const startIndex = (tablePage - 1) * itemsPerPage
    return filtered.slice(startIndex, startIndex + itemsPerPage)
  }, [filtered, tablePage])

  // BI 指标：全量汇总数据
  const totalUpdates = updates.length
  const totalCompleted = updates.filter((u) => u.summary?.trim()).length
  const totalCompletionRate = totalUpdates ? Math.round((totalCompleted / totalUpdates) * 100) : 0
  const totalPlatforms = new Set(updates.map((u) => u.platform)).size
  const totalPriority = updates.filter((u) => u.importance === "high").length

  // Sparkline 趋势：所有周（从旧到新）
  const weeklyTrend = useMemo(() => {
    return [...weeks].reverse().map(week => updates.filter(u => u.week === week).length)
  }, [updates, weeks])

  const weeklyCompletionTrend = useMemo(() => {
    return [...weeks].reverse().map(week => {
      const weekUpdates = updates.filter(u => u.week === week)
      if (weekUpdates.length === 0) return 0
      const completed = weekUpdates.filter(u => u.summary?.trim()).length
      return Math.round((completed / weekUpdates.length) * 100)
    })
  }, [updates, weeks])

  const weeklyPlatformTrend = useMemo(() => {
    return [...weeks].reverse().map(week => {
      const weekUpdates = updates.filter(u => u.week === week)
      return new Set(weekUpdates.map(u => u.platform)).size
    })
  }, [updates, weeks])

  const weeklyPriorityTrend = useMemo(() => {
    return [...weeks].reverse().map(week => updates.filter(u => u.week === week && u.importance === "high").length)
  }, [updates, weeks])

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* 桌面端侧边栏 */}
      <div className="hidden lg:flex">
        <Sidebar updates={updates} months={months} weeks={weeks} selectedPlatform={platform} onSelect={setPlatform} />
      </div>

      {/* 移动端抽屉侧边栏 */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 z-50 h-full w-56 lg:hidden">
            <Sidebar updates={updates} months={months} weeks={weeks} selectedPlatform={platform} onSelect={(p) => { setPlatform(p); setSidebarOpen(false) }} />
          </div>
        </>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur lg:hidden">
          <div className="space-y-3 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div>
                  <h1 className="text-lg font-semibold tracking-normal text-foreground">Media Updates</h1>
                  <p className="text-xs font-medium text-muted-foreground">{filtered.length} visible updates</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <LocaleToggle />
                <ThemeToggle />
                <Link href="/log">
                  <Badge variant="outline" className="text-xs">Log</Badge>
                </Link>
                {months.length > 0 && (
                  <Link href={`/report/${months[0]}`}>
                    <Badge variant="outline" className="border-blue-200 text-xs text-blue-600">
                      {months[0]}
                    </Badge>
                  </Link>
                )}
              </div>
            </div>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none">
              <button
                onClick={() => setPlatform("all")}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  platform === "all" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                }`}
              >
                All
              </button>
              {Object.entries(PLATFORM_META).map(([key, meta]) => {
                const count = updates.filter((u) => u.platform === key).length
                if (count === 0) return null
                return (
                  <button
                    key={key}
                    onClick={() => setPlatform(key as Platform)}
                    className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      platform === key ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8">
          <div className="hidden animate-fade-up items-center justify-between gap-6 lg:flex">
            <div>
              <p className="text-sm font-semibold text-blue-600">广告平台追踪</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-normal text-foreground">Media Updates</h2>
              <p className="mt-2 text-sm text-muted-foreground">TopTou 产品团队 · 20+ 平台更新追踪</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/feed.xml" target="_blank" aria-label="RSS feed">
                <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground shadow-sm transition-colors hover:border-border hover:text-foreground">
                  <Rss className="h-4 w-4" aria-hidden="true" />
                </button>
              </Link>
              <Link href="/log" aria-label="Open log">
                <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground shadow-sm transition-colors hover:border-border hover:text-foreground">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </button>
              </Link>
              <LocaleToggle />
              <ThemeToggle />
            </div>
          </div>

          <section className="animate-fade-up grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 xl:grid-cols-5" style={{ animationDelay: "50ms" }}>
            <MetricCard label="Total Updates" value={totalUpdates} trend={weeklyTrend} helper="All time" />
            <MetricCard label="Completion" value={`${totalCompletionRate}%`} trend={weeklyCompletionTrend} helper={`${totalCompleted}/${totalUpdates}`} />
            <MetricCard label="Platforms" value={totalPlatforms} trend={weeklyPlatformTrend} helper="Sources" />
            <MetricCard label="This Week" value={weekFiltered.length} trend={weeklyTrend} helper={currentWeek} />
            <MetricCard label="Priority" value={totalPriority} trend={weeklyPriorityTrend} helper="High" />
          </section>

          <section className="animate-fade-up rounded-xl border bg-card p-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-4" style={{ animationDelay: "90ms" }}>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="搜索更新、摘要或标签..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 rounded-lg border bg-muted pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-blue-300 focus-visible:ring-blue-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="-mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5 scrollbar-none">
                  {CATEGORY_FILTERS.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setCategory(filter)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        category === filter
                          ? "bg-foreground text-background shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {categoryLabel(filter)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowTrend(!showTrend)}
                  className={`shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                    showTrend ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                  title="Toggle trend chart"
                >
                  {showTrend ? <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> : <BarChart3 className="h-4 w-4" aria-hidden="true" />}
                </button>
                <button
                  onClick={() => setViewMode(viewMode === "card" ? "table" : "card")}
                  className={`shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                    viewMode === "table" ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                  aria-label={viewMode === "card" ? "Switch to table view" : "Switch to card view"}
                  aria-pressed={viewMode === "table"}
                >
                  {viewMode === "card" ? <List className="h-4 w-4" aria-hidden="true" /> : <LayoutGrid className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </section>

          {showTrend && (
            <section className="animate-fade-up rounded-xl border bg-card p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <TrendChart updates={weekFiltered} />
            </section>
          )}

          <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
            <span>{filtered.length} updates</span>
            <div className="h-px flex-1 bg-border" />
            <span>{viewMode === "card" ? `${grouped.length} days` : "table view"}</span>
          </div>

          {viewMode === "card" ? (
            <div className="space-y-8">
              {grouped.map(([date, items], groupIndex) => (
                <section key={date} className="animate-fade-up" style={{ animationDelay: `${Math.min(groupIndex, 4) * 40 + 80}ms` }}>
                  <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-foreground">{date}</h2>
                    <div className="h-px flex-1 bg-border" />
                    <Badge variant="secondary" className="bg-card text-xs text-muted-foreground shadow-sm">{items.length}</Badge>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {items.map((update, itemIndex) => (
                      <div
                        key={update.id}
                        className="animate-fade-up"
                        style={{ animationDelay: `${Math.min(groupIndex, 4) * 40 + Math.min(itemIndex, 4) * 30 + 100}ms` }}
                      >
                        <UpdateDashboardCard update={update} />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="animate-fade-up space-y-3">
              <UpdateTableView updates={platform === "all" ? filtered : paginatedTableData} />
              {platform !== "all" && totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setTablePage(tablePage - 1)}
                    disabled={tablePage === 1}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    Prev
                  </button>
                  <span className="text-xs tabular-nums text-muted-foreground">{tablePage} / {totalPages}</span>
                  <button
                    onClick={() => setTablePage(tablePage + 1)}
                    disabled={tablePage >= totalPages}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="animate-fade-up rounded-xl border border-dashed bg-card py-24 text-center text-muted-foreground">
              <p className="text-lg font-semibold text-foreground">No updates found</p>
              <p className="mt-1 text-sm">Try adjusting your filters or search terms.</p>
            </div>
          )}

          {/* 周翻页 — 最下方（仅平台筛选时显示） */}
          {platform !== "all" && (
            <div className="flex items-center justify-center gap-3 py-4">
              <button
                onClick={() => setCurrentWeekIndex(currentWeekIndex + 1)}
                disabled={currentWeekIndex >= weeks.length - 1}
                className="inline-flex h-8 items-center gap-1 rounded-lg border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3 w-3" />
                Previous Week
              </button>
              <span className="text-sm font-medium text-muted-foreground">{currentWeek}</span>
              <button
                onClick={() => setCurrentWeekIndex(currentWeekIndex - 1)}
                disabled={currentWeekIndex === 0}
                className="inline-flex h-8 items-center gap-1 rounded-lg border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next Week
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </main>
      </div>
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
