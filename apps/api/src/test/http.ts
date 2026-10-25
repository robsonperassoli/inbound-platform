import { testClient } from "hono/testing"
import { app } from "../app"
import { SESSION_COOKIE } from "../lib/session"

export const client = testClient(app)

function sessionCookie(userId: string) {
  return `${SESSION_COOKIE}=${userId}`
}

/** Second-arg options for Hono client calls with a session cookie. */
export function withAuth(userId: string) {
  return {
    headers: {
      Cookie: sessionCookie(userId),
    },
  }
}
