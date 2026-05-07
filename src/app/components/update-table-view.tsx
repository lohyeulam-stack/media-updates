"use client"

import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  CATEGORY_LABELS,
  PLATFORM_META,
  type MediaUpdate,
} from "@/lib/types"

const IMPORTANCE_LABELS = {
  high: "重要",
  medium: "一般",
  low: "次要",
}

export function UpdateTableView({ updates }: { updates: MediaUpdate[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/50 dark:border-white/5">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 dark:bg-white/[0.02] border-b border-border/50 dark:border-white/5">
          <tr>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
              日期
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
              平台
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
              标题
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
              分类
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
              重要性
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50 dark:divide-white/5">
          {updates.map((update) => {
            const pm = PLATFORM_META[update.platform]
            return (
              <tr
                key={update.id}
                className="group hover:bg-muted/20 dark:hover:bg-white/[0.01] transition-colors"
              >
                <td className="px-4 py-3 text-xs text-muted-foreground/60 font-mono tabular-nums whitespace-nowrap">
                  {update.date}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: pm?.color + "15",
                      color: pm?.color,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: pm?.color }}
                      aria-hidden="true"
                    />
                    {pm?.label || update.platform}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={update.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link inline-flex items-start gap-1.5 text-sm font-medium text-foreground hover:text-brand-blue dark:hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    <span className="flex-1">{update.title}</span>
                    <ExternalLink
                      className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  </a>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal border-border/50">
                    {CATEGORY_LABELS[update.category] || update.category}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs text-muted-foreground">
                    {IMPORTANCE_LABELS[update.importance]}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
