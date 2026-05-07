"use client"

import Link from "next/link"
import { PLATFORM_META, GROUP_LABELS, type Platform, type PlatformCategory, type MediaUpdate } from "@/lib/types"

interface SidebarProps {
  updates: MediaUpdate[]
  months: string[]
  weeks: string[]
  selectedPlatform: Platform | "all"
  onSelect: (p: Platform | "all") => void
  onClose: () => void
}

const GROUP_ORDER: PlatformCategory[] = ["social", "search", "video", "asia", "dsp", "cn-oem"]

export function Sidebar({ updates, months, weeks, onSelect, onClose }: SidebarProps) {
  const counts: Record<string, number> = { all: updates.length }
  for (const u of updates) counts[u.platform] = (counts[u.platform] || 0) + 1

  const groups = GROUP_ORDER.map((g) => ({
    key: g,
    label: GROUP_LABELS[g],
    platforms: Object.entries(PLATFORM_META)
      .filter(([, m]) => m.group === g)
      .filter(([k]) => (counts[k] || 0) > 0)
      .map(([k, m]) => ({ key: k as Platform, ...m, count: counts[k] || 0 })),
  })).filter((g) => g.platforms.length > 0)

  const recentMonths = months.slice(0, 4)
  const recentWeeks = weeks.slice(0, 4)

  return (
    <div className="h-full flex flex-col justify-between pt-4 pb-8">
      <div>
        <div className="text-[10px] uppercase tracking-[0.4em] font-bold mb-12 opacity-30">
          Navigation / 导航
        </div>

        <nav className="space-y-12">
          {/* All platforms button */}
          <section>
            <h3 className="text-xs uppercase font-bold tracking-[0.3em] text-brand-blue mb-6">
              平台索引 · {updates.length} 条
            </h3>
            <button
              onClick={() => onSelect("all")}
              className="group flex items-baseline justify-between w-full text-left mb-8 pb-3 border-b border-foreground/10 hover:border-brand-blue transition-colors focus-visible:outline-none focus-visible:text-brand-blue"
            >
              <span className="text-3xl lg:text-4xl font-bold tracking-tighter group-hover:italic group-hover:text-brand-blue transition-all">
                全部平台
              </span>
              <span className="text-xs font-mono opacity-40 tabular-nums">
                {counts.all}
              </span>
            </button>

            <div className="space-y-6">
              {groups.map((g) => (
                <div key={g.key}>
                  <h4 className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 mb-3">
                    {g.label}
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {g.platforms.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => onSelect(p.key)}
                        className="flex items-center justify-between text-sm font-bold uppercase tracking-tight text-left hover:text-brand-blue transition-colors focus-visible:outline-none focus-visible:text-brand-blue py-1"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: p.color }}
                            aria-hidden="true"
                          />
                          <span className="truncate">{p.label}</span>
                        </span>
                        <span className="text-[10px] font-mono opacity-30 tabular-nums shrink-0 ml-2">
                          {p.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Monthly reports */}
          {recentMonths.length > 0 && (
            <section>
              <h3 className="text-xs uppercase font-bold tracking-[0.3em] text-brand-blue mb-6">
                月度情报
              </h3>
              <div className="space-y-3">
                {recentMonths.map((m) => (
                  <Link
                    key={m}
                    href={`/report/${m}`}
                    onClick={onClose}
                    className="block text-2xl lg:text-3xl font-bold tracking-tighter hover:italic hover:text-brand-blue transition-all focus-visible:outline-none focus-visible:text-brand-blue"
                  >
                    Report / {m}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Weekly reports */}
          {recentWeeks.length > 0 && (
            <section>
              <h3 className="text-xs uppercase font-bold tracking-[0.3em] text-brand-blue mb-6">
                周报存档
              </h3>
              <div className="space-y-3">
                {recentWeeks.map((w) => (
                  <Link
                    key={w}
                    href={`/weekly/${w}`}
                    onClick={onClose}
                    className="block text-lg font-mono hover:text-brand-blue hover:italic transition-all focus-visible:outline-none focus-visible:text-brand-blue"
                  >
                    {w}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Quick links */}
          <section>
            <h3 className="text-xs uppercase font-bold tracking-[0.3em] text-brand-blue mb-6">
              其他
            </h3>
            <div className="space-y-3">
              <Link
                href="/archive"
                onClick={onClose}
                className="block text-lg font-medium hover:text-brand-blue hover:italic transition-all focus-visible:outline-none focus-visible:text-brand-blue"
              >
                历史归档
              </Link>
              <Link
                href="/log"
                onClick={onClose}
                className="block text-lg font-medium hover:text-brand-blue hover:italic transition-all focus-visible:outline-none focus-visible:text-brand-blue"
              >
                更新日志
              </Link>
            </div>
          </section>
        </nav>
      </div>

      <div className="pt-12 border-t border-foreground/10">
        <div className="flex gap-6 text-[10px] font-bold uppercase tracking-[0.3em] opacity-30">
          <span>TopTou</span>
          <span>Product</span>
          <span>2026</span>
        </div>
      </div>
    </div>
  )
}
