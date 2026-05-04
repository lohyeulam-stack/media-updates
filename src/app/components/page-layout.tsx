"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu } from "lucide-react"
import { Sidebar } from "./sidebar"
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
    <div className="flex min-h-screen">
      {/* 桌面端侧边栏 */}
      <div className="hidden lg:block">
        <Sidebar updates={updates} months={months} weeks={weeks} selectedPlatform="all" onSelect={handlePlatformSelect} />
      </div>

      {/* 移动端抽屉 */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 z-50 h-full w-56 lg:hidden">
            <Sidebar updates={updates} months={months} weeks={weeks} selectedPlatform="all" onSelect={handlePlatformSelect} />
          </div>
        </>
      )}

      <div className="min-w-0 flex-1">
        {/* 移动端 header */}
        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <Link href="/" className="text-base font-semibold">Media Updates</Link>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}
