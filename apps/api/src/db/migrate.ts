import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import path from "node:path"
import { db } from "./client"
import { env } from "../lib/env"

export function applyMigrations() {
  const migrationsFolder = path.isAbsolute(env.MIGRATIONS_PATH)
    ? env.MIGRATIONS_PATH
    : path.resolve(process.cwd(), env.MIGRATIONS_PATH)

  migrate(db, { migrationsFolder })
  console.log("Migrations applied")
}
