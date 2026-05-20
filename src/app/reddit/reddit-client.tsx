"use client"

import { Suspense, useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X, ArrowUp, MessageCircle } from "lucide-react"
import { motion } from "motion/react"
import { SwissHeader, SwissFooter } from "@/app/components/page-layout"
import { SplashScreen } from "@/app/components/splash-screen"
import { Sidebar } from "@/app/components/sidebar"
import { REDDIT_SUBREDDIT_META, SORT_OPTIONS, type RedditPost, type SortKey } from "@/lib/reddit-types"
import { AnimatePresence } from "motion/react"
import type { MediaUpdate, Platform } from "@/lib/types"

interface RedditClientProps {
  posts: RedditPost[]
  allUpdates: MediaUpdate[]
  months: string[]
  weeks: string[]
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return "Today"
  if (diff === 1) return "Yesterday"
  if (diff < 7) return `${diff}d ago`
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`
  return dateStr
}

function RedditEditorialCard({ post, index }: { post: RedditPost; index: number }) {
  const meta = REDDIT_SUBREDDIT_META[post.subreddit]
  const isLarge = index % 4 === 0 || (post.keyInsight && index % 2 === 0)
  const colSpan = isLarge ? "md:col-span-8" : "md:col-span-4"

  return (
    <motion.article
      className={`${colSpan} group cursor-pointer`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full border-t-2 pt-5 lg:pt-6 pb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 transition-colors"
        style={{ borderTopColor: meta?.color || "#888" }}
      >
        {/* Header: subreddit badge + time + stats */}
        <div className="flex items-center justify-between gap-4 mb-4 lg:mb-6">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: meta?.color }}
              aria-hidden="true"
            />
            <h4 className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 truncate">
              r/{post.subreddit} {meta?.label && `· ${meta.label}`}
            </h4>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono opacity-35 shrink-0">
            <span className="flex items-center gap-1">
              <ArrowUp size={12} className="text-orange-500" />
              {formatCount(post.upvotes)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={12} />
              {formatCount(post.commentCount)}
            </span>
          </div>
        </div>

        {/* Flair */}
        {post.flair && (
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-blue">
            {post.flair}
          </div>
        )}

        {/* Title */}
        <h3 className={`font-bold tracking-tight leading-[1.05] group-hover:text-brand-blue transition-colors ${
          isLarge ? "text-2xl lg:text-3xl" : "text-lg lg:text-xl"
        }`}>
          {post.title}
        </h3>

        {/* Summary */}
        {post.summary && post.summary !== "（待 AI 总结）" && (
          <p className="mt-4 text-sm lg:text-base text-foreground/60 leading-snug line-clamp-3">
            {post.summary}
          </p>
        )}

        {/* Key Insight — gold highlight */}
        {post.keyInsight && (
          <div className="mt-4 pl-4 border-l-2 border-yellow-400/60">
            <p className="text-sm font-medium text-foreground/75 leading-snug italic">
              💡 {post.keyInsight}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-foreground/5">
          <span className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-25">
            u/{post.author || "anon"} · {timeAgo(post.date)}
          </span>
          <span className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-0 group-hover:opacity-25 transition-opacity">
            Read on Reddit →
          </span>
        </div>
      </a>
    </motion.article>
  )
}

function StatItem({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="py-12 lg:py-20 px-6 lg:px-12 flex flex-col justify-between items-start hover:bg-muted transition-colors group">
      <div className="flex items-baseline justify-between w-full">
        <span className="text-5xl lg:text-7xl xl:text-8xl font-bold tracking-tighter leading-none group-hover:scale-[1.02] transition-transform origin-left duration-700 tabular-nums">
          {value}
        </span>
      </div>
      <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-foreground/30 mt-6 lg:mt-8">
        {label}
      </p>
      <p className="text-[10px] font-bold text-brand-blue uppercase tracking-[0.15em] mt-1">
        {detail}
      </p>
    </div>
  )
}

const SUBREDDIT_LIST = Object.keys(REDDIT_SUBREDDIT_META)

function RedditClientInner({ posts, allUpdates, months, weeks }: RedditClientProps) {
  const searchParams = useSearchParams()
  const initialSub = searchParams.get("sub") || "all"

  const [activeSub, setActiveSub] = useState<string>(initialSub)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortKey>("upvotes")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const currentWeek = weeks[0] || ""

  // Derived stats
  const stats = useMemo(() => {
    const totalPosts = posts.length
    const totalSubs = new Set(posts.map(p => p.subreddit)).size
    const avgUpvotes = posts.length > 0
      ? Math.round(posts.reduce((s, p) => s + p.upvotes, 0) / posts.length)
      : 0
    const withInsight = posts.filter(p => p.keyInsight).length
    // Top subreddit by volume
    const subCounts: Record<string, number> = {}
    posts.forEach(p => { subCounts[p.subreddit] = (subCounts[p.subreddit] || 0) + 1 })
    const topSub = Object.entries(subCounts).sort((a, b) => b[1] - a[1])[0]
    return { totalPosts, totalSubs, avgUpvotes, withInsight, topSub }
  }, [posts])

  // Filter + sort
  const filtered = useMemo(() => {
    let result = posts
    if (activeSub !== "all") result = result.filter(p => p.subreddit === activeSub)
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.subreddit.toLowerCase().includes(q) ||
        (p.keyInsight || "").toLowerCase().includes(q)
      )
    }
    // Sort
    if (sort === "upvotes") result = [...result].sort((a, b) => b.upvotes - a.upvotes)
    else if (sort === "comments") result = [...result].sort((a, b) => b.commentCount - a.commentCount)
    else result = [...result].sort((a, b) => b.date.localeCompare(a.date))
    return result
  }, [posts, activeSub, query, sort])

  const handlePlatformSelect = useCallback((platform: Platform | "all") => {
    setSidebarOpen(false)
    if (platform === "all") router.push("/")
    else router.push(`/platform/${platform}`)
  }, [router])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand-blue selection:text-white transition-colors duration-700">
      <SplashScreen />
      <SwissHeader onMenuOpen={() => setSidebarOpen(true)} />

      {/* Sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-foreground/20 dark:bg-background/60 backdrop-blur-sm z-[60]"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              role="dialog" aria-modal="true" aria-label="导航菜单"
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
                updates={allUpdates} months={months} weeks={weeks}
                selectedPlatform="all"
                onSelect={handlePlatformSelect}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {/* ═══ Hero ═══ */}
        <section className="px-6 lg:px-12 pt-32 lg:pt-40 pb-24 lg:pb-40 border-b border-foreground overflow-hidden relative">
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-[10px] uppercase tracking-[0.5em] font-bold mb-12 lg:mb-16 flex items-center gap-6">
              <span className="w-12 h-[2px] bg-foreground" aria-hidden="true" />
              Daily Sync · Beijing 00:00 · {stats.totalSubs} Subreddits
            </div>

            <h1 className="swiss-h1 mb-12 lg:mb-16">
              Reddit <span className="italic-accent">Ad</span> Intel
            </h1>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 lg:gap-16">
              <p className="text-2xl lg:text-4xl xl:text-5xl font-light tracking-tighter max-w-3xl leading-[0.95]">
                来自 {stats.totalSubs} 个广告相关子版块的<span className="italic-accent">一手经验</span>——投放复盘、竞价策略、创意测试、平台内幕。
              </p>
              <Link href="#feed" className="swiss-button shrink-0">
                Browse Posts
              </Link>
            </div>
          </motion.div>

          {/* Abstract glow */}
          <div
            className="absolute -right-20 -top-20 w-[40vw] h-[40vw] bg-orange-500 blur-[120px] opacity-10 rounded-full pointer-events-none"
            aria-hidden="true"
          />
        </section>

        {/* ═══ Stats Strip ═══ */}
        <section className="grid grid-cols-2 lg:grid-cols-5 border-b border-foreground divide-x divide-foreground">
          <StatItem label="Discussions" value={stats.totalPosts.toString()} detail="LAST 30 DAYS" />
          <StatItem label="Subreddits" value={stats.totalSubs.toString()} detail="TRACKED" />
          <StatItem label="Avg Upvotes" value={formatCount(stats.avgUpvotes)} detail="PER POST" />
          <StatItem label="With Insights" value={stats.withInsight.toString()} detail="AI CURATED" />
          <div
            className="py-12 lg:py-20 px-6 lg:px-12 flex flex-col justify-between items-start transition-colors group"
            style={{ backgroundColor: stats.topSub ? REDDIT_SUBREDDIT_META[stats.topSub[0]]?.color : "#FF6600" }}
          >
            <div className="flex items-baseline justify-between w-full text-white">
              <span className="text-5xl lg:text-7xl xl:text-8xl font-bold tracking-tighter leading-none tabular-nums">
                {stats.topSub ? formatCount(stats.topSub[1]) : "0"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] translate-y-[-6px] text-white/70">
                TOP
              </span>
            </div>
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/60 mt-6 lg:mt-8">
              {stats.topSub ? `r/${stats.topSub[0]}` : "Active Community"}
            </p>
          </div>
        </section>

        {/* ═══ Control Strip (Sticky) ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="sticky top-20 lg:top-24 z-40 bg-background border-b border-foreground flex flex-col lg:flex-row items-stretch"
        >
          {/* Search */}
          <div className="flex-1 flex items-center px-6 lg:px-12 border-r-0 lg:border-r border-foreground py-5 lg:py-6 min-w-0">
            <Search size={20} className="shrink-0 mr-4 lg:mr-6 opacity-40" strokeWidth={1.5} aria-hidden="true" />
            <label htmlFor="reddit-search" className="sr-only">Search posts</label>
            <input
              id="reddit-search"
              type="search"
              placeholder="SEARCH DISCUSSIONS..."
              className="w-full bg-transparent outline-none font-sans font-bold text-xs uppercase tracking-[0.3em] placeholder:text-foreground/20"
              value={query}
              onChange={e => setQuery(e.target.value)}
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

          {/* Subreddit filter pills */}
          <div className="flex overflow-x-auto scrollbar-hide border-t lg:border-t-0 border-foreground">
            <button
              onClick={() => setActiveSub("all")}
              aria-pressed={activeSub === "all"}
              className={`px-6 lg:px-10 py-5 lg:py-6 text-[10px] uppercase font-bold tracking-[0.3em] border-r border-foreground transition-all whitespace-nowrap ${
                activeSub === "all" ? "bg-foreground text-background" : "hover:bg-muted"
              }`}
            >
              All · {posts.length}
            </button>
            {SUBREDDIT_LIST.map(sub => {
              const count = posts.filter(p => p.subreddit === sub).length
              if (count === 0) return null
              const meta = REDDIT_SUBREDDIT_META[sub]
              return (
                <button
                  key={sub}
                  onClick={() => setActiveSub(sub)}
                  aria-pressed={activeSub === sub}
                  className={`px-5 lg:px-8 py-5 lg:py-6 text-[10px] uppercase font-bold tracking-[0.3em] border-r border-foreground transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeSub === sub ? "bg-foreground text-background" : "hover:bg-muted"
                  }`}
                  style={activeSub === sub ? { backgroundColor: meta?.color, color: "#fff" } : {}}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: meta?.color }}
                    aria-hidden="true"
                  />
                  r/{sub}
                  <span className="opacity-50 ml-1">· {count}</span>
                </button>
              )
            })}
          </div>

          {/* Sort toggle */}
          <div className="flex border-t lg:border-t-0 border-l-0 lg:border-l border-foreground">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                aria-pressed={sort === opt.key}
                className={`px-5 lg:px-8 py-5 lg:py-6 text-[10px] uppercase font-bold tracking-[0.3em] transition-all whitespace-nowrap border-r border-foreground ${
                  sort === opt.key ? "bg-brand-blue text-white" : "hover:bg-muted"
                }`}
              >
                {opt.key === "upvotes" && <ArrowUp size={12} className="inline mr-1 -translate-y-px" />}
                {opt.key === "comments" && <MessageCircle size={12} className="inline mr-1 -translate-y-px" />}
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ═══ Feed Grid ═══ */}
        <section id="feed" className="px-6 lg:px-12 py-24 lg:py-32 border-b border-foreground">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 lg:mb-32 gap-8 lg:gap-12"
          >
            <div className="max-w-4xl">
              <div className="text-[10px] uppercase tracking-[0.5em] font-bold mb-4 lg:mb-6 flex items-center gap-4 opacity-40">
                Community Intel / {currentWeek}
              </div>
              <h2 className="swiss-h2">
                Every <span className="italic-accent">signal</span> from the<br />
                <span className="text-orange-500">frontlines</span> of advertising.
              </h2>
              {filtered.length < posts.length && (
                <p className="text-sm font-mono mt-6 opacity-40">
                  Showing {filtered.length} of {posts.length} discussions
                </p>
              )}
            </div>
          </motion.div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-y-16 md:gap-y-32 gap-x-8 md:gap-x-12">
              {filtered.slice(0, 30).map((post, i) => (
                <RedditEditorialCard key={post.id} post={post} index={i} />
              ))}
            </div>
          ) : (
            <div className="py-40 lg:py-60 text-center">
              <div className="text-5xl lg:text-7xl font-bold uppercase tracking-tighter opacity-10 mb-4">
                No Signal.
              </div>
              <p className="text-sm font-mono opacity-40">
                No posts match your current filters
              </p>
              <button
                onClick={() => { setQuery(""); setActiveSub("all"); setSort("upvotes") }}
                className="mt-8 swiss-button-outline"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Source attribution */}
          <div className="mt-24 lg:mt-32 pt-12 border-t border-foreground/10 text-center">
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-30">
              Aggregated from public Reddit posts · click through to read full threads · updated daily
            </p>
          </div>
        </section>
      </main>

      <SwissFooter months={months} />
    </div>
  )
}

export function RedditClient(props: RedditClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <RedditClientInner {...props} />
    </Suspense>
  )
}
