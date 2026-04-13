import { defineConfig, devices } from "@playwright/test";

/**
 * E2E Test Configuration for HypeSocial
 * Tests real user journeys: login → dashboard → posts → accounts → webhooks
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    // Setup project for authentication
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    // Unauthenticated tests (public pages, login)
    {
      name: "unauthenticated",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    // Authenticated tests (real APIs - sequential due to rate limiting)
    {
      name: "authenticated",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: /fast-parallel\.spec\.ts/, // Skip fast tests here
    },
    // Fast parallel tests (mocked APIs - can run in parallel)
    {
      name: "fast-parallel",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testMatch: /fast-parallel\.spec\.ts/,
    },
    // Mobile audit tests
    {
      name: "mobile-audit",
      use: {
        ...devices["iPhone 12"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testMatch: /mobile-audit\.spec\.ts/,
    },
  ],

  // Run tests sequentially to avoid rate limiting (60 req/min)
  workers: 1,
  // Shard tests in CI for parallel execution across machines
  shard: process.env.CI
    ? {
        total: parseInt(process.env.SHARD_TOTAL || "1"),
        current: parseInt(process.env.SHARD_INDEX || "1"),
      }
    : undefined,
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
