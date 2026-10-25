import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { WorkOS } from "@workos-inc/node"
import { buildAuthSessionCookies } from "../../apps/api/src/lib/session"
import { missingE2ESecrets } from "./env"
import { repoRoot, sqlitePath, storageStatePath } from "./servers"

const TEST_USER_NAME = "E2E User"
const ORG_EXTERNAL_ID = "inbound-e2e"

export default async function globalSetup() {
  const missing = missingE2ESecrets()
  if (missing.length > 0) {
    throw new Error(
      `Missing ${missing.join(", ")}. Set them in .env or apps/api/.env.local.`,
    )
  }

  resetDatabase()
  run("pnpm", ["--filter", "@inbound/api", "db:migrate"])
  run("pnpm", ["--filter", "@inbound/api", "db:seed"])

  const apiKey = process.env.WORKOS_API_KEY ?? ""
  const clientId = process.env.WORKOS_CLIENT_ID ?? ""
  const email = process.env.E2E_USER_EMAIL ?? ""
  const password = process.env.E2E_USER_PASSWORD ?? ""
  const workos = new WorkOS(apiKey, { clientId })
  const workosUser = await ensureWorkOsUser(workos, email, password)
  const organizationId = await ensureWorkOsOrg(workos, workosUser.id)
  const auth = await authenticate(
    workos,
    clientId,
    email,
    password,
    organizationId,
  )

  const provision = spawnSync(
    "pnpm",
    [
      "--filter",
      "@inbound/api",
      "exec",
      "tsx",
      path.join(repoRoot, "e2e/scripts/provision.ts"),
    ],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        NODE_ENV: "development",
        SQLITE_PATH: sqlitePath,
        CRON_SECRET: "e2e-cron-secret",
        E2E_WORKOS_USER_ID: workosUser.id,
        E2E_USER_EMAIL: email,
        E2E_USER_NAME: TEST_USER_NAME,
      },
      encoding: "utf8",
    },
  )
  if (provision.status !== 0) {
    throw new Error(
      provision.stderr ||
        provision.stdout ||
        "Failed to provision the e2e user",
    )
  }
  const userId = readUserId(provision.stdout)
  writeStorageState(userId, auth.accessToken)
}

function resetDatabase() {
  for (const suffix of ["", "-wal", "-shm"]) {
    fs.rmSync(`${sqlitePath}${suffix}`, { force: true })
  }
}

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      NODE_ENV: "development",
      SQLITE_PATH: sqlitePath,
      CRON_SECRET: "e2e-cron-secret",
    },
    encoding: "utf8",
  })
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} failed`)
  }
}

async function ensureWorkOsUser(
  workos: WorkOS,
  email: string,
  password: string,
) {
  const listed = await workos.userManagement.listUsers({ email })
  const existing = listed.data.find(
    (user) => user.email.toLowerCase() === email.toLowerCase(),
  )
  if (!existing) {
    return workos.userManagement.createUser({
      email,
      password,
      firstName: "E2E",
      lastName: "User",
      emailVerified: true,
    })
  }
  return workos.userManagement.updateUser({
    userId: existing.id,
    firstName: "E2E",
    lastName: "User",
    emailVerified: true,
    password,
  })
}

async function ensureWorkOsOrg(workos: WorkOS, userId: string) {
  let organizationId: string
  try {
    const existing =
      await workos.organizations.getOrganizationByExternalId(ORG_EXTERNAL_ID)
    organizationId = existing.id
  } catch {
    const created = await workos.organizations.createOrganization({
      name: "Inbound E2E",
      externalId: ORG_EXTERNAL_ID,
    })
    organizationId = created.id
  }

  const memberships = await workos.userManagement.listOrganizationMemberships({
    userId,
  })
  const joined = memberships.data.some(
    (membership) => membership.organizationId === organizationId,
  )
  if (!joined) {
    await workos.userManagement.createOrganizationMembership({
      userId,
      organizationId,
    })
  }
  return organizationId
}

async function authenticate(
  workos: WorkOS,
  clientId: string,
  email: string,
  password: string,
  organizationId: string,
) {
  try {
    return await workos.userManagement.authenticateWithPassword({
      clientId,
      email,
      password,
    })
  } catch (error) {
    const pending = pendingAuthenticationToken(error)
    if (!pending) throw error
    return workos.userManagement.authenticateWithOrganizationSelection({
      clientId,
      organizationId,
      pendingAuthenticationToken: pending,
    })
  }
}

function pendingAuthenticationToken(error: unknown) {
  if (!error || typeof error !== "object" || !("rawData" in error)) return
  const raw = error.rawData
  if (!raw || typeof raw !== "object") return
  const token = (raw as { pending_authentication_token?: unknown })
    .pending_authentication_token
  return typeof token === "string" ? token : undefined
}

function readUserId(output: string) {
  const line = output
    .split("\n")
    .map((entry) => entry.trim())
    .findLast((entry) => entry.startsWith("{"))
  if (!line)
    throw new Error(`Provision script did not print a user id:\n${output}`)
  const parsed: unknown = JSON.parse(line)
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("userId" in parsed) ||
    typeof parsed.userId !== "string" ||
    !parsed.userId
  ) {
    throw new Error(`Provision script returned an invalid user id:\n${output}`)
  }
  return parsed.userId
}

function writeStorageState(userId: string, accessToken: string) {
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  const cookies = buildAuthSessionCookies({
    userId,
    accessToken,
    nodeEnv: "development",
  }).map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    domain: "localhost",
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    expires,
  }))
  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true })
  fs.writeFileSync(
    storageStatePath,
    JSON.stringify({ cookies, origins: [] }, null, 2),
  )
}
