import Link from "next/link"
import { getWeeklyData, getAvailableWeeks, getUpdates, getAvailableMonths } from "@/lib/data"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PLATFORM_META, CATEGORY_LABELS, GROUP_LABELS, type MediaUpdate, type PlatformCategory } from "@/lib/types"
import { PageLayout } from "@/app/components/page-layout"

export async function generateStaticParams() {
  return getAvailableWeeks().map((week) => ({ week }))
}

function UpdateItem({ u }: { u: MediaUpdate }) {
  const pm = PLATFORM_META[u.platform]
  return (
    <div className="py-3 border-b last:border-0 group">
      <div className="flex items-start gap-3">
        <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: pm?.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <Badge variant="outline" className="text-[10px] font-normal">
              {CATEGORY_LABELS[u.category] || u.category}
            </Badge>
            <span className="text-[11px] text-muted-foreground">{u.date}</span>
          </div>
          <a href={u.sourceUrl} target="_blank" rel="noopener noreferrer"
             className="text-sm font-medium hover:text-blue-600 transition-colors leading-snug block">
            {u.title}
          </a>
          {u.summary && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-3">{u.summary}</p>
          )}
          {u.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {u.tags.map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{t}</span>
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
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-40 lg:hidden">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <h1 className="text-base font-semibold">{week}</h1>
            <Badge variant="secondary">{data.length} updates</Badge>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
          {groupOrder.map((gKey) => {
            const platforms = byGroup[gKey]
            if (!platforms) return null
            return (
              <section key={gKey}>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  {GROUP_LABELS[gKey]}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(platforms).map(([plat, items]) => {
                    const pm = PLATFORM_META[plat as keyof typeof PLATFORM_META]
                    return (
                      <Card key={plat} className="border-t-2" style={{ borderTopColor: pm?.color }}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pm?.color }} />
                            <span className="text-sm font-semibold">{pm?.label || plat}</span>
                            <Badge variant="secondary" className="text-xs ml-auto">{items.length}</Badge>
                          </div>
                          {items.map((u) => <UpdateItem key={u.id} u={u} />)}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </main>

        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          TopTou Media Updates Tracker
        </footer>
      </div>
    </PageLayout>
  )
}
