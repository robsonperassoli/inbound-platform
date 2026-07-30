import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(8787),
  SQLITE_PATH: z.string().default("data/inbound.sqlite"),
  API_URL: z.string().default("http://localhost:8787"),
  BIO_URL: z.string().default("http://localhost:3001"),
  DASHBOARD_URL: z.string().default("http://localhost:3000"),
  WORKOS_API_KEY: z.string().optional(),
  WORKOS_CLIENT_ID: z.string().optional(),
  WORKOS_COOKIE_PASSWORD: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_STARTER_PRICE_ID: z.string().optional(),
  STRIPE_STARTER_PRICE_YEARLY_ID: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  STRIPE_PRO_PRICE_YEARLY_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SUPPORT_EMAIL: z.string().optional(),
  SALES_EMAIL: z.string().optional(),
  FEEDBACK_EMAIL: z.string().optional(),
  B2_ENDPOINT: z.string().optional(),
  B2_REGION: z.string().default("us-west-002"),
  B2_BUCKET: z.string().optional(),
  B2_KEY_ID: z.string().optional(),
  B2_APPLICATION_KEY: z.string().optional(),
  B2_PUBLIC_URL: z.string().optional(),
  TINYBIRD_URL: z.string().optional(),
  TINYBIRD_TOKEN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env)
