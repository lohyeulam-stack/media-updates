import { getUpdates } from "@/lib/data"

export async function GET() {
  const updates = getUpdates().slice(0, 50)
  const now = new Date().toUTCString()

  const items = updates.map((u) => `    <item>
      <title><![CDATA[${u.title}]]></title>
      <link>${u.sourceUrl || "https://media-updates.vercel.app"}</link>
      <description><![CDATA[${u.summary || ""}]]></description>
      <pubDate>${new Date(u.date).toUTCString()}</pubDate>
      <category>${u.platform}</category>
      <guid isPermaLink="false">${u.id}</guid>
    </item>`).join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Media Updates - TopTou</title>
    <link>https://media-updates.vercel.app</link>
    <description>20+ Ad Platform Updates Tracker</description>
    <language>zh-CN</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="https://media-updates.vercel.app/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  })
}
