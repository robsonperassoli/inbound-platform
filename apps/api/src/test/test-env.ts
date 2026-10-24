// Vitest's `test.env` does not override variables already in the environment.
// Apply this before the app loads so a developer or CI shell cannot leak
// secrets or replace the fixtures declared in vitest.config.ts.
export const testEnv = {
  NODE_ENV: "test",
  SQLITE_PATH: ":memory:",
  CRON_SECRET: "test-cron-secret",
  STRIPE_STARTER_PRICE_ID: "price_starter_monthly",
  STRIPE_STARTER_PRICE_YEARLY_ID: "price_starter_yearly",
  STRIPE_PRO_PRICE_ID: "price_pro_monthly",
  STRIPE_PRO_PRICE_YEARLY_ID: "price_pro_yearly",
} as const

const SECRET_KEYS = new Set(["OPENAI_API_KEY"])
const SECRET_PREFIXES = ["STRIPE_", "WORKOS_", "B2_", "TINYBIRD_", "RESEND_"]

export function applyTestEnv() {
  for (const key of Object.keys(process.env)) {
    if (
      SECRET_KEYS.has(key) ||
      SECRET_PREFIXES.some((prefix) => key.startsWith(prefix))
    ) {
      delete process.env[key]
    }
  }

  for (const [key, value] of Object.entries(testEnv)) {
    process.env[key] = value
  }
}

applyTestEnv()
