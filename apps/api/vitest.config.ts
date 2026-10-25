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
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: ["src/scripts/**", "src/test/**"],
      reportOnFailure: true,
      thresholds: {
        lines: 72,
        statements: 70,
        functions: 75,
        branches: 66,
      },
    },
    env: { ...testEnv },
  },
})
