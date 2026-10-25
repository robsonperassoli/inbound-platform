import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
)

export const E2E_SECRET_NAMES = [
  "WORKOS_API_KEY",
  "WORKOS_CLIENT_ID",
  "E2E_USER_EMAIL",
  "E2E_USER_PASSWORD",
] as const

const envFiles = [
  path.join(repoRoot, ".env"),
  path.join(repoRoot, ".env.local"),
  path.join(repoRoot, "apps/api/.env.local"),
  path.join(repoRoot, "e2e/.env"),
]

function unquote(value: string) {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseEnvFile(file: string) {
  const entries: Array<[string, string]> = []
  if (!fs.existsSync(file)) return entries
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq <= 0) continue
    entries.push([trimmed.slice(0, eq).trim(), unquote(trimmed.slice(eq + 1))])
  }
  return entries
}

const secretNames = new Set<string>(E2E_SECRET_NAMES)

/** Fill WorkOS e2e vars from the local env files. Existing non-empty process env wins. */
export function loadE2EEnv() {
  const locked = new Set<string>(
    E2E_SECRET_NAMES.filter((name) => process.env[name]?.trim()),
  )
  for (const file of envFiles) {
    for (const [key, value] of parseEnvFile(file)) {
      if (!locked.has(key) && value.trim() && secretNames.has(key)) {
        process.env[key] = value
      }
    }
  }
}

export function missingE2ESecrets() {
  return E2E_SECRET_NAMES.filter((name) => !process.env[name]?.trim())
}
