/**
 * Enrich updates.json (and recent weekly/*.json) with OG image URLs.
 * Usage: node scripts/fetch_og_images.mjs [--force]
 *   --force  re-fetch items that previously returned null
 *
 * Strategy:
 *   - JS-heavy platforms (meta, tiktok, pinterest, youtube, x, google) → Playwright
 *   - Everything else → plain fetch (faster, no browser needed)
 *
 * Concurrency:
 *   - Playwright: 3 parallel browser pages (RAM-bound)
 *   - Fetch: 10 parallel requests
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dir, '../data')
const FORCE = process.argv.includes('--force')

// Platforms that require a real browser to render og:image tags
const PLAYWRIGHT_PLATFORMS = new Set(['meta', 'tiktok', 'pinterest', 'youtube', 'x', 'google'])

const FETCH_CONCURRENCY = 10
const PW_CONCURRENCY = 3
const FETCH_TIMEOUT_MS = 8000
const PW_TIMEOUT_MS = 20000

const UA_LIST = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
]

const LOGO_PATTERNS = [
  /\/logo[._-]/i,
  /googlelogo/i,
  /snapchat_logo/i,
  /_logo[._-]/i,
  /-logo[._-]/i,
  /\/icon[._-]/i,
  /favicon/i,
  /sharing-card/i,
  /gmp\.max/i,
  /youtube_social/i,
  /ghost_yellow/i,
  /default[._-](hero|image|cover|og)/i,
]

function isLogoUrl(url) {
  if (!url) return false
  return LOGO_PATTERNS.some((p) => p.test(url))
}

function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

function extractOgFromHtml(html) {
  const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
          || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)
  if (!m) return null
  const url = decodeEntities(m[1].trim())
  return isLogoUrl(url) ? null : url
}

// ── Plain fetch (for non-JS platforms) ───────────────────────────────────────

async function fetchOgImageHttp(url) {
  const ua = UA_LIST[Math.floor(Math.random() * UA_LIST.length)]
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
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
      return extractOgFromHtml(html)
    } catch {
      if (attempt === 0) await new Promise(r => setTimeout(r, 1500))
    }
  }
  return null
}

// ── Playwright (for JS-rendered platforms) ───────────────────────────────────

let _browser = null
async function getBrowser() {
  if (!_browser) {
    const { chromium } = await import('playwright')
    _browser = await chromium.launch({ headless: true })
  }
  return _browser
}

// TikTok's newsroom uses heavy JS — networkidle times out, so use domcontentloaded + wait
const SLOW_PLATFORMS = new Set(['tiktok'])

async function fetchOgImagePlaywright(url, platform) {
  const isSlow = SLOW_PLATFORMS.has(platform)
  for (let attempt = 0; attempt < 2; attempt++) {
    let page = null
    try {
      const browser = await getBrowser()
      page = await browser.newPage()
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' })
      if (isSlow) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PW_TIMEOUT_MS })
        await page.waitForTimeout(4000)
      } else {
        await page.goto(url, { waitUntil: 'networkidle', timeout: PW_TIMEOUT_MS })
      }

      const result = await page.evaluate((logoPatternSources) => {
        const logoPatterns = logoPatternSources.map(s => new RegExp(s, 'i'))
        function isLogo(u) { return u && logoPatterns.some(p => p.test(u)) }

        // 1. Try og:image / twitter:image
        const ogMeta = document.querySelector('meta[property="og:image"], meta[name="twitter:image"]')
        const ogUrl = ogMeta?.getAttribute('content')
        if (ogUrl && !isLogo(ogUrl)) return ogUrl

        // 2. Fallback: largest <img> in the page that isn't a logo/icon/nav element
        const imgs = [...document.querySelectorAll('article img, main img, [class*="hero"] img, [class*="cover"] img, [class*="featured"] img, [class*="banner"] img, img')]
          .map(img => ({ src: img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src'), w: img.naturalWidth || img.width || 0 }))
          .filter(i => i.src && i.src.startsWith('http') && i.w > 200 && !isLogo(i.src))
          .sort((a, b) => b.w - a.w)
        return imgs[0]?.src || null
      }, LOGO_PATTERNS.map(r => r.source))

      await page.close()
      return result || null
    } catch {
      if (page) await page.close().catch(() => {})
      if (attempt === 0) await new Promise(r => setTimeout(r, 2000))
    }
  }
  return null
}

// ── Concurrency pool ──────────────────────────────────────────────────────────

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

// ── File enrichment ───────────────────────────────────────────────────────────

async function enrichFile(filePath) {
  const items = JSON.parse(readFileSync(filePath, 'utf8'))
  const pending = items.filter(item => {
    if (!item.sourceUrl) return false
    if (FORCE) return true
    return item.imageUrl === undefined || item.imageUrl === null
  })

  if (pending.length === 0) {
    console.log(`  → 0 pending items, skipping`)
    return 0
  }

  const pwItems = pending.filter(i => PLAYWRIGHT_PLATFORMS.has(i.platform))
  const httpItems = pending.filter(i => !PLAYWRIGHT_PLATFORMS.has(i.platform))

  console.log(`  → ${pending.length} items (${pwItems.length} playwright, ${httpItems.length} fetch)`)

  const makeTasks = (list, fetcher, usePlatform = false) =>
    list.map(item => async () => {
      process.stdout.write(`  [${item.platform}] ${item.id}... `)
      const img = usePlatform ? await fetcher(item.sourceUrl, item.platform) : await fetcher(item.sourceUrl)
      item.imageUrl = img || null
      console.log(img ? `✓` : `✗`)
      return img
    })

  await pool(makeTasks(pwItems, fetchOgImagePlaywright, true), PW_CONCURRENCY)
  await pool(makeTasks(httpItems, fetchOgImageHttp), FETCH_CONCURRENCY)

  for (const item of items) {
    if (item.imageUrl === undefined) item.imageUrl = null
  }

  writeFileSync(filePath, JSON.stringify(items, null, 2))
  return items.filter(i => i.imageUrl).length
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const start = Date.now()

  console.log('\n=== Enriching data/updates.json ===')
  await enrichFile(join(DATA_DIR, 'updates.json'))

  const weeklyDir = join(DATA_DIR, 'weekly')
  const weeklyFiles = readdirSync(weeklyDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .slice(-4)

  for (const f of weeklyFiles) {
    console.log(`\n=== Enriching weekly/${f} ===`)
    await enrichFile(join(weeklyDir, f))
  }

  if (_browser) await _browser.close()

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  // Final tally
  const data = JSON.parse(readFileSync(join(DATA_DIR, 'updates.json'), 'utf8'))
  const withImg = data.filter(i => i.imageUrl).length
  console.log(`\nDone in ${elapsed}s. updates.json: ${withImg}/${data.length} have images.`)
}

main().catch(async (e) => {
  if (_browser) await _browser.close().catch(() => {})
  console.error(e)
  process.exit(1)
})
