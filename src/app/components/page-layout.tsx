"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Rss } from "lucide-react"
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
      router.push(`/?platform=${platform}`)
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
    <header className="sticky top-0 z-30 h-16 border-b border-brand-black dark:border-white/10 bg-background/95 backdrop-blur-md flex items-center">
      <div className="flex items-center justify-between w-full px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="inline-flex items-center justify-center h-7 px-2 bg-brand-black text-white text-xs font-bold tracking-widest rounded-sm group-hover:bg-brand-blue transition-colors">
            [Media]
          </span>
          <span className="text-sm font-bold tracking-tight text-foreground group-hover:text-brand-blue transition-colors">
            Updates
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />
          <Link href="/feed.xml" target="_blank" aria-label="RSS feed" className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Rss className="h-4 w-4" />
          </Link>
          <button
            onClick={onMenuOpen}
            className="inline-flex items-center gap-2 h-8 px-3 bg-brand-black text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-brand-blue transition-colors"
            aria-label="Open navigation menu"
          >
            [Menu]
          </button>
        </div>
      </div>
    </header>
  )
}

export function SwissFooter({ months }: { months?: string[] }) {
  return (
    <footer className="bg-brand-black text-white overflow-hidden">
      <div className="px-6 lg:px-12 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-5xl lg:text-7xl font-bold tracking-[-0.04em] leading-[0.9] uppercase">
              TopTou<br />
              Media<br />
              Updates
            </h2>
          </div>
          <div className="flex flex-col justify-end">
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              广告平台更新追踪系统，覆盖 20+ 全球主流媒体平台。<br />
              TopTou 产品团队出品。
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-medium">
              <Link href="/" className="text-white/50 hover:text-white transition-colors uppercase tracking-wider">Home</Link>
              <Link href="/archive" className="text-white/50 hover:text-white transition-colors uppercase tracking-wider">Archive</Link>
              <Link href="/log" className="text-white/50 hover:text-white transition-colors uppercase tracking-wider">Log</Link>
              {months && months[0] && (
                <Link href={`/report/${months[0]}`} className="text-white/50 hover:text-white transition-colors uppercase tracking-wider">
                  Latest Report
                </Link>
              )}
              <Link href="/feed.xml" target="_blank" className="text-white/50 hover:text-white transition-colors uppercase tracking-wider">RSS</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex items-center justify-between text-[10px] text-white/30 uppercase tracking-wider">
          <span>TopTou Media Updates</span>
          <span>Built for adtech professionals</span>
        </div>
      </div>

      <div className="px-6 lg:px-12 pb-4 overflow-hidden">
        <p
          className="font-bold uppercase tracking-[-0.04em] leading-none text-white/5 select-none pointer-events-none"
          style={{ fontSize: "18vw" }}
          aria-hidden="true"
        >
          MediaUpdates
        </p>
      </div>
    </footer>
  )
}
