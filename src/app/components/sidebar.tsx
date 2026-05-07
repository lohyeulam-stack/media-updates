"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { PLATFORM_META, GROUP_LABELS, type Platform, type PlatformCategory } from "@/lib/types"

interface SidebarProps {
  updates: { platform: string }[]
  months: string[]
  weeks: string[]
  selectedPlatform: Platform | "all"
  onSelect: (p: Platform | "all") => void
  isOpen: boolean
  onClose: () => void
}

const GROUP_ORDER: PlatformCategory[] = ["social", "search", "video", "asia", "dsp", "cn-oem"]

export function Sidebar({ updates, months, weeks, selectedPlatform, onSelect, isOpen, onClose }: SidebarProps) {
  const counts: Record<string, number> = { all: updates.length }
  for (const u of updates) counts[u.platform] = (counts[u.platform] || 0) + 1

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggle = (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))

  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Handle Escape to close, body scroll lock, and focus management
  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener("keydown", handleEscape)

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 100)

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = originalOverflow
      window.clearTimeout(focusTimer)
      previousFocusRef.current?.focus()
    }
  }, [isOpen, onClose])

  const groups = GROUP_ORDER.map((g) => ({
    key: g,
    label: GROUP_LABELS[g],
    platforms: Object.entries(PLATFORM_META)
      .filter(([, m]) => m.group === g)
      .filter(([k]) => (counts[k] || 0) > 0)
      .map(([k, m]) => ({ key: k as Platform, ...m })),
  })).filter((g) => g.platforms.length > 0)

  const recentMonths = months.slice(0, 3)
  const recentWeeks = weeks.slice(0, 3)

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[400px] bg-background border-l border-brand-black dark:border-white/10 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-black dark:border-white/10">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-foreground">Navigation</span>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-foreground/20 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Platform</p>
            <button
              onClick={() => { onSelect("all"); onClose(); }}
              aria-current={selectedPlatform === "all" ? "page" : undefined}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                selectedPlatform === "all"
                  ? "bg-brand-black text-white dark:bg-white dark:text-black"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              All Platforms
              <span className="float-right text-xs opacity-50">{counts.all}</span>
            </button>

            {groups.map((g) => (
              <div key={g.key} className="mb-4">
                <button
                  onClick={() => toggle(g.key)}
                  aria-expanded={!collapsed[g.key]}
                  aria-controls={`sidebar-group-${g.key}`}
                  className="w-full flex items-center justify-between py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em] hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                >
                  {g.label}
                  <svg
                    className={`w-3 h-3 transition-transform ${collapsed[g.key] ? "" : "rotate-90"}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {!collapsed[g.key] && (
                  <div id={`sidebar-group-${g.key}`}>
                    {g.platforms.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => { onSelect(p.key); onClose(); }}
                        aria-current={selectedPlatform === p.key ? "page" : undefined}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          selectedPlatform === p.key
                            ? "bg-brand-black text-white dark:bg-white dark:text-black"
                            : "hover:bg-muted text-foreground/75"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} aria-hidden="true" />
                        <span className="truncate flex-1 text-left">{p.label}</span>
                        <span className="text-xs opacity-50">{counts[p.key] || 0}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {recentMonths.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Monthly Reports</p>
              <div className="space-y-1">
                {recentMonths.map((m) => (
                  <Link
                    key={m}
                    href={`/report/${m}`}
                    onClick={onClose}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground/75 hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" aria-hidden="true" />
                    {m}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {recentWeeks.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Weekly Reports</p>
              <div className="space-y-1">
                {recentWeeks.map((w) => (
                  <Link
                    key={w}
                    href={`/weekly/${w}`}
                    onClick={onClose}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground/75 hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    {w}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">More</p>
            <Link
              href="/archive"
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground/75 hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
              Archive
            </Link>
            <Link
              href="/log"
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground/75 hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
              Changelog
            </Link>
          </div>
        </nav>
      </aside>
    </>
  )
}
