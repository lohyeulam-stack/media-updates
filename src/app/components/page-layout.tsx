"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
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
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-brand-blue selection:text-white transition-colors duration-700">
      <SwissHeader onMenuOpen={() => setSidebarOpen(true)} />

      {/* Drawer Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-foreground/20 dark:bg-background/60 backdrop-blur-sm z-[60]"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              role="dialog"
              aria-modal="true"
              aria-label="导航菜单"
              className="fixed inset-y-0 right-0 w-full lg:w-[440px] bg-background z-[70] border-l border-foreground p-8 lg:p-12 overflow-y-auto"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-8 right-8 lg:top-12 lg:right-12 text-foreground hover:text-brand-blue transition-colors"
                aria-label="关闭菜单"
              >
                <X size={32} strokeWidth={1.5} />
              </button>
              <Sidebar
                updates={updates}
                months={months}
                weeks={weeks}
                selectedPlatform="all"
                onSelect={handlePlatformSelect}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

export function SwissHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <header className="h-20 lg:h-24 sticky top-0 z-50 bg-background border-b border-foreground flex items-center justify-between px-6 lg:px-12">
      <Link
        href="/"
        className="text-xl lg:text-2xl font-bold tracking-tighter uppercase flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
      >
        <span className="bg-foreground text-background px-2 py-0.5 group-hover:bg-brand-blue group-hover:text-white transition-colors">
          Media
        </span>
        <span className="group-hover:text-brand-blue transition-colors">Updates</span>
      </Link>

      <div className="flex items-center gap-6 lg:gap-12 text-[10px] font-bold uppercase tracking-[0.3em]">
        <div className="hidden sm:block">
          <LocaleToggle />
        </div>
        <ThemeToggle />
        <button
          onClick={onMenuOpen}
          className="flex items-center gap-2 bg-foreground text-background px-4 lg:px-6 py-2 rounded-full hover:bg-brand-blue hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          aria-label="打开导航菜单"
        >
          <Menu size={14} strokeWidth={2} />
          <span className="hidden sm:inline">Menu</span>
        </button>
      </div>
    </header>
  )
}

export function SwissFooter({ months }: { months?: string[] }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-brand-blue text-white px-6 lg:px-12 pt-24 lg:pt-32 pb-12">
      {/* Hero Statement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 mb-24 lg:mb-40">
        <h2 className="text-5xl lg:text-7xl xl:text-8xl font-bold tracking-[-0.04em] leading-[0.95]">
          Track every<br />
          <span className="font-serif italic font-medium">shift</span> in the<br />
          Ad world.
        </h2>
        <div className="flex flex-col justify-between gap-12">
          <p className="text-lg lg:text-2xl font-light opacity-80 max-w-md leading-relaxed">
            Media Updates 是一套自动化情报系统，每日同步 20+ 广告平台的产品、API、政策变更，为 TopTou 产品团队提供决策依据。
          </p>
          <div className="grid grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold">Sync Cadence</div>
              <div className="text-sm font-bold">Beijing 00:00<br />Daily Auto-Sync</div>
            </div>
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold">Sources</div>
              <div className="text-sm font-bold">32 Official Feeds<br />MiniMax AI Curated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Links Grid */}
      {months && months.length > 0 && (
        <div className="border-t border-white/10 pt-16 pb-16 grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold mb-4">Monthly</div>
            <ul className="space-y-2">
              {months.slice(0, 6).map((m) => (
                <li key={m}>
                  <Link
                    href={`/report/${m}`}
                    className="text-sm font-medium opacity-80 hover:opacity-100 hover:italic transition-all"
                  >
                    {m}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold mb-4">Navigate</div>
            <ul className="space-y-2">
              <li>
                <Link href="/archive" className="text-sm font-medium opacity-80 hover:opacity-100 hover:italic transition-all">
                  Archive
                </Link>
              </li>
              <li>
                <Link href="/log" className="text-sm font-medium opacity-80 hover:opacity-100 hover:italic transition-all">
                  Changelog
                </Link>
              </li>
              <li>
                <Link href="/feed.xml" target="_blank" className="text-sm font-medium opacity-80 hover:opacity-100 hover:italic transition-all">
                  RSS Feed
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold mb-4">Coverage</div>
            <p className="text-sm font-medium opacity-80">
              TikTok · Meta · Google<br />
              LinkedIn · X · Snapchat<br />
              Pinterest · YouTube<br />
              & 12+ more
            </p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold mb-4">Built By</div>
            <p className="text-sm font-medium opacity-80">
              TopTou Product Team<br />
              <span className="opacity-60">Open Source on GitHub</span>
            </p>
          </div>
        </div>
      )}

      {/* Mega Brand Mark */}
      <div className="border-t border-white/10 pt-16">
        <h1 className="text-[16vw] lg:text-[14vw] font-bold tracking-[-0.06em] leading-none mb-12">
          Updates
        </h1>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 text-[10px] uppercase font-bold tracking-[0.3em] opacity-40">
          <div>© {currentYear} / TopTou Product Team</div>
          <div className="font-mono">End of Transmission</div>
        </div>
      </div>
    </footer>
  )
}
