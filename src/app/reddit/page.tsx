import { getRedditPosts, getAvailableWeeks, getAvailableMonths, getUpdates } from "@/lib/data"
import { type RedditPost } from "@/lib/reddit-types"
import { PageLayout } from "@/app/components/page-layout"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 3600

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

function RedditCard({ post }: { post: RedditPost }) {
  return (
    <article className="group border-l-2 pl-5 py-5 border-brand-blue/60 hover:border-brand-blue transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20">
          r/{post.subreddit}
        </span>
        <span className="text-[10px] tabular-nums text-muted-foreground">{post.date}</span>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="text-orange-500">▲</span> {formatCount(post.upvotes)}
          </span>
          <span className="flex items-center gap-1">
            <span className="text-brand-blue">💬</span> {formatCount(post.commentCount)}
          </span>
        </div>
      </div>

      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <h3 className="text-base font-bold leading-snug group-hover:text-brand-blue transition-colors mb-2">
          {post.title}
        </h3>
      </a>

      {post.summary && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {post.summary}
        </p>
      )}

      {post.keyInsight && (
        <div className="mt-3 pl-3 border-l-2 border-yellow-400/60">
          <p className="text-xs font-medium text-foreground/80 italic">
            💡 {post.keyInsight}
          </p>
        </div>
      )}

      {post.author && (
        <div className="mt-3 text-[10px] text-muted-foreground/50">
          u/{post.author}
        </div>
      )}
    </article>
  )
}

export default function RedditPage() {
  const rawPosts = getRedditPosts()
  const posts = rawPosts as RedditPost[]

  // Last 30 days, newest first
  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
  const cutoffStr = cutoff.toISOString().split("T")[0]
  const todayStr = now.toISOString().split("T")[0]

  const recent = posts
    .filter((p) => p.date >= cutoffStr && p.date <= todayStr)
    .sort((a, b) => b.date.localeCompare(a.date))

  const updates = getUpdates()
  const months = getAvailableMonths()
  const weeks = getAvailableWeeks()

  return (
    <PageLayout updates={updates} months={months} weeks={weeks}>
      <div className="px-6 lg:px-12 py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <span className="mx-2 text-muted-foreground/30">/</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground">
            Reddit
          </span>
          {posts.length > 0 && (
            <span className="ml-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-brand-blue/30 text-brand-blue">
              {posts.length} discussions
            </span>
          )}
        </div>

        <div className="max-w-4xl">
          <h1 className="swiss-h2 mb-4">Reddit Ad Intel</h1>
          <p className="text-lg text-muted-foreground mb-12 leading-relaxed max-w-2xl">
            First-hand insights from 8 advertising-related subreddits — campaign post-mortems, bid strategy discussions, creative test results, and unofficial platform intel. Updated daily at Beijing midnight.
          </p>
        </div>

        {recent.length > 0 ? (
          <div className="max-w-4xl divide-y divide-border/40">
            {recent.map((post) => (
              <RedditCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="py-40 text-center max-w-4xl">
            <div className="text-5xl lg:text-7xl font-bold uppercase tracking-tighter opacity-10 mb-4">
              No Signal.
            </div>
            <p className="text-sm font-mono opacity-40">
              Reddit data is fetched daily at Beijing 00:00. Check back after the next sync.
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
