/**
 * Enrich updates.json (and recent weekly/*.json) with OG image URLs.
 * Usage: node scripts/fetch_og_images.mjs [--force]
 *   --force  re-fetch items that previously returned null
 *
 * Concurrency: 10 parallel fetches (was serial — 172 items × 8s = ~23 min worst case)
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dir, '../data')
const CONCURRENCY = 10
const TIMEOUT_MS = 8000
const FORCE = process.argv.includes('--force')

const UA_LIST = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
]

// Reject og:image URLs that are platform logos or default sharing cards.
// These make cards look broken because every article shares the same logo,
// and logos don't have the aspect ratio / content suited to a 16:9 hero image.
const LOGO_PATTERNS = [
  /\/logo[._-]/i,
  /googlelogo/i,
  /snapchat_logo/i,
  /_logo[._-]/i,
  /-logo[._-]/i,
  /\/icon[._-]/i,
  /favicon/i,
  /sharing-card/i,           // X default
  /gmp\.max/i,                // Google Marketing Platform logo
  /youtube_social/i,          // YouTube default social image
  /ghost_yellow/i,            // Snapchat default ghost
  /default[._-](hero|image|cover|og)/i,
]

function isLogoUrl(url) {
  if (!url) return false
  return LOGO_PATTERNS.some((p) => p.test(url))
}

async function fetchOgImage(url) {
  const ua = UA_LIST[Math.floor(Math.random() * UA_LIST.length)]
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      })
      clearTimeout(timer)
      if (!res.ok) return null
      const html = await res.text()
      // og:image (both attribute orderings)
      const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
            || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)
      if (!m) return null
      // Decode HTML entities (e.g. &amp; → &) before storing
      const imageUrl = m[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      // Reject platform logos / default sharing cards — they make bad hero covers
      if (isLogoUrl(imageUrl)) return null
      return imageUrl
    } catch {
      if (attempt === 0) await new Promise(r => setTimeout(r, 1500))
    }
  }
  return null
}

// Run tasks with bounded concurrency
async function pool(tasks, concurrency) {
  const results = []
  let idx = 0
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++
      results[i] = await tasks[i]()
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
  return results
}

async function enrichFile(filePath) {
  const items = JSON.parse(readFileSync(filePath, 'utf8'))
  const pending = items.filter(item => {
    if (!item.sourceUrl) return false
    if (FORCE) return true
    return item.imageUrl === undefined  // only unprocessed
  })

  if (pending.length === 0) {
    console.log(`  → 0 pending items, skipping`)
    return 0
  }

  console.log(`  → ${pending.length} items to enrich (concurrency=${CONCURRENCY})`)

  const tasks = pending.map(item => async () => {
    process.stdout.write(`  ${item.id}... `)
    const img = await fetchOgImage(item.sourceUrl)
    item.imageUrl = img || null
    console.log(img ? `✓` : `✗`)
    return img
  })

  await pool(tasks, CONCURRENCY)

  // For items with no sourceUrl that were never touched
  for (const item of items) {
    if (item.imageUrl === undefined) item.imageUrl = null
  }

  const found = items.filter(i => i.imageUrl).length
  writeFileSync(filePath, JSON.stringify(items, null, 2))
  return found
}

async function main() {
  const start = Date.now()
  let totalFound = 0

  console.log('\n=== Enriching data/updates.json ===')
  totalFound += await enrichFile(join(DATA_DIR, 'updates.json'))

  const weeklyDir = join(DATA_DIR, 'weekly')
  const weeklyFiles = readdirSync(weeklyDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .slice(-4)  // only 4 most recent weeks

  for (const f of weeklyFiles) {
    console.log(`\n=== Enriching weekly/${f} ===`)
    totalFound += await enrichFile(join(weeklyDir, f))
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`\nDone. ${totalFound} images found. Elapsed: ${elapsed}s`)
}

main().catch(console.error)
