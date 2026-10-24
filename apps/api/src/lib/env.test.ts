import { afterEach, describe, expect, it, vi } from "vitest"
import { env } from "./env"

const original = { ...process.env }

async function loadEnv(patch: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  vi.resetModules()
  return import("./env")
}

describe("test environment", () => {
  it("uses vitest fixtures and ignores ambient secrets", () => {
    expect(env.NODE_ENV).toBe("test")
    expect(env.SQLITE_PATH).toBe(":memory:")
    expect(env.CRON_SECRET).toBe("test-cron-secret")
    expect(env.STRIPE_STARTER_PRICE_ID).toBe("price_starter_monthly")
    expect(env.STRIPE_STARTER_PRICE_YEARLY_ID).toBe("price_starter_yearly")
    expect(env.STRIPE_PRO_PRICE_ID).toBe("price_pro_monthly")
    expect(env.STRIPE_PRO_PRICE_YEARLY_ID).toBe("price_pro_yearly")
    expect(env.STRIPE_SECRET_KEY).toBeUndefined()
    expect(env.STRIPE_WEBHOOK_SECRET).toBeUndefined()
    expect(env.OPENAI_API_KEY).toBeUndefined()
    expect(env.WORKOS_API_KEY).toBeUndefined()
    expect(env.WORKOS_CLIENT_ID).toBeUndefined()
    expect(env.WORKOS_COOKIE_PASSWORD).toBeUndefined()
    expect(env.RESEND_API_KEY).toBeUndefined()
    expect(env.B2_ENDPOINT).toBeUndefined()
    expect(env.B2_BUCKET).toBeUndefined()
    expect(env.B2_KEY_ID).toBeUndefined()
    expect(env.B2_APPLICATION_KEY).toBeUndefined()
    expect(env.B2_PUBLIC_URL).toBeUndefined()
    expect(env.B2_REGION).toBe("us-west-002")
    expect(env.TINYBIRD_URL).toBeUndefined()
    expect(env.TINYBIRD_TOKEN).toBeUndefined()
  })
})

describe("env", () => {
  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in original)) delete process.env[key]
    }
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  it("reads the test fixtures and fills defaults", async () => {
    delete process.env.PORT
    delete process.env.B2_REGION
    const { env: loaded } = await loadEnv({})

    expect(loaded.NODE_ENV).toBe("test")
    expect(loaded.PORT).toBe(8787)
    expect(loaded.SQLITE_PATH).toBe(":memory:")
    expect(loaded.MIGRATIONS_PATH).toBe("drizzle")
    expect(loaded.API_URL).toBe("http://localhost:8787")
    expect(loaded.BIO_URL).toBe("http://localhost:3001")
    expect(loaded.DASHBOARD_URL).toBe("http://localhost:3000")
    expect(loaded.B2_REGION).toBe("us-west-002")
    expect(loaded.CRON_SECRET).toBe("test-cron-secret")
    expect(loaded.STRIPE_STARTER_PRICE_ID).toBe("price_starter_monthly")
    expect(loaded.OPENAI_API_KEY).toBeUndefined()
  })

  it("coerces PORT and defaults NODE_ENV when they are unset", async () => {
    const { env: loaded } = await loadEnv({
      NODE_ENV: undefined,
      PORT: "9001",
    })

    expect(loaded.NODE_ENV).toBe("development")
    expect(loaded.PORT).toBe(9001)
  })

  it("rejects a missing cron secret, a bad port, and an unknown NODE_ENV", async () => {
    await expect(loadEnv({ CRON_SECRET: undefined })).rejects.toThrow()
    await expect(loadEnv({ CRON_SECRET: "" })).rejects.toThrow()
    await expect(loadEnv({ PORT: "nope" })).rejects.toThrow()
    await expect(loadEnv({ NODE_ENV: "staging" })).rejects.toThrow()
  })
})
