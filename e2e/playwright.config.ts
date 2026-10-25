import { defineConfig, devices } from "@playwright/test"
import {
  API_URL,
  apiEnv,
  BIO_URL,
  DASHBOARD_URL,
  repoRoot,
  webEnv,
} from "./src/servers"

const ci = Boolean(process.env.CI)

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  timeout: 60_000,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command:
        'rm -f "$SQLITE_PATH" "$SQLITE_PATH-wal" "$SQLITE_PATH-shm" && pnpm --filter @inbound/api db:migrate && pnpm --filter @inbound/api db:seed && pnpm --filter @inbound/api dev',
      cwd: repoRoot,
      env: apiEnv,
      url: `${API_URL}/health`,
      reuseExistingServer: !ci,
      timeout: 180_000,
    },
    {
      command:
        "pnpm --filter @inbound/dashboard exec vite --host 127.0.0.1 --port 3000 --strictPort --clearScreen false",
      cwd: repoRoot,
      env: webEnv,
      url: DASHBOARD_URL,
      reuseExistingServer: !ci,
      timeout: 180_000,
    },
    {
      command:
        "pnpm --filter @inbound/bio exec vite dev --host 127.0.0.1 --port 3001 --strictPort --clearScreen false",
      cwd: repoRoot,
      env: webEnv,
      url: BIO_URL,
      reuseExistingServer: !ci,
      timeout: 180_000,
    },
  ],
})
