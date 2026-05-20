// RedditPost type — see docs/adr/0007-reddit-aggregation.md
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
  fetchedAt: string
}

export const REDDIT_SUBREDDIT_LABELS: Record<string, string> = {
  FacebookAds: "FB Ads",
  PPC: "PPC",
  advertising: "Advertising",
  marketing: "Marketing",
  GoogleAds: "Google Ads",
  programmatic: "Programmatic",
  adops: "Ad Ops",
  socialmedia: "Social Media",
}
