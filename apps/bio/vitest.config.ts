import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

function stubCss() {
  return {
    name: "stub-css",
    enforce: "pre" as const,
    resolveId(source: string) {
      if (!source.includes(".css")) return null
      return `\0css-stub:${source}`
    },
    load(id: string) {
      if (id.startsWith("\0css-stub:")) {
        return id.includes("url")
          ? "export default '/stub.css'"
          : "export default {}"
      }
      if (!id.includes(".css")) return null
      if (id.includes("?url") || id.includes(".css?")) {
        return "export default '/stub.css'"
      }
      return "export default {}"
    },
  }
}

export default defineConfig({
  plugins: [
    stubCss(),
    react(),
    tsconfigPaths({
      projects: ["./tsconfig.json"],
    }),
  ],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
  },
})
