"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Sidebar } from "@/app/components/sidebar"
import { SwissHeader, SwissFooter } from "@/app/components/page-layout"
import { PLATFORM_META, CATEGORY_LABELS, type Platform, type MediaUpdate } from "@/lib/types"

interface Props {
  platform: Platform
  updates: MediaUpdate[]
  allUpdates: MediaUpdate[]
  months: string[]
  weeks: string[]
}

const IMPORTANCE_META = {
  high: { label: "Priority" },
  medium: { label: "Info" },
  low: { label: "Active" },
}

export function PlatformClient({ platform, updates, allUpdates, months, weeks }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const meta = PLATFORM_META[platform]

  const grouped = updates.reduce((acc, u) => {
    const d = u.date || "unknown"
    if (!acc[d]) acc[d] = []
    acc[d].push(u)
    return acc
  }, {} as Record<string, MediaUpdate[]>)
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const latestDate = sortedDates[0] || ""
  const thisWeekCount = updates.filter((u) => u.week === weeks[0]).length

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand-blue selection:text-white transition-colors duration-700">
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
                updates={allUpdates}
                months={months}
                weeks={weeks}
                selectedPlatform={platform}
                onSelect={(p) => {
                  setSidebarOpen(false)
                  if (p === "all") window.location.href = "/"
                  else window.location.href = `/platform/${p}`
                }}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {/* Platform Hero */}
        <section className="px-6 lg:px-12 pt-32 lg:pt-40 pb-24 lg:pb-32 border-b border-foreground relative overflow-hidden">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] hover:text-brand-blue transition-colors mb-12 lg:mb-16"
            >
              <ArrowLeft size={14} strokeWidth={2} /> 返回首页
            </Link>

            <div className="flex items-center gap-4 mb-8">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: meta.color }}
                aria-hidden="true"
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
                {meta.group}
              </span>
            </div>

            <h1 className="swiss-h1 mb-8 lg:mb-12">
              {meta.label}.<br />
              <span className="italic-accent">每日追踪</span>。
            </h1>

            <div className="grid grid-cols-3 gap-8 lg:gap-16 max-w-2xl">
              <div>
                <div className="text-4xl lg:text-6xl font-bold tracking-tighter tabular-nums">
                  {updates.length}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 mt-2">
                  累计更新
                </div>
              </div>
              <div>
                <div className="text-4xl lg:text-6xl font-bold tracking-tighter tabular-nums">
                  {thisWeekCount}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 mt-2">
                  本周新增
                </div>
              </div>
              <div>
                <div className="text-4xl lg:text-6xl font-bold tracking-tighter tabular-nums font-mono">
                  {latestDate ? latestDate.slice(5) : "—"}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 mt-2">
                  最新日期
                </div>
              </div>
            </div>
          </motion.div>

          <div
            className="absolute -right-20 -top-20 w-[40vw] h-[40vw] rounded-full pointer-events-none blur-[120px] opacity-[0.12]"
            style={{ backgroundColor: meta.color }}
            aria-hidden="true"
          />
        </section>

        {/* Updates by date */}
        <div className="px-6 lg:px-12 py-20 lg:py-32 space-y-16 lg:space-y-24 border-b border-foreground">
          {sortedDates.length === 0 ? (
            <div className="py-40 text-center">
              <div className="text-5xl lg:text-7xl font-bold uppercase tracking-tighter opacity-10 mb-4">
                No Signal.
              </div>
              <p className="text-sm font-mono opacity-40">暂无更新</p>
            </div>
          ) : (
            sortedDates.map((date, dateIdx) => (
              <motion.section
                key={date}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: Math.min(dateIdx, 3) * 0.1 }}
              >
                <div className="flex items-baseline gap-6 mb-8 lg:mb-12 pb-4 border-b border-foreground">
                  <h2 className="text-3xl lg:text-5xl font-bold tracking-tighter tabular-nums">
                    {date}
                  </h2>
                  <div className="h-px flex-1" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
                    {grouped[date].length} 条
                  </span>
                </div>

                <div className="space-y-12 lg:space-y-16">
                  {grouped[date].map((update, idx) => (
                    <motion.article
                      key={update.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: Math.min(idx, 4) * 0.05 }}
                      className="group grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12"
                    >
                      <div className="lg:col-span-3 flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue">
                          {IMPORTANCE_META[update.importance].label}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
                          {CATEGORY_LABELS[update.category] || update.category}
                        </span>
                      </div>

                      <div className="lg:col-span-9">
                        <a
                          href={update.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block focus-visible:outline-none focus-visible:text-brand-blue"
                        >
                          <h3 className="text-2xl lg:text-4xl font-bold tracking-tight leading-[1.05] group-hover:text-brand-blue transition-colors mb-4">
                            {update.title}
                            <ExternalLink
                              className="inline ml-3 opacity-0 group-hover:opacity-100 transition-opacity"
                              size={20}
                              strokeWidth={1.5}
                              aria-hidden="true"
                            />
                          </h3>

                          {update.titleOriginal && update.titleOriginal !== update.title && (
                            <p className="font-serif italic text-base lg:text-lg opacity-40 mb-4">
                              &ldquo;{update.titleOriginal}&rdquo;
                            </p>
                          )}

                          {update.summary && (
                            <p className="text-base lg:text-lg font-light leading-snug opacity-80 line-clamp-3 mb-4">
                              {update.summary}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-4 border-t border-foreground/10">
                            {update.tags.slice(0, 5).map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-30"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </a>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </motion.section>
            ))
          )}
        </div>
      </main>

      <SwissFooter months={months} />
    </div>
  )
}
