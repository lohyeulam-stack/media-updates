"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { Sidebar } from "@/app/components/sidebar"
import { SwissHeader, SwissFooter } from "@/app/components/page-layout"
import { TrendChart } from "@/app/components/trend-chart"
import { PLATFORM_META, CATEGORY_LABELS, type Platform, type MediaUpdate } from "@/lib/types"

interface Props {
  platform: Platform
  updates: MediaUpdate[]
  allUpdates: MediaUpdate[]
  months: string[]
  weeks: string[]
}

const IMPORTANCE_META = {
  high: { label: "Priority", className: "bg-brand-blue text-white" },
  medium: { label: "Info", className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
  low: { label: "Active", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
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

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SwissHeader onMenuOpen={() => setSidebarOpen(true)} />
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
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1">
        {/* Platform Hero */}
        <section className="px-6 lg:px-12 pt-24 pb-20 border-b border-brand-black dark:border-white/10 relative overflow-hidden">
          <div className="relative z-10 animate-fade-up">
            <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-brand-blue transition-colors mb-10">
              <ArrowLeft className="h-3 w-3" /> All Platforms
            </Link>
            <div className="flex items-center gap-4 mb-6">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: meta.color }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">{meta.group}</span>
            </div>
            <h1 className="swiss-h1 mb-8">{meta.label}</h1>
            <p className="text-xl lg:text-2xl font-light text-muted-foreground">{updates.length} 条更新</p>
          </div>
          <div
            className="absolute -right-20 -top-20 w-[40vw] h-[40vw] rounded-full pointer-events-none blur-[120px] opacity-[0.12]"
            style={{ backgroundColor: meta.color }}
          />
        </section>

        {/* Trend */}
        <section className="px-6 lg:px-12 py-8 border-b border-brand-black dark:border-white/10">
          <TrendChart updates={updates} />
        </section>

        {/* Updates by date */}
        <div className="px-6 lg:px-12 py-10 space-y-14">
          {sortedDates.map((date) => (
            <section key={date}>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-lg font-bold tracking-tight">{date}</h2>
                <div className="h-px flex-1 bg-brand-black/10 dark:bg-white/10" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{grouped[date].length}</span>
              </div>
              <div className="space-y-0">
                {grouped[date].map((update) => (
                  <article key={update.id} className="group border-t border-brand-black dark:border-white/10 pt-6 pb-8">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className={`text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full ${IMPORTANCE_META[update.importance].className}`}>
                        {IMPORTANCE_META[update.importance].label}
                      </span>
                      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground">
                        {CATEGORY_LABELS[update.category] || update.category}
                      </span>
                      <time className="ml-auto text-[10px] tabular-nums text-muted-foreground">{update.date}</time>
                    </div>
                    <a href={update.sourceUrl} target="_blank" rel="noopener noreferrer"
                      className="block text-2xl lg:text-3xl font-bold leading-snug text-foreground hover:text-brand-blue transition-colors mb-3 group-hover:[&_svg]:opacity-100">
                      {update.title}
                      <ExternalLink className="inline ml-2 h-4 w-4 opacity-0 transition-opacity align-baseline" />
                    </a>
                    {update.titleOriginal && (
                      <p className="italic-accent text-sm text-muted-foreground mb-4">{update.titleOriginal}</p>
                    )}
                    <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3 mb-4">{update.summary}</p>
                    <div className="flex flex-wrap gap-2">
                      {update.tags.slice(0, 5).map((tag) => (
                        <span key={tag} className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">#{tag}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <SwissFooter months={months} />
    </div>
  )
}
