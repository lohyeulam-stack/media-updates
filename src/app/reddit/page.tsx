import { getRedditPosts, getAvailableWeeks, getAvailableMonths, getUpdates } from "@/lib/data"
import { type RedditPost } from "@/lib/reddit-types"
import { RedditClient } from "./reddit-client"

export const dynamic = "force-dynamic"
export const revalidate = 3600

export default function RedditPage() {
  const rawPosts = getRedditPosts()
  const posts = rawPosts as RedditPost[]

  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
  const cutoffStr = cutoff.toISOString().split("T")[0]
  const todayStr = now.toISOString().split("T")[0]

  // Server-side: filter to last 30 days
  const recent = posts.filter(p => p.date >= cutoffStr && p.date <= todayStr)

  const allUpdates = getUpdates()
  const months = getAvailableMonths()
  const weeks = getAvailableWeeks()

  return <RedditClient posts={recent} allUpdates={allUpdates} months={months} weeks={weeks} />
}
