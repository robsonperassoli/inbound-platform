import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const e2eDir = path.dirname(fileURLToPath(import.meta.url))

export const repoRoot = path.resolve(e2eDir, "../..")

export const API_URL = "http://127.0.0.1:8787"
export const DASHBOARD_URL = "http://127.0.0.1:3000"
export const BIO_URL = "http://127.0.0.1:3001"

export const sqlitePath = path.join(os.tmpdir(), "inbound-e2e.sqlite")

const clearedSecrets = {
  WORKOS_API_KEY: "",
  WORKOS_CLIENT_ID: "",
  WORKOS_COOKIE_PASSWORD: "",
  STRIPE_SECRET_KEY: "",
  STRIPE_WEBHOOK_SECRET: "",
  STRIPE_STARTER_PRICE_ID: "",
  STRIPE_STARTER_PRICE_YEARLY_ID: "",
  STRIPE_PRO_PRICE_ID: "",
  STRIPE_PRO_PRICE_YEARLY_ID: "",
  RESEND_API_KEY: "",
  B2_ENDPOINT: "",
  B2_BUCKET: "",
  B2_KEY_ID: "",
  B2_APPLICATION_KEY: "",
  B2_PUBLIC_URL: "",
  TINYBIRD_URL: "",
  TINYBIRD_TOKEN: "",
  OPENAI_API_KEY: "",
}

export const apiEnv: Record<string, string> = {
  ...clearedSecrets,
  NODE_ENV: "development",
  PORT: "8787",
  SQLITE_PATH: sqlitePath,
  MIGRATIONS_PATH: path.join(repoRoot, "apps/api/drizzle"),
  API_URL,
  BIO_URL,
  DASHBOARD_URL,
  CRON_SECRET: "e2e-cron-secret",
  E2E_AUTH_BYPASS: "1",
}

export const webEnv: Record<string, string> = {
  NODE_ENV: "development",
  VITE_API_URL: API_URL,
  VITE_BIO_URL: BIO_URL,
  API_URL,
  BIO_URL,
  DASHBOARD_URL,
}
