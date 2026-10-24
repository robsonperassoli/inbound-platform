import { describe, expect, it } from "vitest"
import { env } from "./env"

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
