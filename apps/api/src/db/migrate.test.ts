import path from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { env } from "../lib/env"
import { applyMigrations } from "./migrate"

const previousPath = env.MIGRATIONS_PATH
const migrationsFolder = path.resolve(process.cwd(), "drizzle")

describe("applyMigrations", () => {
  afterEach(() => {
    env.MIGRATIONS_PATH = previousPath
    vi.restoreAllMocks()
  })

  it("applies a relative folder and an absolute folder", () => {
    vi.spyOn(console, "log").mockImplementation(() => {})

    env.MIGRATIONS_PATH = "drizzle"
    applyMigrations()

    env.MIGRATIONS_PATH = migrationsFolder
    applyMigrations()

    expect(path.isAbsolute(migrationsFolder)).toBe(true)
    expect(console.log).toHaveBeenCalledTimes(2)
    expect(console.log).toHaveBeenCalledWith("Migrations applied")
  })

  it("fails when the migrations folder is missing", () => {
    env.MIGRATIONS_PATH = "missing-migrations-folder"
    expect(() => applyMigrations()).toThrow()

    env.MIGRATIONS_PATH = "/tmp/inbound-missing-migrations"
    expect(() => applyMigrations()).toThrow()
  })
})
