"use client"

import { useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts"
import { PLATFORM_META, type MediaUpdate } from "@/lib/types"

export function TrendChart({ updates }: { updates: MediaUpdate[] }) {
  const platformData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const u of updates) {
      counts[u.platform] = (counts[u.platform] || 0) + 1
    }
    return Object.entries(counts)
      .map(([platform, count]) => ({
        platform,
        label: PLATFORM_META[platform as keyof typeof PLATFORM_META]?.label || platform,
        color: PLATFORM_META[platform as keyof typeof PLATFORM_META]?.color || "#888",
        count,
      }))
      .sort((a, b) => b.count - a.count)
  }, [updates])

  const monthlyData = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {}
    for (const u of updates) {
      const month = u.date?.slice(0, 7) || "unknown"
      if (!counts[month]) counts[month] = {}
      counts[month][u.platform] = (counts[month][u.platform] || 0) + 1
    }
    return Object.entries(counts)
      .map(([month, platforms]) => ({
        month: month.slice(5),
        total: Object.values(platforms).reduce((s, v) => s + v, 0),
        ...platforms,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [updates])

  if (updates.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-muted/30 rounded-xl p-4">
          <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">By Platform</h3>
          <ResponsiveContainer width="100%" height={Math.max(160, platformData.length * 26)}>
            <BarChart data={platformData} layout="vertical" margin={{ left: 56, right: 12, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                width={52}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--foreground)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              />
              <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={14}>
                {platformData.map((d) => (
                  <Cell key={d.platform} fill={d.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-muted/30 rounded-xl p-4">
          <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Monthly</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                width={24}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--foreground)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              />
              <Bar
                dataKey="total"
                fill="var(--foreground)"
                radius={[4, 4, 0, 0]}
                barSize={24}
                fillOpacity={0.7}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
