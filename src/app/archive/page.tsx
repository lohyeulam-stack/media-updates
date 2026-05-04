import Link from "next/link"
import { getAvailableMonths, getAvailableWeeks } from "@/lib/data"

function groupByYear(items: string[]) {
  const groups: Record<string, string[]> = {}
  for (const item of items) {
    const year = item.slice(0, 4)
    if (!groups[year]) groups[year] = []
    groups[year].push(item)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

export default function ArchivePage() {
  const months = getAvailableMonths()
  const weeks = getAvailableWeeks()

  const monthsByYear = groupByYear(months)
  const weeksByYear = groupByYear(weeks)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <h1 className="text-base font-semibold">Archive</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <section>
          <h2 className="text-lg font-semibold mb-4">Monthly Reports</h2>
          <div className="space-y-6">
            {monthsByYear.map(([year, items]) => (
              <div key={year}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{year}</h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((m) => (
                    <Link key={m} href={`/report/${m}`}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {m}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Weekly Reports</h2>
          <div className="space-y-6">
            {weeksByYear.map(([year, items]) => (
              <div key={year}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{year}</h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((w) => (
                    <Link key={w} href={`/weekly/${w}`}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {w}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
