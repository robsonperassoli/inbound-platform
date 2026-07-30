import { testClient } from "hono/testing"
import { app } from "../app"

export const client = testClient(app)

export function sessionCookie(userId: string) {
  return `inbound_session=${userId}`
}

/** Second-arg options for Hono client calls with a session cookie. */
export function withAuth(userId: string) {
  return {
    headers: {
      Cookie: sessionCookie(userId),
    },
  }
}
