"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  CATEGORY_LABELS,
  PLATFORM_META,
  type MediaUpdate,
} from "@/lib/types"

const IMPORTANCE_STYLES = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-500 border-slate-200",
}

export function UpdateCard({ update }: { update: MediaUpdate }) {
  const pm = PLATFORM_META[update.platform]
  const impStyle = IMPORTANCE_STYLES[update.importance]

  return (
    <Card className="group transition-[transform,box-shadow] duration-300 motion-reduce:transition-none hover:shadow-xl motion-reduce:hover:shadow-lg hover:-translate-y-1 motion-reduce:hover:translate-y-0 border-l-4 bg-card/50 backdrop-blur-sm"
          style={{ borderLeftColor: pm?.color || "#888" }}>
      <CardHeader className="pb-2 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: pm?.color + "15", color: pm?.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pm?.color }} />
            {pm?.label || update.platform}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${impStyle}`}>
            {update.importance === "high" ? "重要" : update.importance === "medium" ? "一般" : "次要"}
          </span>
          <Badge variant="outline" className="text-xs text-muted-foreground font-normal">
            {CATEGORY_LABELS[update.category] || update.category}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto tabular-nums">{update.date}</span>
        </div>
        <CardTitle className="text-[15px] leading-snug font-semibold">
          <a href={update.sourceUrl} target="_blank" rel="noopener noreferrer"
             className="hover:text-blue-600 transition-colors">
            {update.title}
          </a>
        </CardTitle>
        {update.titleOriginal && update.titleOriginal !== update.title && (
          <p className="text-xs text-muted-foreground/70 italic leading-snug">
            {update.titleOriginal}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {update.summary ? (
          <p className="text-sm text-foreground/75 leading-relaxed">
            {update.summary}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">Pending...</p>
        )}
        {update.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {update.tags.map((tag) => (
              <span key={tag} className="text-[11px] px-1.5 py-0.5 bg-muted rounded-md text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground/50 pt-1">{update.source}</p>
      </CardContent>
    </Card>
  )
}
