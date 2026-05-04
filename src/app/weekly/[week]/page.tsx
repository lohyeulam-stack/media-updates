import Link from "next/link"
import { getWeeklyData, getAvailableWeeks, getUpdates, getAvailableMonths } from "@/lib/data"
import { notFound } from "next/navigation"
import { PLATFORM_META, CATEGORY_LABELS, GROUP_LABELS, type MediaUpdate, type PlatformCategory } from "@/lib/types"
import { PageLayout } from "@/app/components/page-layout"

export async function generateStaticParams() {
  return getAvailableWeeks().map((week) => ({ week }))
}

function UpdateItem({ u }: { u: MediaUpdate }) {
  const pm = PLATFORM_META[u.platform]
  return (
    <div className="py-4 border-b border-border/60 last:border-0 group">
      <div className="flex items-start gap-3">
        <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: pm?.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground">
              {CATEGORY_LABELS[u.category] || u.category}
            </span>
            <span className="text-[10px] text-muted-foreground tabular-nums">{u.date}</span>
          </div>
          <a
            href={u.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold hover:text-brand-blue transition-colors leading-snug block"
          >
            {u.title}
          </a>
          {u.titleOriginal && u.titleOriginal !== u.title && (
            <p className="italic-accent text-xs text-muted-foreground mt-0.5">{u.titleOriginal}</p>
          )}
          {u.summary && (
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{u.summary}</p>
          )}
          {u.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {u.tags.map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 bg-muted rounded-sm text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default async function WeeklyPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params
  const data = getWeeklyData(week)

  if (data.length === 0) notFound()

  const updates = getUpdates()
  const months = getAvailableMonths()
  const allWeeks = getAvailableWeeks()

  const byGroup: Record<string, Record<string, MediaUpdate[]>> = {}
  for (const u of data) {
    const pm = PLATFORM_META[u.platform]
    const group = pm?.group || "other"
    if (!byGroup[group]) byGroup[group] = {}
    if (!byGroup[group][u.platform]) byGroup[group][u.platform] = []
    byGroup[group][u.platform].push(u)
  }

  const groupOrder: PlatformCategory[] = ["social", "search", "video", "asia", "dsp", "cn-oem"]

  return (
    <PageLayout updates={updates} months={months} weeks={allWeeks}>
      <div className="px-6 lg:px-12 py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <span className="mx-2 text-muted-foreground/30">/</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground">{week}</span>
          <span className="ml-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-brand-black dark:border-white/20 text-muted-foreground">
            {data.length} updates
          </span>
        </div>

        <h1 className="swiss-h2 text-foreground mb-12">{week}</h1>

        <div className="space-y-12 max-w-4xl">
          {groupOrder.map((gKey) => {
            const platforms = byGroup[gKey]
            if (!platforms) return null
            return (
              <section key={gKey}>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    {GROUP_LABELS[gKey]}
                  </h2>
                  <div className="h-px flex-1 bg-brand-black/10 dark:bg-white/10" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {Object.entries(platforms).map(([plat, items]) => {
                    const pm = PLATFORM_META[plat as keyof typeof PLATFORM_META]
                    return (
                      <div
                        key={plat}
                        className="border border-brand-black dark:border-white/10"
                        style={{ borderTopWidth: "3px", borderTopColor: pm?.color }}
                      >
                        <div className="px-5 py-4 border-b border-border/50">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pm?.color }} />
                            <span className="text-sm font-bold">{pm?.label || plat}</span>
                            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-muted text-muted-foreground rounded-sm">
                              {items.length}
                            </span>
                          </div>
                        </div>
                        <div className="px-5">
                          {items.map((u) => <UpdateItem key={u.id} u={u} />)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </PageLayout>
  )
}
