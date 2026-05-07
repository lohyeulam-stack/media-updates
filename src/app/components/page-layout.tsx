"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Rss, Menu } from "lucide-react"
import { Sidebar } from "./sidebar"
import { ThemeToggle } from "./theme-toggle"
import { LocaleToggle } from "./locale"
import type { MediaUpdate, Platform } from "@/lib/types"

interface PageLayoutProps {
  updates: MediaUpdate[]
  months: string[]
  weeks: string[]
  children: React.ReactNode
}

export function PageLayout({ updates, months, weeks, children }: PageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const handlePlatformSelect = (platform: Platform | "all") => {
    setSidebarOpen(false)
    if (platform === "all") {
      router.push("/")
    } else {
      router.push(`/platform/${platform}`)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SwissHeader onMenuOpen={() => setSidebarOpen(true)} />

      <Sidebar
        updates={updates}
        months={months}
        weeks={weeks}
        selectedPlatform="all"
        onSelect={handlePlatformSelect}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1">
        {children}
      </main>

      <SwissFooter months={months} />
    </div>
  )
}

export function SwissHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border/50 dark:border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-6 lg:px-12">
        {/* Logo - largest, most prominent */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          <span className="inline-flex items-center justify-center h-8 px-2.5 bg-brand-black dark:bg-white text-white dark:text-black text-xs font-bold tracking-[0.15em] rounded transition-all group-hover:bg-brand-blue dark:group-hover:bg-blue-500 group-hover:scale-105">
            MEDIA
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground group-hover:text-brand-blue dark:group-hover:text-blue-400 transition-colors">
            Updates
          </span>
        </Link>

        {/* Actions - smaller, right-aligned */}
        <div className="flex items-center gap-1.5">
          <LocaleToggle />
          <ThemeToggle />
          <Link
            href="/feed.xml"
            target="_blank"
            aria-label="RSS 订阅"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Rss className="h-4 w-4" />
          </Link>
          <button
            onClick={onMenuOpen}
            className="inline-flex items-center gap-2 h-9 px-4 ml-2 bg-brand-black dark:bg-white text-white dark:text-black text-[11px] font-bold uppercase tracking-[0.12em] rounded-full hover:bg-brand-blue dark:hover:bg-blue-500 transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="打开导航菜单"
          >
            <Menu className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">菜单</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export function SwissFooter({ months }: { months?: string[] }) {
  const recentMonths = months?.slice(0, 6) || []
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-brand-black dark:bg-black text-white border-t border-white/10">
      <div className="px-6 lg:px-12 pt-20 pb-12">
        {/* Hero text - largest */}
        <div className="mb-16">
          <h2 className="text-5xl lg:text-7xl font-bold tracking-[-0.02em] leading-[0.95] mb-6">
            TopTou<br />
            Media<br />
            Updates
          </h2>
          <p className="text-base text-white/60 max-w-md leading-relaxed">
            实时追踪 20+ 广告平台的产品更新、API 变更和政策调整
          </p>
        </div>

        {/* Links grid - medium size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 mb-16 pb-16 border-b border-white/10">
          {/* Recent months */}
          {recentMonths.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-4">
                月度报告
              </h3>
              <ul className="space-y-2">
                {recentMonths.map((month) => (
                  <li key={month}>
                    <Link
                      href={`/report/${month}`}
                      className="text-sm text-white/80 hover:text-white transition-colors inline-flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
                    >
                      <span className="w-1 h-1 rounded-full bg-brand-blue group-hover:scale-150 transition-transform" aria-hidden="true" />
                      {month}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-4">
              快速链接
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/archive"
                  className="text-sm text-white/80 hover:text-white transition-colors inline-flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
                >
                  <span className="w-1 h-1 rounded-full bg-brand-blue group-hover:scale-150 transition-transform" aria-hidden="true" />
                  归档
                </Link>
              </li>
              <li>
                <Link
                  href="/log"
                  className="text-sm text-white/80 hover:text-white transition-colors inline-flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
                >
                  <span className="w-1 h-1 rounded-full bg-brand-blue group-hover:scale-150 transition-transform" aria-hidden="true" />
                  更新日志
                </Link>
              </li>
              <li>
                <Link
                  href="/feed.xml"
                  target="_blank"
                  className="text-sm text-white/80 hover:text-white transition-colors inline-flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
                >
                  <span className="w-1 h-1 rounded-full bg-brand-blue group-hover:scale-150 transition-transform" aria-hidden="true" />
                  RSS 订阅
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-4">
              关于
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              由 TopTou 产品团队维护<br />
              每周自动更新
            </p>
          </div>
        </div>

        {/* Copyright - smallest */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-white/40">
          <p>© {currentYear} TopTou. All rights reserved.</p>
          <p className="font-mono">Built with Next.js · Tailwind CSS</p>
        </div>
      </div>
    </footer>
  )
}
