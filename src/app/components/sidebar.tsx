"use client"

import { useState } from "react"
import Link from "next/link"
import { PLATFORM_META, GROUP_LABELS, type Platform, type PlatformCategory } from "@/lib/types"

interface SidebarProps {
  updates: { platform: string }[]
  months: string[]
  weeks: string[]
  selectedPlatform: Platform | "all"
  onSelect: (p: Platform | "all") => void
}

const GROUP_ORDER: PlatformCategory[] = ["social", "search", "video", "asia", "dsp", "cn-oem"]

export function Sidebar({ updates, months, weeks, selectedPlatform, onSelect }: SidebarProps) {
  const counts: Record<string, number> = { all: updates.length }
  for (const u of updates) counts[u.platform] = (counts[u.platform] || 0) + 1

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))

  const groups = GROUP_ORDER.map((g) => ({
    key: g,
    label: GROUP_LABELS[g],
    platforms: Object.entries(PLATFORM_META)
      .filter(([, m]) => m.group === g)
      .filter(([k]) => (counts[k] || 0) > 0)
      .map(([k, m]) => ({ key: k as Platform, ...m })),
  })).filter((g) => g.platforms.length > 0)

  return (
    <aside className="w-56 shrink-0 border-r bg-muted/20 flex flex-col sticky top-0 h-screen">
      <div className="px-4 py-3 border-b">
        <h1 className="text-base font-bold tracking-tight">Media Updates</h1>
        <p className="text-[10px] text-muted-foreground">TopTou Product Team</p>
      </div>

      {/* 快捷入口 */}
      <div className="px-3 py-2 border-b space-y-1">
        {months.length > 0 && (
          <Link href={`/report/${months[0]}`}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-medium text-foreground/70 hover:bg-muted hover:text-foreground transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            最新月报 · {months[0]}
          </Link>
        )}
        {weeks.length > 0 && (
          <Link href={`/weekly/${weeks[0]}`}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-medium text-foreground/70 hover:bg-muted hover:text-foreground transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            最新周报 · {weeks[0]}
          </Link>
        )}
        <Link href="/archive"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
          归档
        </Link>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto text-[13px]">
        <button onClick={() => onSelect("all")}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
            selectedPlatform === "all" ? "bg-foreground text-background" : "hover:bg-muted text-foreground"
          }`}>
          All
          <span className="text-[11px] opacity-60">{counts.all}</span>
        </button>

        {groups.map((g) => (
          <div key={g.key}>
            <button onClick={() => toggle(g.key)}
              className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground/60">
              {g.label}
              <svg className={`w-3 h-3 transition-transform ${collapsed[g.key] ? "" : "rotate-90"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            {!collapsed[g.key] && g.platforms.map((p) => (
              <button key={p.key} onClick={() => onSelect(p.key)}
                className={`w-full flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedPlatform === p.key ? "bg-foreground text-background" : "hover:bg-muted text-foreground/75"
                }`}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="truncate">{p.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
