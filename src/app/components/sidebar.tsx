"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { X, ChevronRight } from "lucide-react"
import { PLATFORM_META, type MediaUpdate, type Platform } from "@/lib/types"

interface SidebarProps {
  updates: MediaUpdate[]
  months: string[]
  weeks: string[]
  selectedPlatform: Platform | "all"
  onSelect: (platform: Platform | "all") => void
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({
  updates,
  months,
  weeks,
  selectedPlatform,
  onSelect,
  isOpen,
  onClose,
}: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      closeButtonRef.current?.focus()
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  // Trap focus within sidebar
  useEffect(() => {
    if (!isOpen || !sidebarRef.current) return

    const sidebar = sidebarRef.current
    const focusableElements = sidebar.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    sidebar.addEventListener("keydown", handleTab)
    return () => sidebar.removeEventListener("keydown", handleTab)
  }, [isOpen])

  const platformCounts = updates.reduce(
    (acc, u) => {
      acc[u.platform] = (acc[u.platform] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const platforms = Object.keys(PLATFORM_META) as Platform[]
  const recentMonths = months.slice(0, 6)
  const recentWeeks = weeks.slice(0, 8)

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label="导航菜单"
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-background dark:bg-black border-l border-border/50 dark:border-white/10 z-50 overflow-y-auto transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 border-b border-border/50 dark:border-white/10 bg-background/95 dark:bg-black/95 backdrop-blur-xl">
          <h2 className="text-lg font-bold tracking-tight">导航</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="关闭导航菜单"
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Platforms Section - Most prominent */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-4 px-3">
              平台筛选
            </h3>
            <nav aria-label="平台列表">
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => onSelect("all")}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      selectedPlatform === "all"
                        ? "bg-brand-black dark:bg-white text-white dark:text-black"
                        : "text-foreground/80 hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>全部平台</span>
                      <span className="text-xs font-bold tabular-nums opacity-60">
                        {updates.length}
                      </span>
                    </div>
                  </button>
                </li>
                {platforms.map((platform) => {
                  const pm = PLATFORM_META[platform]
                  const count = platformCounts[platform] || 0
                  if (count === 0) return null

                  return (
                    <li key={platform}>
                      <button
                        onClick={() => onSelect(platform)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group ${
                          selectedPlatform === platform
                            ? "bg-brand-black dark:bg-white text-white dark:text-black"
                            : "text-foreground/80 hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: pm.color }}
                              aria-hidden="true"
                            />
                            <span className="truncate">{pm.label}</span>
                          </div>
                          <span className="text-xs font-bold tabular-nums opacity-60 shrink-0">
                            {count}
                          </span>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </section>

          {/* Monthly Reports - Medium prominence */}
          {recentMonths.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-4 px-3">
                月度报告
              </h3>
              <nav aria-label="月度报告列表">
                <ul className="space-y-1">
                  {recentMonths.map((month) => (
                    <li key={month}>
                      <Link
                        href={`/report/${month}`}
                        onClick={onClose}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-foreground/70 hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
                      >
                        <span>{month}</span>
                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </section>
          )}

          {/* Weekly Reports - Lower prominence */}
          {recentWeeks.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-4 px-3">
                周报
              </h3>
              <nav aria-label="周报列表">
                <ul className="space-y-1">
                  {recentWeeks.map((week) => (
                    <li key={week}>
                      <Link
                        href={`/weekly/${week}`}
                        onClick={onClose}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-foreground/70 hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
                      >
                        <span className="font-mono text-xs">{week}</span>
                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </section>
          )}

          {/* Quick Links - Smallest */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-4 px-3">
              快速链接
            </h3>
            <nav aria-label="快速链接">
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/archive"
                    onClick={onClose}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-foreground/70 hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
                  >
                    <span>归档</span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/log"
                    onClick={onClose}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-foreground/70 hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
                  >
                    <span>更新日志</span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  </Link>
                </li>
              </ul>
            </nav>
          </section>
        </div>
      </aside>
    </>
  )
}
