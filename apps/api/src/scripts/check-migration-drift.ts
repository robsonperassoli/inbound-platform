import path from "node:path"
import { fileURLToPath } from "node:url"
import * as schema from "../db/schema"
import { assertSchemaMatchesMigrations } from "../db/migration-drift"

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../drizzle",
)

await assertSchemaMatchesMigrations(schema, migrationsFolder)
