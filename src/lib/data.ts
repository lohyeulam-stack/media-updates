import fs from "fs"
import path from "path"
import type { MediaUpdate } from "./types"

const DATA_DIR = path.join(process.cwd(), "data")

export function getUpdates(): MediaUpdate[] {
  const file = path.join(DATA_DIR, "updates.json")
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

export function getMonthlyReport(month: string): string | null {
  const file = path.join(DATA_DIR, "monthly", `${month}.md`)
  try {
    return fs.readFileSync(file, "utf-8")
  } catch {
    return null
  }
}

export function getAvailableMonths(): string[] {
  const dir = path.join(DATA_DIR, "monthly")
  try {
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(".md", ""))
      .sort()
      .reverse()
  } catch {
    return []
  }
}

export function getWeeklyData(week: string): MediaUpdate[] {
  const file = path.join(DATA_DIR, "weekly", `${week}.json`)
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

export function getAvailableWeeks(): string[] {
  const dir = path.join(DATA_DIR, "weekly")
  try {
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort()
      .reverse()
  } catch {
    return []
  }
}
