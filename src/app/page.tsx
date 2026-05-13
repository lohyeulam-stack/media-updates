import { getUpdates, getAvailableMonths, getAvailableWeeks } from "@/lib/data"
import { HomeClient } from "./components/home-client"

export default function Home() {
  const allUpdates = getUpdates()
  const months = getAvailableMonths()
  const weeks = getAvailableWeeks()

  // Only show articles from the last 30 days on homepage, sorted newest to oldest
  const oneMonthAgo = new Date()
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)
  const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0]

  const recentUpdates = allUpdates
    .filter(update => update.date >= oneMonthAgoStr)
    .sort((a, b) => b.date.localeCompare(a.date)) // Sort newest to oldest

  return <HomeClient updates={recentUpdates} months={months} weeks={weeks} />
}
