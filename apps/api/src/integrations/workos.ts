import { WorkOS } from "@workos-inc/node"
import * as accounts from "../domains/accounts/index"
import { env } from "../lib/env"

export function getWorkOS() {
  if (!env.WORKOS_API_KEY || !env.WORKOS_CLIENT_ID) return null
  return new WorkOS(env.WORKOS_API_KEY, { clientId: env.WORKOS_CLIENT_ID })
}

export async function ensureUserFromWorkOS(input: {
  authId: string
  email?: string | null
  name?: string | null
  profilePictureUrl?: string | null
}) {
  return accounts.ensureUserFromWorkOS(input)
}

export function getAuthorizationUrl(redirectUri: string, state?: string) {
  const workos = getWorkOS()
  if (!workos || !env.WORKOS_CLIENT_ID) {
    throw new Error("WorkOS is not configured")
  }

  return workos.userManagement.getAuthorizationUrl({
    provider: "authkit",
    redirectUri,
    clientId: env.WORKOS_CLIENT_ID,
    state,
  })
}

export async function authenticateWithCode(code: string) {
  const workos = getWorkOS()
  if (!workos || !env.WORKOS_CLIENT_ID) {
    throw new Error("WorkOS is not configured")
  }

  return workos.userManagement.authenticateWithCode({
    code,
    clientId: env.WORKOS_CLIENT_ID,
  })
}

export { getWorkOsSessionIdFromAccessToken } from "../lib/session"

export function getWorkOsLogoutUrl(sessionId: string, returnTo?: string) {
  const workos = getWorkOS()
  if (!workos) {
    throw new Error("WorkOS is not configured")
  }

  return workos.userManagement.getLogoutUrl({
    sessionId,
    returnTo,
  })
}
