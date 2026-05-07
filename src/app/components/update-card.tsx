"use client"

import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  CATEGORY_LABELS,
  PLATFORM_META,
  type MediaUpdate,
} from "@/lib/types"

const IMPORTANCE_STYLES = {
  high: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20",
  low: "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border-slate-500/20",
}

const IMPORTANCE_LABELS = {
  high: "重要",
  medium: "一般",
  low: "次要",
}

export function UpdateCard({ update }: { update: MediaUpdate }) {
  const pm = PLATFORM_META[update.platform]
  const impStyle = IMPORTANCE_STYLES[update.importance]

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg dark:hover:shadow-xl/5 border-border/50 dark:border-white/5 bg-card dark:bg-white/[0.02] backdrop-blur-sm">
      {/* Platform color accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-200 group-hover:w-1.5"
        style={{ backgroundColor: pm?.color || "#888" }}
        aria-hidden="true"
      />

      <CardHeader className="pb-3 pl-5">
        {/* Meta row: platform, importance, category, date */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {/* Platform badge - most prominent */}
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors"
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

          {/* Importance badge */}
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${impStyle}`}>
            {IMPORTANCE_LABELS[update.importance]}
          </span>

          {/* Category badge - lower contrast */}
          <Badge variant="outline" className="text-[11px] text-muted-foreground font-normal border-border/50">
            {CATEGORY_LABELS[update.category] || update.category}
          </Badge>

          {/* Date - right aligned, lowest contrast */}
          <span className="text-[11px] text-muted-foreground/60 ml-auto tabular-nums font-mono">
            {update.date}
          </span>
        </div>

        {/* Title - largest, most prominent */}
        <h3 className="text-base font-semibold leading-snug tracking-tight mb-1.5">
          <a
            href={update.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link inline-flex items-start gap-1.5 hover:text-brand-blue dark:hover:text-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            <span className="flex-1">{update.title}</span>
            <ExternalLink
              className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span className="sr-only">(在新标签页打开)</span>
          </a>
        </h3>

        {/* Original title - if different, smaller and muted */}
        {update.titleOriginal && update.titleOriginal !== update.title && (
          <p className="text-xs text-muted-foreground/60 italic leading-snug">
            {update.titleOriginal}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0 pb-4 pl-5 space-y-3">
        {/* Summary - medium size, good contrast */}
        {update.summary ? (
          <p className="text-sm text-foreground/80 dark:text-foreground/70 leading-relaxed">
            {update.summary}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/40 italic">等待处理...</p>
        )}

        {/* Tags - smallest, grouped together */}
        {update.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {update.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 bg-muted/50 dark:bg-white/5 rounded-md text-muted-foreground/70 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Source - smallest, lowest contrast */}
        <p className="text-[10px] text-muted-foreground/40 pt-0.5">
          来源：{update.source}
        </p>
      </CardContent>
    </Card>
  )
}
