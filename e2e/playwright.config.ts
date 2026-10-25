import { defineConfig, devices } from "@playwright/test"
import {
  API_URL,
  apiEnv,
  BIO_URL,
  DASHBOARD_URL,
  hasE2ESecrets,
  OPENAI_STUB_URL,
  repoRoot,
  storageStatePath,
  webEnv,
} from "./src/servers"

const ci = Boolean(process.env.CI)

const servers = [
  {
    command: "node e2e/src/openai-stub.mjs",
    cwd: repoRoot,
    env: apiEnv,
    url: `${OPENAI_STUB_URL}/health`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
  {
    command: "pnpm --filter @inbound/api dev",
    cwd: repoRoot,
    env: apiEnv,
    url: `${API_URL}/health`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  {
    command:
      "pnpm --filter @inbound/dashboard exec vite --host localhost --port 3000 --strictPort --clearScreen false",
    cwd: repoRoot,
    env: webEnv,
    url: DASHBOARD_URL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  {
    command:
      "pnpm --filter @inbound/bio exec vite dev --host localhost --port 3001 --strictPort --clearScreen false",
    cwd: repoRoot,
    env: webEnv,
    url: BIO_URL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
]

export default defineConfig({
  testDir: "./tests",
  testMatch: hasE2ESecrets ? "**/*.spec.ts" : "**/missing-secrets.spec.ts",
  testIgnore: hasE2ESecrets ? "**/missing-secrets.spec.ts" : undefined,
  fullyParallel: false,
  workers: 1,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  timeout: 60_000,
  globalSetup: hasE2ESecrets ? "./src/global-setup.ts" : undefined,
  globalTeardown: hasE2ESecrets ? "./src/global-teardown.ts" : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: DASHBOARD_URL,
    storageState: hasE2ESecrets ? storageStatePath : undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: hasE2ESecrets
    ? [
        {
          name: "chromium",
          testMatch: "**/smoke.spec.ts",
          use: { ...devices["Desktop Chrome"] },
        },
        {
          // Onboarding in this file creates the signed-in user's profile, so it
          // has to follow the smoke test, which expects that profile to be absent.
          name: "flows",
          testMatch: "**/flows.spec.ts",
          dependencies: ["chromium"],
          use: { ...devices["Desktop Chrome"] },
        },
      ]
    : [
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },
      ],
  webServer: hasE2ESecrets ? servers : undefined,
})
