import { getUpdates, getAvailableMonths, getAvailableWeeks } from "@/lib/data"
import { HomeClient } from "./components/home-client"

export default function Home() {
  const updates = getUpdates()
  const months = getAvailableMonths()
  const weeks = getAvailableWeeks()

  return <HomeClient updates={updates} months={months} weeks={weeks} />
}
