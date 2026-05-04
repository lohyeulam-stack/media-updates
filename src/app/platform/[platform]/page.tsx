import { notFound } from "next/navigation"
import { getUpdates, getAvailableMonths, getAvailableWeeks } from "@/lib/data"
import { PLATFORM_META, type Platform } from "@/lib/types"
import { PlatformClient } from "./platform-client"

interface Props {
  params: Promise<{ platform: string }>
}

export default async function PlatformPage({ params }: Props) {
  const { platform } = await params
  if (!(platform in PLATFORM_META)) notFound()

  const updates = getUpdates()
  const months = getAvailableMonths()
  const weeks = getAvailableWeeks()

  const filtered = updates.filter((u) => u.platform === platform)

  return (
    <PlatformClient
      platform={platform as Platform}
      updates={filtered}
      allUpdates={updates}
      months={months}
      weeks={weeks}
    />
  )
}

export function generateStaticParams() {
  return Object.keys(PLATFORM_META).map((p) => ({ platform: p }))
}
