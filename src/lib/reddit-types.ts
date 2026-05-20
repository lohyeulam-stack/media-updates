export interface RedditPost {
  id: string
  subreddit: string
  title: string
  url: string
  author: string
  upvotes: number
  commentCount: number
  date: string
  week?: string
  summary: string
  keyInsight?: string
  flair?: string
  imageUrl?: string
  postHint?: string
  isSelf?: boolean
  domain?: string
  fetchedAt: string
}

export const REDDIT_SUBREDDIT_META: Record<string, { label: string; color: string; description: string }> = {
  FacebookAds:  { label: "FB Ads",        color: "#1877F2", description: "Meta广告投放实战" },
  PPC:          { label: "PPC",           color: "#FF6600", description: "搜索/展示广告竞价策略" },
  advertising:  { label: "Advertising",   color: "#E60023", description: "广告行业综合讨论" },
  marketing:    { label: "Marketing",     color: "#7C3AED", description: "市场营销策略与趋势" },
  GoogleAds:    { label: "Google Ads",    color: "#4285F4", description: "Google广告生态" },
  programmatic: { label: "Programmatic",  color: "#00A3E0", description: "程序化广告技术" },
  adops:        { label: "Ad Ops",        color: "#34D399", description: "广告运营与投放优化" },
  socialmedia:  { label: "Social Media",  color: "#EC4899", description: "社交媒体营销与内容" },
}

export const SORT_OPTIONS = [
  { key: "upvotes",  label: "Most Upvotes" },
  { key: "comments", label: "Most Discussed" },
  { key: "date",     label: "Newest" },
] as const

export type SortKey = typeof SORT_OPTIONS[number]["key"]
