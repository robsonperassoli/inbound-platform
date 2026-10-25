import fs from "node:fs"
import path from "node:path"
import {
  generateSQLiteDrizzleJson,
  generateSQLiteMigration,
  type DrizzleSQLiteSnapshotJSON,
} from "drizzle-kit/api"

function readJson(filePath: string): unknown {
  const parsed: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"))
  return parsed
}

function latestSnapshotIndex(migrationsFolder: string) {
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json")
  const journal = readJson(journalPath)
  if (
    typeof journal !== "object" ||
    journal === null ||
    !("entries" in journal)
  ) {
    throw new Error(`No Drizzle migrations found in ${migrationsFolder}`)
  }
  if (!Array.isArray(journal.entries) || journal.entries.length === 0) {
    throw new Error(`No Drizzle migrations found in ${migrationsFolder}`)
  }

  const latest: unknown = journal.entries.at(-1)
  if (
    typeof latest !== "object" ||
    latest === null ||
    !("idx" in latest) ||
    typeof latest.idx !== "number"
  ) {
    throw new Error(`No Drizzle migrations found in ${migrationsFolder}`)
  }

  return latest.idx
}

export function latestSnapshotPath(migrationsFolder: string) {
  const idx = latestSnapshotIndex(migrationsFolder)
  return path.join(
    migrationsFolder,
    "meta",
    `${String(idx).padStart(4, "0")}_snapshot.json`,
  )
}

function readSnapshot(snapshotPath: string): DrizzleSQLiteSnapshotJSON {
  const snapshot = readJson(snapshotPath)
  if (
    typeof snapshot === "object" &&
    snapshot !== null &&
    "id" in snapshot &&
    typeof snapshot.id === "string"
  ) {
    return snapshot
  }

  throw new Error(`Drizzle snapshot ${snapshotPath} is missing id`)
}

function schemaImports(schema: object) {
  return Object.fromEntries(Object.entries(schema))
}

/** SQL `db:generate` would write for `schema` against the latest snapshot. */
export async function pendingMigrationStatements(
  schema: object,
  migrationsFolder: string,
) {
  const snapshotPath = latestSnapshotPath(migrationsFolder)
  const prev = readSnapshot(snapshotPath)
  const next = await generateSQLiteDrizzleJson(schemaImports(schema), prev.id)
  const statements = await generateSQLiteMigration(prev, next)
  return statements.filter((statement) => statement.trim().length > 0)
}

export async function assertSchemaMatchesMigrations(
  schema: object,
  migrationsFolder: string,
) {
  const statements = await pendingMigrationStatements(schema, migrationsFolder)
  if (statements.length === 0) return

  throw new Error(
    [
      "Drizzle schema does not match the committed migrations.",
      "pnpm db:generate would create a new migration:",
      ...statements,
    ].join("\n"),
  )
}
