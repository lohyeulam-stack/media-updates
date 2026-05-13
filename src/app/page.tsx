import { getUpdates, getAvailableMonths, getAvailableWeeks } from "@/lib/data"
import { HomeClient } from "./components/home-client"

export default function Home() {
  const allUpdates = getUpdates()
  const months = getAvailableMonths()
  const weeks = getAvailableWeeks()

  // Only show articles from the last 2 weeks on homepage
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0]

  const recentUpdates = allUpdates.filter(update => update.date >= twoWeeksAgoStr)

  return <HomeClient updates={recentUpdates} months={months} weeks={weeks} />
}
