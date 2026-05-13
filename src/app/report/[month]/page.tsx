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
      <div className="px-6 lg:px-12 py-16 mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <span className="mx-2 text-muted-foreground/30">/</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground">{month}</span>
        </div>

        <article className="markdown-body mx-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {report}
          </ReactMarkdown>
        </article>
      </div>
    </PageLayout>
  )
}
