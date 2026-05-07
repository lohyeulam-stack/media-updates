"use client"

import { Suspense, useCallback, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Search, X, BarChart3, SlidersHorizontal, List, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react"
import { SwissHeader, SwissFooter } from "./page-layout"
import { Sidebar } from "./sidebar"
import { UpdateCard } from "./update-card"
import { UpdateTableView } from "./update-table-view"
import { TrendChart } from "./trend-chart"
import type { MediaUpdate, Platform, Category } from "@/lib/types"

const CATEGORY_FILTERS: (Category | "all")[] = ["all", "ad-product", "api-change", "policy", "creative", "measurement", "targeting", "automation", "other"]

function categoryLabel(c: Category | "all"): string {
  const labels: Record<Category | "all", string> = {
    all: "全部",
    "ad-product": "产品",
    "api-change": "API",
    policy: "政策",
    creative: "创意",
    measurement: "监测",
    targeting: "定向",
    automation: "自动化",
    other: "其他",
  }
  return labels[c] || c
}

interface BiStatStripProps {
  totalUpdates: number
  totalCompletionRate: number
  totalPlatforms: number
  thisWeekCount: number
  currentWeek: string
  totalPriority: number
}

function BiStatStrip({ totalUpdates, totalCompletionRate, totalPlatforms, thisWeekCount, currentWeek, totalPriority }: BiStatStripProps) {
  const stats = [
    { label: "总更新数", value: totalUpdates.toLocaleString(), unit: "条" },
    { label: "覆盖平台", value: totalPlatforms, unit: "个" },
    { label: "本周新增", value: thisWeekCount, unit: "条", highlight: true },
    { label: "重要更新", value: totalPriority, unit: "条", highlight: totalPriority > 0 },
  ]

  return (
    <section className="border-b border-border/50 dark:border-white/5 bg-muted/30 dark:bg-white/[0.01]">
      <div className="px-6 lg:px-12 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                {stat.label}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-3xl lg:text-4xl font-bold tracking-tight tabular-nums ${stat.highlight ? "text-brand-blue dark:text-blue-400" : "text-foreground"}`}>
                  {stat.value}
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  {stat.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

interface HomeClientInnerProps {
  updates: MediaUpdate[]
  months: string[]
  weeks: string[]
}

function HomeClientInner({ updates, months, weeks }: HomeClientInnerProps) {
  const searchParams = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [platform, setPlatform] = useState<Platform | "all">("all")
  const [category, setCategory] = useState<Category | "all">("all")
  const [query, setQuery] = useState("")
  const [showTrend, setShowTrend] = useState(false)
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
  const [tablePage, setTablePage] = useState(1)
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)

  const TABLE_PAGE_SIZE = 50
  const currentWeek = weeks[currentWeekIndex] || weeks[0]

  // Filtering logic
  const filtered = useMemo(() => {
    return updates.filter((u) => {
      if (platform !== "all" && u.platform !== platform) return false
      if (category !== "all" && u.category !== category) return false
      if (query) {
        const q = query.toLowerCase()
        return (
          u.title.toLowerCase().includes(q) ||
          u.summary?.toLowerCase().includes(q) ||
          u.tags.some((t) => t.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [updates, platform, category, query])

  const weekFiltered = useMemo(() => {
    return platform === "all" ? filtered : filtered.filter((u) => u.week === currentWeek)
  }, [filtered, platform, currentWeek])

  const grouped = useMemo(() => {
    const byDate: Record<string, MediaUpdate[]> = {}
    weekFiltered.forEach((u) => {
      if (!byDate[u.date]) byDate[u.date] = []
      byDate[u.date].push(u)
    })
    return Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, items }))
  }, [weekFiltered])

  // Table pagination
  const safeTablePage = Math.max(1, Math.min(tablePage, Math.ceil(filtered.length / TABLE_PAGE_SIZE)))
  const totalPages = Math.ceil(filtered.length / TABLE_PAGE_SIZE)
  const paginatedTableData = useMemo(() => {
    if (platform === "all") return filtered
    const start = (safeTablePage - 1) * TABLE_PAGE_SIZE
    return filtered.slice(start, start + TABLE_PAGE_SIZE)
  }, [filtered, platform, safeTablePage])

  // Stats
  const stats = useMemo(() => {
    const totalUpdates = updates.length
    const totalCompleted = updates.filter((u) => u.summary && u.summary.length > 10).length
    const totalCompletionRate = totalUpdates ? Math.round((totalCompleted / totalUpdates) * 100) : 0
    const totalPlatforms = new Set(updates.map((u) => u.platform)).size
    const totalPriority = updates.filter((u) => u.importance === "high").length

    return {
      totalUpdates,
      totalCompleted,
      totalCompletionRate,
      totalPlatforms,
      totalPriority,
    }
  }, [updates])

  // Event handlers
  const handlePlatformSelect = useCallback((p: Platform | "all") => {
    setPlatform(p)
    setTablePage(1)
  }, [])

  const handleCategorySelect = useCallback((c: Category | "all") => {
    setCategory(c)
    setTablePage(1)
  }, [])

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    setTablePage(1)
  }, [])

  const handleShowTrendToggle = useCallback(() => {
    setShowTrend((prev) => !prev)
  }, [])

  const handleViewModeToggle = useCallback(() => {
    setViewMode((prev) => (prev === "card" ? "table" : "card"))
  }, [])

  const handleClearFilters = useCallback(() => {
    setQuery("")
    setCategory("all")
    setPlatform("all")
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SwissHeader onMenuOpen={() => setSidebarOpen(true)} />

      <Sidebar
        updates={updates}
        months={months}
        weeks={weeks}
        selectedPlatform={platform}
        onSelect={handlePlatformSelect}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1">
        {/* Hero Section - Largest, most prominent */}
        <section className="relative px-6 lg:px-12 pt-20 pb-24 lg:pt-28 lg:pb-32 border-b border-border/50 dark:border-white/5 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div
              className="absolute right-0 top-0 w-[600px] h-[600px] opacity-30 dark:opacity-20"
              style={{
                background: "radial-gradient(circle at center, rgba(0,26,255,0.15) 0%, transparent 70%)",
                filter: "blur(80px)",
              }}
            />
          </div>

          <div className="relative z-10 max-w-4xl">
            {/* Eyebrow - smallest */}
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-6 animate-fade-up">
              多媒体平台更新追踪系统
            </p>

            {/* Main title - largest */}
            <h1 className="text-5xl lg:text-7xl font-bold tracking-[-0.02em] leading-[0.95] mb-6 animate-fade-up animation-delay-100">
              <span className="text-foreground">Media</span>
              <br />
              <span className="text-muted-foreground/60 italic">Updates</span>
            </h1>

            {/* Description - medium */}
            <p className="text-lg lg:text-xl text-muted-foreground/80 max-w-2xl leading-relaxed mb-8 animate-fade-up animation-delay-200">
              实时追踪 {stats.totalPlatforms} 个广告平台的产品更新、API 变更和政策调整
            </p>

            {/* CTA - prominent */}
            <div className="flex flex-wrap gap-3 animate-fade-up animation-delay-300">
              <button
                onClick={() => setSidebarOpen(true)}
                className="inline-flex items-center gap-2 h-11 px-6 bg-brand-black dark:bg-white text-white dark:text-black text-sm font-bold tracking-wide rounded-full hover:bg-brand-blue dark:hover:bg-blue-500 transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                浏览平台
              </button>
              <a
                href="#search"
                className="inline-flex items-center gap-2 h-11 px-6 border-2 border-border dark:border-white/10 text-foreground text-sm font-bold tracking-wide rounded-full hover:border-foreground dark:hover:border-white/30 hover:bg-muted/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                搜索更新
              </a>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <BiStatStrip
          totalUpdates={stats.totalUpdates}
          totalCompletionRate={stats.totalCompletionRate}
          totalPlatforms={stats.totalPlatforms}
          thisWeekCount={weekFiltered.length}
          currentWeek={currentWeek}
          totalPriority={stats.totalPriority}
        />

        {/* Search and Filter Section */}
        <section id="search" className="px-6 lg:px-12 py-8 border-b border-border/50 dark:border-white/5 bg-muted/20 dark:bg-white/[0.005]">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Search Input - Most prominent */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/40" aria-hidden="true" />
              <label htmlFor="home-search" className="sr-only">搜索更新、摘要或标签</label>
              <input
                id="home-search"
                type="search"
                placeholder="搜索更新、摘要或标签..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="w-full h-14 pl-12 pr-12 text-base bg-background dark:bg-white/5 border-2 border-border dark:border-white/10 rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand-blue dark:focus:border-blue-500 focus:ring-4 focus:ring-brand-blue/10 dark:focus:ring-blue-500/10 transition-all"
              />
              {query && (
                <button
                  onClick={() => handleQueryChange("")}
                  aria-label="清除搜索"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Category Pills - Medium prominence */}
              <div className="flex flex-wrap gap-2 flex-1" role="group" aria-label="分类筛选">
                {CATEGORY_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleCategorySelect(filter)}
                    aria-pressed={category === filter}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      category === filter
                        ? "bg-brand-black dark:bg-white text-white dark:text-black border-brand-black dark:border-white scale-105"
                        : "border-border dark:border-white/10 text-muted-foreground hover:border-foreground dark:hover:border-white/30 hover:text-foreground hover:scale-105"
                    }`}
                  >
                    {categoryLabel(filter)}
                  </button>
                ))}
              </div>

              {/* View Controls - Smaller, right-aligned */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleShowTrendToggle}
                  aria-label={showTrend ? "隐藏趋势图" : "显示趋势图"}
                  aria-pressed={showTrend}
                  title={showTrend ? "隐藏趋势图" : "显示趋势图"}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    showTrend
                      ? "border-brand-black dark:border-white bg-brand-black dark:bg-white text-white dark:text-black"
                      : "border-border dark:border-white/10 text-muted-foreground hover:border-foreground dark:hover:border-white/30 hover:bg-muted/50"
                  }`}
                >
                  {showTrend ? <SlidersHorizontal className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                </button>
                <button
                  onClick={handleViewModeToggle}
                  aria-label={viewMode === "card" ? "切换到表格视图" : "切换到卡片视图"}
                  aria-pressed={viewMode === "table"}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    viewMode === "table"
                      ? "border-brand-black dark:border-white bg-brand-black dark:bg-white text-white dark:text-black"
                      : "border-border dark:border-white/10 text-muted-foreground hover:border-foreground dark:hover:border-white/30 hover:bg-muted/50"
                  }`}
                >
                  {viewMode === "card" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Trend Chart */}
        {showTrend && (
          <section className="px-6 lg:px-12 py-8 border-b border-border/50 dark:border-white/5 bg-muted/10 dark:bg-white/[0.002]">
            <div className="max-w-5xl mx-auto">
              <TrendChart updates={weekFiltered} />
            </div>
          </section>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between gap-4 px-6 lg:px-12 py-4 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground/60 border-b border-border/50 dark:border-white/5 bg-muted/10 dark:bg-white/[0.002]">
          <span>{filtered.length} 条更新</span>
          <span>{viewMode === "card" ? `${grouped.length} 天` : "表格视图"}</span>
        </div>

        {/* Content Area */}
        <div className="px-6 lg:px-12 py-12">
          <div className="max-w-5xl mx-auto">
            {viewMode === "card" ? (
              <div className="space-y-12 animate-fade-up">
                {grouped.map(({ date, items }) => (
                  <div key={date} className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground/60 sticky top-16 bg-background/80 backdrop-blur-sm py-2 z-10">
                      {date}
                    </h2>
                    <div className="grid gap-4">
                      {items.map((update) => (
                        <UpdateCard key={update.id} update={update} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="animate-fade-up space-y-6">
                <UpdateTableView updates={platform === "all" ? filtered : paginatedTableData} />
                {platform !== "all" && totalPages > 1 && (
                  <nav className="flex items-center justify-center gap-4" aria-label="表格分页">
                    <button
                      onClick={() => setTablePage(safeTablePage - 1)}
                      disabled={safeTablePage === 1}
                      aria-label="上一页"
                      className="inline-flex h-10 items-center gap-2 px-5 text-xs font-bold uppercase tracking-wider border-2 border-border dark:border-white/10 rounded-full transition-all hover:border-foreground dark:hover:border-white/30 hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" /> 上一页
                    </button>
                    <span className="text-sm font-bold tabular-nums text-muted-foreground" aria-current="page">
                      {safeTablePage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setTablePage(safeTablePage + 1)}
                      disabled={safeTablePage >= totalPages}
                      aria-label="下一页"
                      className="inline-flex h-10 items-center gap-2 px-5 text-xs font-bold uppercase tracking-wider border-2 border-border dark:border-white/10 rounded-full transition-all hover:border-foreground dark:hover:border-white/30 hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      下一页 <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </div>
            )}

            {/* Empty State */}
            {filtered.length === 0 && (
              <div className="animate-fade-up border-2 border-dashed border-border/50 dark:border-white/10 py-20 px-6 text-center rounded-2xl" role="status">
                <p className="text-2xl font-bold tracking-tight text-foreground mb-3">未找到更新</p>
                <p className="text-sm text-muted-foreground mb-6">尝试调整筛选条件或搜索关键词</p>
                {(query || category !== "all" || platform !== "all") && (
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-2 h-10 px-5 text-xs font-bold uppercase tracking-wider border-2 border-border dark:border-white/10 rounded-full transition-all hover:border-foreground dark:hover:border-white/30 hover:bg-muted/50 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    清空筛选
                  </button>
                )}
              </div>
            )}

            {/* Week Navigation */}
            {platform !== "all" && (
              <nav className="flex items-center justify-center gap-4 pt-12 mt-12 border-t border-border/50 dark:border-white/5" aria-label="周导航">
                <button
                  onClick={() => setCurrentWeekIndex(currentWeekIndex + 1)}
                  disabled={currentWeekIndex >= weeks.length - 1}
                  aria-label="上一周"
                  className="inline-flex h-10 items-center gap-2 px-5 text-xs font-bold uppercase tracking-wider border-2 border-border dark:border-white/10 rounded-full transition-all hover:border-foreground dark:hover:border-white/30 hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" /> 上一周
                </button>
                <span className="text-sm font-bold tabular-nums text-muted-foreground" aria-current="page">
                  {currentWeek}
                </span>
                <button
                  onClick={() => setCurrentWeekIndex(currentWeekIndex - 1)}
                  disabled={currentWeekIndex === 0}
                  aria-label="下一周"
                  className="inline-flex h-10 items-center gap-2 px-5 text-xs font-bold uppercase tracking-wider border-2 border-border dark:border-white/10 rounded-full transition-all hover:border-foreground dark:hover:border-white/30 hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  下一周 <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            )}
          </div>
        </div>
      </main>

      <SwissFooter months={months} />
    </div>
  )
}

export function HomeClient(props: HomeClientInnerProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeClientInner {...props} />
    </Suspense>
  )
}
