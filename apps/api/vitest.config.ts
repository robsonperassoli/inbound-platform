import { defineConfig } from "vitest/config"
import { testEnv } from "./src/test/test-env.ts"

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // test-env.ts must run before setup.ts, which imports the database and env.
    setupFiles: ["./src/test/test-env.ts", "./src/test/setup.ts"],
    pool: "forks",
    fileParallelism: true,
    env: { ...testEnv },
  },
})
