import Link from "next/link"
import { getMonthlyReport, getAvailableMonths, getUpdates, getAvailableWeeks } from "@/lib/data"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { PageLayout } from "@/app/components/page-layout"

export async function generateStaticParams() {
  return getAvailableMonths().map((month) => ({ month }))
}

export default async function MonthlyReportPage({
  params,
}: {
  params: Promise<{ month: string }>
}) {
  const { month } = await params
  const report = getMonthlyReport(month)

  if (!report) {
    notFound()
  }

  const updates = getUpdates()
  const months = getAvailableMonths()
  const weeks = getAvailableWeeks()

  return (
    <PageLayout updates={updates} months={months} weeks={weeks}>
      <div className="bg-gradient-to-b from-slate-50 to-white">
        <header className="border-b sticky top-0 bg-white/90 backdrop-blur-lg z-40 lg:hidden">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <h1 className="text-base font-semibold">{month} Monthly Report</h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <article className="
            [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:tracking-tight [&>h1]:mb-6 [&>h1]:pb-4 [&>h1]:border-b
            [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:pb-2 [&>h2]:border-b [&>h2]:border-dashed
            [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-2
            [&>p]:text-[15px] [&>p]:leading-7 [&>p]:text-foreground/80 [&>p]:mb-4
            [&>hr]:my-8 [&>hr]:border-border
            [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-blue-300
            [&_a:hover]:text-blue-800 [&_a:hover]:decoration-blue-600
            [&_strong]:text-foreground [&_strong]:font-semibold
            [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-1.5 [&>ul]:mb-4 [&_li]:text-[15px] [&_li]:leading-7 [&_li]:text-foreground/80
            [&>blockquote]:border-l-4 [&>blockquote]:border-blue-300 [&>blockquote]:bg-blue-50/50 [&>blockquote]:px-4 [&>blockquote]:py-3 [&>blockquote]:my-4 [&>blockquote]:rounded-r-lg
            [&>table]:w-full [&>table]:text-sm [&_th]:text-left [&_th]:px-3 [&_th]:py-2 [&_th]:bg-muted [&_td]:px-3 [&_td]:py-2 [&_td]:border-t
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {report}
            </ReactMarkdown>
          </article>
        </main>

        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          TopTou Media Updates Tracker
        </footer>
      </div>
    </PageLayout>
  )
}
