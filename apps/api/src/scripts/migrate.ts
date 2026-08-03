import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import path from "node:path"
import { db, sqlite } from "../db/client"
import { env } from "../lib/env"

const migrationsFolder = path.isAbsolute(env.MIGRATIONS_PATH)
  ? env.MIGRATIONS_PATH
  : path.resolve(process.cwd(), env.MIGRATIONS_PATH)

migrate(db, { migrationsFolder })
console.log("Migrations applied")
sqlite.close()
