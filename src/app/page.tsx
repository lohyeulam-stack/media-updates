import { getUpdates, getAvailableMonths, getAvailableWeeks } from "@/lib/data"
import { HomeClient } from "./components/home-client"

// Force dynamic rendering to ensure date cutoff is always current
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export default function Home() {
  const allUpdates = getUpdates()
  const months = getAvailableMonths()
  const weeks = getAvailableWeeks()

  // Only show articles from the last 30 days on homepage, sorted newest to oldest
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
  const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0]

  const recentUpdates = allUpdates
    .filter(update => update.date >= oneMonthAgoStr && update.date <= todayStr)
    .sort((a, b) => b.date.localeCompare(a.date)) // Sort newest to oldest

  return <HomeClient updates={recentUpdates} months={months} weeks={weeks} />
}
