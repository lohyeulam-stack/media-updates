"use client"

import { Suspense, useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search, ExternalLink, X } from "lucide-react"
import { motion } from "motion/react"
import { SwissHeader, SwissFooter } from "./page-layout"
import { Sidebar } from "./sidebar"
import { SplashScreen } from "./splash-screen"
import { CATEGORY_LABELS, PLATFORM_META, type Category, type MediaUpdate, type Platform } from "@/lib/types"
import { AnimatePresence } from "motion/react"

interface HomeClientProps {
  updates: MediaUpdate[]
  months: string[]
  weeks: string[]
}

const CATEGORY_FILTERS: (Category | "all")[] = [
  "all", "ad-product", "api-change", "policy", "creative",
]

function categoryLabel(category: Category | "all") {
  if (category === "all") return "全部"
  return CATEGORY_LABELS[category] || category
}

/**
 * Detect whether an imageUrl is actually a platform logo / default sharing card
 * rather than a real article cover. Logos make bad hero images on cards.
 */
function isLogoOrIcon(url: string | null | undefined): boolean {
  if (!url) return false
  const u = url.toLowerCase()
  // Known logo / default sharing-card patterns seen in scraped data
  const logoPatterns = [
    "/logo",            // googlelogo, snap ghost logo, etc.
    "googlelogo",
    "snapchat_logo",
    "_logo_",
    "-logo-",
    "/icon",
    "favicon",
    "sharing-card",     // X default sharing card
    "gmp.max",          // Google Marketing Platform logo
    "/logo.",
    "youtube_social",   // YouTube default social card
    "ghost_yellow",     // Snapchat ghost
  ]
  return logoPatterns.some((p) => u.includes(p))
}

/**
 * Editorial-style update card with dynamic sizing
 * Large cards (col-span-8) for high importance, small (col-span-4) for normal
 */
