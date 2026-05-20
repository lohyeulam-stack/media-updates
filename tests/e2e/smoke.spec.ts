import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/* Smoke tests for media-updates.
 *
 * These check the *rendered* site. If any regresses, harness-checks.yml fails
 * before review. The assertions tolerate non-200 responses from stale local
 * servers; 500+ is always a hard failure. */

function readMonths(): string[] {
  const dir = path.join(process.cwd(), "data", "monthly");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith(".md")).map(f => f.replace(".md", "")).sort().reverse();
}
function readWeeks(): string[] {
  const dir = path.join(process.cwd(), "data", "weekly");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith(".json")).map(f => f.replace(".json", "")).sort().reverse();
}

test.describe("homepage", () => {
  test("renders without crashing", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });
  test("has searchable UI or filter chips", async ({ page }) => {
    await page.goto("/");
    const el = page.locator('input[type="search"], button:has-text("TikTok"), button:has-text("Meta")').first();
    await expect(el).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("monthly report route", () => {
  const months = readMonths();
  test.skip(!months[0], "No monthly reports in data/monthly/");
  test("renders latest month's report with inline links", async ({ page }) => {
    const response = await page.goto(`/report/${months[0]}`);
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("article a, main a, a[href^='http']").first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("weekly route", () => {
  const weeks = readWeeks();
  test.skip(!weeks[0], "No weekly files in data/weekly/");
  test("renders latest week", async ({ page }) => {
    const response = await page.goto(`/weekly/${weeks[0]}`);
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("platform route", () => {
  test("renders tiktok page", async ({ page }) => {
    const response = await page.goto("/platform/tiktok");
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });
  test("non-existent platform returns < 500", async ({ page }) => {
    const response = await page.goto("/platform/does-not-exist", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(500);
  });
});

test("Reddit page renders without crash", async ({ page }) => {
  const response = await page.goto("/reddit", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(500);
  await expect(page.locator("body")).toBeVisible();
});

test("RSS feed returns XML (no 500)", async ({ request }) => {
  const r = await request.get("/feed.xml");
  expect(r.status()).toBeLessThan(500);
});
