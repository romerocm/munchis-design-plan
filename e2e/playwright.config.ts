import path from "path";
import { defineConfig, devices } from "@playwright/test";

const projectRoot = path.resolve(__dirname, "..");

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? "50%" : undefined, // use half of CI runner cores
  reporter: process.env.CI ? "html" : "list",
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: "http://localhost:3695",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "desktop-chrome",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 7"],
      },
    },
    {
      name: "mobile-safari",
      use: {
        ...devices["iPhone 14"],
      },
    },
  ],

  webServer: {
    command: process.env.CI
      ? "PORT=3695 node .next/standalone/server.js"  // CI: standalone output mode
      : "npm run dev -- --port 3695",                // Local: dev server with HMR
    port: 3695,
    cwd: projectRoot,
    reuseExistingServer: true,
    timeout: 120_000, // production build cold-start can be slow in CI
  },
});
