import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    pool: "forks",
    fileParallelism: true,
    env: {
      NODE_ENV: "test",
      SQLITE_PATH: ":memory:",
      STRIPE_STARTER_PRICE_ID: "price_starter_monthly",
      STRIPE_STARTER_PRICE_YEARLY_ID: "price_starter_yearly",
      STRIPE_PRO_PRICE_ID: "price_pro_monthly",
      STRIPE_PRO_PRICE_YEARLY_ID: "price_pro_yearly",
    },
  },
})
