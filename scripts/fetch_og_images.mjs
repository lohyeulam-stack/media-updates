/**
 * Enrich updates.json (and weekly/*.json) with OG image URLs.
 * Usage: node scripts/fetch_og_images.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dir, '../data')

async function fetchOgImage(url, timeout = 8000) {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeout)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MediaUpdatesBot/1.0)' }
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const html = await res.text()
    // Try og:image first, then twitter:image, then first <img>
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    if (ogMatch) return ogMatch[1].trim()
    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)
    if (twMatch) return twMatch[1].trim()
    return null
  } catch {
    return null
  }
}

async function enrichFile(filePath) {
  const items = JSON.parse(readFileSync(filePath, 'utf8'))
  let changed = 0
  for (const item of items) {
    if (item.imageUrl !== undefined) continue  // already processed
    if (!item.sourceUrl) { item.imageUrl = null; continue }
    process.stdout.write(`  fetching ${item.id}... `)
    const img = await fetchOgImage(item.sourceUrl)
    item.imageUrl = img || null
    console.log(img ? `✓ ${img.slice(0, 60)}` : 'no image')
    changed++
  }
  if (changed > 0) writeFileSync(filePath, JSON.stringify(items, null, 2))
  return changed
}

async function main() {
  // Enrich updates.json
  console.log('\n=== Enriching data/updates.json ===')
  await enrichFile(join(DATA_DIR, 'updates.json'))

  // Enrich weekly files
  const weeklyDir = join(DATA_DIR, 'weekly')
  const weeklyFiles = readdirSync(weeklyDir).filter(f => f.endsWith('.json'))
  for (const f of weeklyFiles.slice(-4)) {  // only recent 4 weeks
    console.log(`\n=== Enriching weekly/${f} ===`)
    await enrichFile(join(weeklyDir, f))
  }
  console.log('\nDone.')
}

main().catch(console.error)
