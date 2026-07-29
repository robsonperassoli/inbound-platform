import path from "node:path"
import { fileURLToPath } from "node:url"
import { beforeEach } from "vitest"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { db, sqlite } from "../db/client"

const VERSIONING_TABLES = new Set(["__drizzle_migrations", "sqlite_sequence"])

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../drizzle",
)

migrate(db, { migrationsFolder })

function listDataTables() {
  const rows = sqlite
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table'
         AND name NOT LIKE 'sqlite_%'
       ORDER BY name`,
    )
    .all() as Array<{ name: string }>

  return rows
    .map((row) => row.name)
    .filter((name) => !VERSIONING_TABLES.has(name))
}

export function resetDatabase() {
  const tables = listDataTables()
  sqlite.pragma("foreign_keys = OFF")
  for (const table of tables) {
    sqlite.exec(`DELETE FROM "${table}"`)
  }
  sqlite.pragma("foreign_keys = ON")
}

beforeEach(() => {
  resetDatabase()
})