function StudioUpdateCard({ update, index }: { update: MediaUpdate; index: number }) {
  const platform = PLATFORM_META[update.platform]
  // Filter out logo/icon urls so they don't hijack the hero visual
  const hasRealImage = Boolean(update.imageUrl) && !isLogoOrIcon(update.imageUrl)
  const isTextOnly = !hasRealImage
  // Reference style: alternate between large and small cards
  const isLarge = index % 3 === 0
  const colSpan = isTextOnly ? "md:col-span-4" : (isLarge ? "md:col-span-8" : "md:col-span-4")

  if (isTextOnly) {
    return (
      <motion.article
        className={`${colSpan} group cursor-pointer`}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay: (index % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <a
          href={update.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full border-t-2 border-foreground/80 pt-5 lg:pt-6 pb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
        >
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: platform?.color }}
                aria-hidden="true"
              />
              <h4 className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 truncate">
                {platform?.label}
              </h4>
            </div>
            <div className="text-[10px] font-mono opacity-35 shrink-0">
              {update.date}
            </div>
          </div>

          <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-blue">
            {CATEGORY_LABELS[update.category] || update.category}
          </div>

          <h3 className="text-xl lg:text-2xl font-bold tracking-tight leading-[1.05] group-hover:text-brand-blue transition-colors">
            {update.title}
          </h3>

          {update.titleOriginal && update.titleOriginal !== update.title && (
            <p className="mt-4 text-sm lg:text-base font-serif italic text-foreground/40 leading-snug line-clamp-2">
              &ldquo;{update.titleOriginal}&rdquo;
            </p>
          )}

          {update.summary && (
            <p className="mt-5 text-sm lg:text-base text-foreground/60 leading-snug line-clamp-4">
              {update.summary}
            </p>
          )}

          {update.tags.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-6 pt-4 border-t border-foreground/5">
              {update.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-30"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </a>
      </motion.article>
    )
  }

  return (
    <motion.article
      className={`${colSpan} group cursor-pointer`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <a
        href={update.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
      >
        {/* Image block — only rendered when there's a real article cover image */}
        {hasRealImage && (
          <div className={`${isLarge ? "aspect-[16/9]" : "aspect-[4/3]"} mb-6 lg:mb-8 overflow-hidden relative group/img`}>
            <div
              className="absolute inset-0"
              style={{ backgroundColor: platform?.color || "#0a0a0a" }}
              aria-hidden="true"
            />
            <img
              src={update.imageUrl!}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/30 pointer-events-none"
              aria-hidden="true"
            />
            <div className="absolute top-4 left-4 lg:top-6 lg:left-6 text-[10px] font-bold uppercase tracking-[0.3em] bg-foreground text-background px-3 py-1 z-10">
              {CATEGORY_LABELS[update.category] || update.category}
            </div>
            <div className="absolute top-4 right-4 lg:top-6 lg:right-6 text-[10px] font-mono z-10 text-white/80">
              {update.date}
            </div>
            <div className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white">
              <ExternalLink size={isLarge ? 32 : 24} strokeWidth={1.5} />
            </div>
          </div>
        )}

        <div className="space-y-3 lg:space-y-4">
          {/* Platform indicator */}
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: platform?.color }}
              aria-hidden="true"
            />
            <h4 className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40">
              {platform?.label}
            </h4>
          </div>

          {/* Title - the hero */}
          <h3 className={`font-bold tracking-tight leading-[1] group-hover:text-brand-blue transition-colors ${
            isLarge ? "text-3xl lg:text-5xl" : "text-xl lg:text-2xl"
          }`}>
            {update.title}
          </h3>

          {/* Original title - serif italic */}
          {update.titleOriginal && update.titleOriginal !== update.title && (
            <p className="text-sm lg:text-base font-serif italic text-foreground/40 leading-snug">
              &ldquo;{update.titleOriginal}&rdquo;
            </p>
          )}

          {/* Summary */}
          {update.summary && (
            <p className={`text-foreground/60 leading-snug ${isLarge ? "line-clamp-3 text-base" : "line-clamp-2 text-sm"}`}>
              {update.summary}
            </p>
          )}

          {/* Tags */}
          {update.tags.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-3 lg:pt-4 border-t border-foreground/5">
              {update.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-30"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </a>
    </motion.article>
  )
}

function HomeClientInner({ updates, months, weeks }: HomeClientProps) {
  const searchParams = useSearchParams()
  const initialPlatform = (searchParams.get("platform") as Platform) || "all"

  const [platform, setPlatform] = useState<Platform | "all">(initialPlatform)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<Category | "all">("all")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentWeek = weeks[0] || ""
  const latestDate = updates.length > 0 ? updates[0].date : ""

  const filtered = useMemo(() => {
    let result = updates
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
  }, [updates, platform, query, category])

  const thisWeekUpdates = updates.filter((u) => u.week === currentWeek)

  const stats = useMemo(() => {
    const totalUpdates = updates.length
    const totalPlatforms = new Set(updates.map((u) => u.platform)).size
    const totalPriority = updates.filter((u) => u.importance === "high").length
    const weeksCount = new Set(updates.map((u) => u.week).filter(Boolean)).size
    return { totalUpdates, totalPlatforms, totalPriority, weeksCount, thisWeek: thisWeekUpdates.length }
  }, [updates, thisWeekUpdates.length])

  const handlePlatformSelect = useCallback((p: Platform | "all") => {
    setPlatform(p)
    setSidebarOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand-blue selection:text-white transition-colors duration-700">
      <SplashScreen />
      <SwissHeader onMenuOpen={() => setSidebarOpen(true)} />

      {/* Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-foreground/20 dark:bg-background/60 backdrop-blur-sm z-[60]"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              role="dialog"
              aria-modal="true"
              aria-label="导航菜单"
              className="fixed inset-y-0 right-0 w-full lg:w-[440px] bg-background z-[70] border-l border-foreground p-8 lg:p-12 overflow-y-auto"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-8 right-8 lg:top-12 lg:right-12 text-foreground hover:text-brand-blue transition-colors z-10"
                aria-label="关闭菜单"
              >
                <X size={32} strokeWidth={1.5} />
              </button>
              <Sidebar
                updates={updates}
                months={months}
                weeks={weeks}
                selectedPlatform={platform}
                onSelect={handlePlatformSelect}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {/* ═══════════════════════════════════════════════
            1. MEGA HERO SECTION
            ═══════════════════════════════════════════════ */}
        <section className="px-6 lg:px-12 pt-32 lg:pt-40 pb-32 lg:pb-56 border-b border-foreground overflow-hidden relative">
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Eyebrow */}
            <div className="text-[10px] uppercase tracking-[0.5em] font-bold mb-12 lg:mb-16 flex items-center gap-6">
              <span className="w-12 h-[2px] bg-foreground" aria-hidden="true" />
              Daily Sync · Beijing 00:00 · {stats.totalPlatforms} Platforms
            </div>

            {/* Swiss H1 - 10vw English typography */}
            <h1 className="swiss-h1 mb-12 lg:mb-16">
              Track every <span className="italic-accent">shift</span><br />
              in the <span className="text-brand-blue">Ad</span> world.
            </h1>

            {/* Description + CTA */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 lg:gap-16">
              <p className="text-2xl lg:text-4xl xl:text-5xl font-light tracking-tighter max-w-3xl leading-[0.95]">
                每日 00:00 自动同步 TikTok、Meta、Google 等 <span className="italic-accent">20+</span> 广告平台的产品更新、API 变更与政策调整。一切<span className="italic-accent">尽在掌握</span>。
              </p>
              <Link href="#feed" className="swiss-button shrink-0">
                View This Week
              </Link>
            </div>
          </motion.div>

          {/* Blue abstract flow */}
          <div
            className="absolute -right-20 -top-20 w-[40vw] h-[40vw] bg-brand-blue blur-[120px] opacity-10 rounded-full pointer-events-none"
            aria-hidden="true"
          />
        </section>

        {/* ═══════════════════════════════════════════════
            2. BI METRICS STRIP
            ═══════════════════════════════════════════════ */}
        <section className="grid grid-cols-2 lg:grid-cols-5 border-b border-foreground divide-x divide-foreground">
          <StatItem label="Total Updates" value={stats.totalUpdates.toString()} change="ALL TIME" />
          <StatItem label="Platforms" value={stats.totalPlatforms.toString()} change="TRACKED" />
          <StatItem label="This Week" value={stats.thisWeek.toString()} change="NEW" />
          <StatItem label="Weeks Archived" value={stats.weeksCount.toString()} change="HISTORY" />
          <div className="py-12 lg:py-20 px-6 lg:px-12 flex flex-col justify-between items-start bg-brand-blue text-white group cursor-crosshair">
            <div className="flex items-baseline justify-between w-full">
              <span className="text-5xl lg:text-7xl xl:text-8xl font-bold tracking-tighter leading-none">
                {stats.totalPriority.toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] translate-y-[-6px]">
                URGENT
              </span>
            </div>
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-60 mt-6 lg:mt-8">
              Priority Updates
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            3. CONTROL STRIP (Sticky)
            ═══════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="sticky top-20 lg:top-24 z-40 bg-background border-b border-foreground flex flex-col lg:flex-row items-stretch"
        >
          {/* Search input */}
          <div className="flex-1 flex items-center px-6 lg:px-12 border-r-0 lg:border-r border-foreground py-5 lg:py-6 min-w-0">
            <Search size={20} className="shrink-0 mr-4 lg:mr-6 opacity-40" strokeWidth={1.5} aria-hidden="true" />
            <label htmlFor="home-search" className="sr-only">Search updates</label>
            <input
              id="home-search"
              type="search"
              placeholder="FILTER THE FEED..."
              className="w-full bg-transparent outline-none font-sans font-bold text-xs uppercase tracking-[0.3em] placeholder:text-foreground/20"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="搜索更新、摘要或标签"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="ml-4 shrink-0 opacity-40 hover:opacity-100 transition-opacity"
                aria-label="清除搜索"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex overflow-x-auto scrollbar-hide border-t lg:border-t-0 border-foreground">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                aria-pressed={category === cat}
                className={`px-6 lg:px-12 py-5 lg:py-6 text-[10px] uppercase font-bold tracking-[0.3em] border-r border-foreground transition-all whitespace-nowrap ${
                  category === cat
                    ? "bg-foreground text-background"
                    : "hover:bg-muted"
                }`}
              >
                {categoryLabel(cat)}
              </button>
            ))}
            <button
              onClick={() => setSidebarOpen(true)}
              className="px-6 lg:px-12 py-5 lg:py-6 bg-brand-blue text-white flex items-center gap-3 text-[10px] uppercase font-bold tracking-[0.3em] hover:bg-foreground dark:hover:bg-white dark:hover:text-foreground transition-all whitespace-nowrap"
            >
              Filters +{stats.totalPlatforms - 4}
            </button>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════
            4. UPDATE FEED (Editorial Masonry)
            ═══════════════════════════════════════════════ */}
        <section id="feed" className="px-6 lg:px-12 py-24 lg:py-32 border-b border-foreground">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 lg:mb-32 gap-8 lg:gap-12"
          >
            <div className="max-w-4xl">
              <div className="text-[10px] uppercase tracking-[0.5em] font-bold mb-4 lg:mb-6 flex items-center gap-4 opacity-40">
                This Week / {currentWeek}
              </div>
              <h2 className="swiss-h2">
                Every <span className="italic-accent">signal</span>,<br />
                worth <span className="text-brand-blue">capturing</span>.
              </h2>
              {latestDate && (
                <p className="text-sm font-mono mt-6 opacity-40">
                  Latest / {latestDate} · Showing {filtered.length} of {updates.length}
                </p>
              )}
            </div>
          </motion.div>

          {/* Masonry grid - 8+4 alternating */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-y-16 md:gap-y-32 gap-x-8 md:gap-x-12">
              {filtered.slice(0, 24).map((update, i) => (
                <StudioUpdateCard key={update.id} update={update} index={i} />
              ))}
            </div>
          ) : (
            <div className="col-span-12 py-40 lg:py-60 text-center">
              <div className="text-5xl lg:text-7xl font-bold uppercase tracking-tighter opacity-10 mb-4">
                No Signal.
              </div>
              <p className="text-sm font-mono opacity-40">
                No updates match your filters
              </p>
              {(query || category !== "all" || platform !== "all") && (
                <button
                  onClick={() => {
                    setQuery("")
                    setCategory("all")
                    setPlatform("all")
                  }}
                  className="mt-8 swiss-button-outline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Load more indicator */}
          {filtered.length > 24 && (
            <div className="text-center pt-24 lg:pt-32">
              <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40 mb-6">
                Showing 24 / {filtered.length}
              </p>
              <Link href={`/weekly/${currentWeek}`} className="swiss-button-outline">
                View Full Weekly Report
              </Link>
            </div>
          )}
        </section>
      </main>

      <SwissFooter months={months} />
    </div>
  )
}

function StatItem({ label, value, change }: { label: string; value: string; change: string }) {
  return (
    <div className="py-12 lg:py-20 px-6 lg:px-12 flex flex-col justify-between items-start hover:bg-muted transition-colors group">
      <div className="flex items-baseline justify-between w-full">
        <span className="text-5xl lg:text-7xl xl:text-8xl font-bold tracking-tighter leading-none group-hover:scale-[1.02] transition-transform origin-left duration-700 tabular-nums">
          {value}
        </span>
        <span className="text-[10px] font-bold text-brand-blue uppercase tracking-[0.3em] translate-y-[-6px]">
          {change}
        </span>
      </div>
      <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-foreground/30 mt-6 lg:mt-8">
        {label}
      </p>
    </div>
  )
}

export function HomeClient(props: HomeClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeClientInner {...props} />
    </Suspense>
  )
}
