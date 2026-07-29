import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { env } from "../lib/env.ts"
import * as schema from "./schema.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../",
)

function resolveSqlitePath() {
  const configured = env.SQLITE_PATH
  if (configured === ":memory:") {
    return ":memory:"
  }

  return path.isAbsolute(configured)
    ? configured
    : path.resolve(repoRoot, configured)
}

export function createSqliteConnection(sqlitePath = resolveSqlitePath()) {
  if (sqlitePath !== ":memory:") {
    fs.mkdirSync(path.dirname(sqlitePath), { recursive: true })
  }

  const sqlite = new Database(sqlitePath)
  if (sqlitePath !== ":memory:") {
    sqlite.pragma("journal_mode = WAL")
  }
  sqlite.pragma("busy_timeout = 5000")
  sqlite.pragma("foreign_keys = ON")
  sqlite.pragma("synchronous = NORMAL")

  return { sqlite, sqlitePath }
}

const { sqlite, sqlitePath } = createSqliteConnection()

export const db = drizzle(sqlite, { schema })
export { schema, sqlite, sqlitePath }
