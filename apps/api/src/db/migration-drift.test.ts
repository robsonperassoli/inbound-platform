import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { describe, expect, it } from "vitest"
import {
  assertSchemaMatchesMigrations,
  pendingMigrationStatements,
} from "./migration-drift"
import * as schema from "./schema"

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../drizzle",
)

describe("migration drift", () => {
  it("matches the committed Drizzle migrations", async () => {
    await expect(
      assertSchemaMatchesMigrations(schema, migrationsFolder),
    ).resolves.toBeUndefined()
  })

  it("fails when the schema changes without a generated migration", async () => {
    const drifted = {
      ...schema,
      driftProbe: sqliteTable("drift_probe", {
        id: text("id").primaryKey(),
      }),
    }

    const statements = await pendingMigrationStatements(
      drifted,
      migrationsFolder,
    )
    expect(statements.some((sql) => sql.includes("drift_probe"))).toBe(true)

    await expect(
      assertSchemaMatchesMigrations(drifted, migrationsFolder),
    ).rejects.toThrow(/pnpm db:generate would create a new migration/)
  })

  it("throws when the migration journal has no entries", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "migration-drift-"))
    fs.mkdirSync(path.join(dir, "meta"))
    fs.writeFileSync(
      path.join(dir, "meta", "_journal.json"),
      JSON.stringify({ entries: [] }),
    )

    try {
      await expect(assertSchemaMatchesMigrations(schema, dir)).rejects.toThrow(
        /No Drizzle migrations found/,
      )
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it("throws when the latest snapshot has no id", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "migration-drift-"))
    fs.mkdirSync(path.join(dir, "meta"))
    fs.writeFileSync(
      path.join(dir, "meta", "_journal.json"),
      JSON.stringify({ entries: [{ idx: 0, tag: "0000_empty" }] }),
    )
    fs.writeFileSync(
      path.join(dir, "meta", "0000_snapshot.json"),
      JSON.stringify({ dialect: "sqlite" }),
    )

    try {
      await expect(assertSchemaMatchesMigrations(schema, dir)).rejects.toThrow(
        /missing id/,
      )
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
