import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
)

describe("fallow config", () => {
  it("treats framework routes and the Hono server as entries", () => {
    const config = readFileSync(path.join(repoRoot, ".fallowrc.jsonc"), "utf8")

    expect(config).toContain("apps/bio/src/routes/**/*.{ts,tsx}")
    expect(config).toContain("apps/bio/src/start.ts")
    expect(config).toContain("apps/dashboard/index.html")
    expect(config).toContain("apps/dashboard/src/routes/**/*.{ts,tsx}")
    expect(config).toContain("apps/website/src/pages/**/*.astro")
    expect(config).toContain("apps/api/src/index.ts")
    expect(config).toContain("apps/api/src/app.ts")
    expect(config).toContain("apps/api/src/scripts/**/*.ts")
    expect(config).toContain("**/*.gen.ts")
    expect(config).toContain('"fallow"')

    const output = execFileSync(
      path.join(repoRoot, "node_modules", ".bin", "fallow"),
      ["list", "--entry-points"],
      { cwd: repoRoot, encoding: "utf8" },
    )

    expect(output).toContain("apps/bio/src/routes/index.tsx (manual entry)")
    expect(output).toContain("apps/bio/src/start.ts (manual entry)")
    expect(output).toContain("apps/dashboard/index.html (manual entry)")
    expect(output).toContain(
      "apps/dashboard/src/routes/index.tsx (manual entry)",
    )
    expect(output).toContain(
      "apps/website/src/pages/index.astro (manual entry)",
    )
    expect(output).toContain("apps/api/src/index.ts (manual entry)")
    expect(output).toContain("apps/api/src/app.ts (manual entry)")
    expect(output).toContain("apps/api/src/scripts/seed.ts (manual entry)")
    expect(output).not.toContain("routeTree.gen.ts")
  })
})
