import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@workos-inc/node", () => {
  const userManagement = {
    getAuthorizationUrl: vi.fn(() => "https://workos.example/authorize"),
    authenticateWithCode: vi.fn(async () => ({ accessToken: "tok" })),
    getLogoutUrl: vi.fn(() => "https://workos.example/logout"),
  }

  return {
    WorkOS: vi.fn(
      function WorkOS(this: { userManagement: typeof userManagement }) {
        this.userManagement = userManagement
      },
    ),
  }
})

import { WorkOS } from "@workos-inc/node"

type WorkOsClient = {
  userManagement: {
    getAuthorizationUrl: ReturnType<typeof vi.fn>
    authenticateWithCode: ReturnType<typeof vi.fn>
    getLogoutUrl: ReturnType<typeof vi.fn>
  }
}

function workOsSdk() {
  const client = vi.mocked(WorkOS).mock.instances[0] as unknown as WorkOsClient
  return client.userManagement
}
import { env } from "../lib/env"
import {
  authenticateWithCode,
  ensureUserFromWorkOS,
  getAuthorizationUrl,
  getWorkOS,
  getWorkOsLogoutUrl,
  getWorkOsSessionIdFromAccessToken,
} from "./workos"
import * as accountsRepo from "../domains/accounts/repository"

const previous = {
  WORKOS_API_KEY: env.WORKOS_API_KEY,
  WORKOS_CLIENT_ID: env.WORKOS_CLIENT_ID,
}

function token(payload: unknown) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `header.${body}.signature`
}

describe("workos integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    env.WORKOS_API_KEY = undefined
    env.WORKOS_CLIENT_ID = undefined
  })

  afterEach(() => {
    env.WORKOS_API_KEY = previous.WORKOS_API_KEY
    env.WORKOS_CLIENT_ID = previous.WORKOS_CLIENT_ID
  })

  it("stays unconfigured until both the API key and client id are set", () => {
    expect(getWorkOS()).toBeNull()

    env.WORKOS_API_KEY = "sk_test"
    expect(getWorkOS()).toBeNull()

    env.WORKOS_CLIENT_ID = "client_test"
    const client = getWorkOS()
    expect(client).not.toBeNull()
    expect(WorkOS).toHaveBeenCalledWith("sk_test", { clientId: "client_test" })
  })

  it("refuses auth URLs, code exchange, and logout when unconfigured", async () => {
    expect(() => getAuthorizationUrl("https://app.example/callback")).toThrow(
      /not configured/,
    )
    await expect(authenticateWithCode("code")).rejects.toThrow(/not configured/)
    expect(() => getWorkOsLogoutUrl("sess_1")).toThrow(/not configured/)
    expect(WorkOS).not.toHaveBeenCalled()
  })

  it("delegates authorize, code exchange, and logout to the SDK", async () => {
    env.WORKOS_API_KEY = "sk_test"
    env.WORKOS_CLIENT_ID = "client_test"

    expect(getAuthorizationUrl("https://app.example/callback", "state_1")).toBe(
      "https://workos.example/authorize",
    )
    await expect(authenticateWithCode("code_1")).resolves.toEqual({
      accessToken: "tok",
    })
    expect(getWorkOsLogoutUrl("sess_1", "https://app.example")).toBe(
      "https://workos.example/logout",
    )

    expect(workOsSdk().getAuthorizationUrl).toHaveBeenCalledWith({
      provider: "authkit",
      redirectUri: "https://app.example/callback",
      clientId: "client_test",
      state: "state_1",
    })
    expect(workOsSdk().authenticateWithCode).toHaveBeenCalledWith({
      code: "code_1",
      clientId: "client_test",
    })
    expect(workOsSdk().getLogoutUrl).toHaveBeenCalledWith({
      sessionId: "sess_1",
      returnTo: "https://app.example",
    })
  })

  it("reads the WorkOS session id from an access token", () => {
    expect(getWorkOsSessionIdFromAccessToken(null)).toBeNull()
    expect(getWorkOsSessionIdFromAccessToken(undefined)).toBeNull()
    expect(getWorkOsSessionIdFromAccessToken("not-a-jwt")).toBeNull()
    expect(getWorkOsSessionIdFromAccessToken("header.")).toBeNull()
    expect(getWorkOsSessionIdFromAccessToken("header.%%%")).toBeNull()
    expect(
      getWorkOsSessionIdFromAccessToken(token({ sub: "user_1" })),
    ).toBeNull()
    expect(getWorkOsSessionIdFromAccessToken(token({ sid: 12 }))).toBeNull()
    expect(getWorkOsSessionIdFromAccessToken(token({ sid: "sess_1" }))).toBe(
      "sess_1",
    )
  })

  it("creates a local user from a WorkOS profile", async () => {
    const user = await ensureUserFromWorkOS({
      authId: "workos_user_1",
      email: "ada@example.com",
      name: "Ada",
    })

    const loaded = await accountsRepo.getUserByAuthId("workos_user_1")
    expect(loaded?.id).toBe(user?.id)
    expect(loaded?.email).toBe("ada@example.com")
  })
})
