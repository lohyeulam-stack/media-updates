"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

interface ChangelogEntry {
  date: string
  version: string
  changes: { type: "feat" | "fix" | "refactor" | "docs"; text: string }[]
}

const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-04-29",
    version: "v3.7",
    changes: [
      { type: "feat", text: "移动端侧边栏改为抽屉式汉堡菜单，桌面端保持常驻侧边栏" },
      { type: "fix", text: "修复移动端 header 重复 JSX 导致的构建错误" },
    ],
  },
  {
    date: "2026-04-28",
    version: "v3.6",
    changes: [
      { type: "feat", text: "指标卡片改版：无边框设计，外层容器 + gap-px 分隔线" },
      { type: "feat", text: "新增表格视图：平台、标题、分类、重要性、日期五列展示" },
      { type: "feat", text: "卡片/表格视图切换按钮，支持 aria-label 和 aria-pressed" },
      { type: "fix", text: "平台色点暗色模式下不可见问题（ring-1 ring-border）" },
      { type: "fix", text: "移动端表格隐藏列不再占用空间（响应式 grid 模板）" },
    ],
  },
  {
    date: "2026-04-28",
    version: "v3.5",
    changes: [
      { type: "fix", text: "修复暗色模式下首页硬编码颜色导致的显示异常" },
      { type: "fix", text: "MetricCard / UpdateDashboardCard / 搜索筛选栏全面适配 dark mode" },
      { type: "fix", text: "重要性标签（Priority/Info/Active）暗色模式配色修复" },
      { type: "refactor", text: "首页所有 slate-* 硬编码颜色替换为 Tailwind 语义色（foreground/background/card/muted/border/accent）" },
    ],
  },
  {
    date: "2026-04-28",
    version: "v3.4",
    changes: [
      { type: "feat", text: "全新商业级 Splash Screen 设计，超大 Media Updates 文字主视觉" },
      { type: "feat", text: "渐变文字效果（白色→青色→绿色）+ 文字阴影光晕" },
      { type: "feat", text: "移除 MU 缩写和球体图形，采用全文字品牌展示" },
      { type: "feat", text: "新增 logo-glow 脉冲动画，增强视觉吸引力" },
      { type: "fix", text: "修复窄屏文字截断问题（响应式字号 32px-160px）" },
      { type: "fix", text: "修复 Canvas 粒子场 DPR 缩放累积 bug" },
    ],
  },
  {
    date: "2026-04-27",
    version: "v3.3",
    changes: [
      { type: "refactor", text: "首页数据加载移至服务端组件，减小客户端 bundle 体积" },
      { type: "feat", text: "首页新增统计 Hero 区域（平台数、更新总数、本周新增、月报数）" },
      { type: "feat", text: "卡片入场动画（stagger fade-up），支持 prefers-reduced-motion" },
      { type: "feat", text: "卡片 hover 效果增强（shadow-xl + translate-y）" },
    ],
  },
  {
    date: "2026-04-26",
    version: "v3.2",
    changes: [
      { type: "feat", text: "新增 LinkedIn Marketing Blog 信息源" },
      { type: "feat", text: "新增 Pinterest Newsroom 信息源" },
      { type: "feat", text: "新增 Spotify Ads 信息源" },
      { type: "fix", text: "TikTok Blog JS 动态链接提取修复" },
      { type: "fix", text: "TikTok Case Studies 详情页抓取优化" },
      { type: "fix", text: "TikTok API Changelog iframe 提取优化（5s 加载）" },
    ],
  },
  {
    date: "2026-04-20",
    version: "v3.1",
    changes: [
      { type: "feat", text: "全新首页设计，支持暗色模式" },
      { type: "feat", text: "趋势图表组件（平台分布 + 月度趋势）" },
      { type: "feat", text: "RSS 订阅支持" },
      { type: "feat", text: "国际化支持（中文/英文）" },
      { type: "feat", text: "月报内嵌超链接" },
      { type: "feat", text: "侧边栏周报月报折叠菜单" },
    ],
  },
  {
    date: "2026-04-19",
    version: "v3.0",
    changes: [
      { type: "feat", text: "全新架构：Next.js 15 + TypeScript + Tailwind CSS v4" },
      { type: "feat", text: "6 大类 28 个信息源覆盖" },
      { type: "feat", text: "Playwright JS 页面渲染 + iframe 支持" },
      { type: "feat", text: "MiniMax AI 中文摘要提取" },
      { type: "feat", text: "GitHub Actions 定时采集自动化" },
      { type: "feat", text: "周报卡片式展示 + 月报 Markdown 文章" },
      { type: "feat", text: "移动端响应式适配" },
    ],
  },
]

const TYPE_LABELS: Record<string, string> = {
  feat: "新功能",
  fix: "修复",
  refactor: "重构",
  docs: "文档",
}

const TYPE_COLORS: Record<string, string> = {
  feat: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  fix: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  refactor: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  docs: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

export default function LogPage() {
  const [filter, setFilter] = useState<"all" | "feat" | "fix">("all")

  const filtered = filter === "all"
    ? CHANGELOG
    : CHANGELOG.map(entry => ({
        ...entry,
        changes: entry.changes.filter(c => c.type === filter),
      })).filter(entry => entry.changes.length > 0)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 rounded-md hover:bg-muted">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-semibold">产品更新日志</h1>
              <p className="text-xs text-muted-foreground">
                Media Updates · {CHANGELOG.length} 个版本
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {(["all", "feat", "fix"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                filter === f
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f === "all" ? "全部" : f === "feat" ? "新功能" : "修复"}
            </button>
          ))}
        </div>

        <div className="space-y-8">
          {filtered.map((entry, i) => (
            <div key={i} className="relative">
              {i < filtered.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
              )}

              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {entry.version}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">{entry.date}</span>
                    <Badge variant="outline" className="text-xs">{entry.version}</Badge>
                  </div>
                  <div className="space-y-2">
                    {entry.changes.map((change, j) => (
                      <div key={j} className="flex items-start gap-2 text-sm">
                        <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${TYPE_COLORS[change.type]}`}>
                          {TYPE_LABELS[change.type]}
                        </span>
                        <span className="text-muted-foreground">{change.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
