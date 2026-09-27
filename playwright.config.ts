import { defineConfig } from "@playwright/test";

const DATABASE_URL = process.env.DATABASE_URL || "postgres://app:app@localhost:5432/app_db";

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://localhost:3200",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run start -- --port 3200",
    port: 3200,
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      DATABASE_URL,
      ADMIN_KEY: "test-admin-key",
      NEXT_PUBLIC_BASE_URL: "http://localhost:3200",
    },
  },
});
