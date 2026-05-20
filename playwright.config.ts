import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for media-updates smoke tests.
 *
 * Goal: catch regressions in the *rendered* site, not just code that compiles.
 * The OpenAI harness-engineering article calls this "giving the agent eyes" —
 * accessibility-tree assertions are the universal interface.
 *
 * Run locally:  npm run build && npm test
 * Run with UI:  npm run test:ui
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html"]] : "list",
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    locale: "zh-CN",
  },

  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"] },
    },
  ],

  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
