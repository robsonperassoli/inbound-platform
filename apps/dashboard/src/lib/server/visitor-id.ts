import { parse, serialize } from "cookie"

const VISITOR_ID_COOKIE_NAME = "visitor_id"
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

export type VisitorIdResult = {
  visitorId: string
  setCookieHeader?: string
}

export function getOrCreateVisitorId(request: Request): VisitorIdResult {
  const cookies = parse(request.headers.get("cookie") ?? "")
  const existingVisitorId = cookies[VISITOR_ID_COOKIE_NAME]

  if (existingVisitorId) {
    return { visitorId: existingVisitorId }
  }

  const visitorId = crypto.randomUUID()
  const forwardedProto = request.headers.get("x-forwarded-proto")
  const isSecure =
    forwardedProto === "https" || new URL(request.url).protocol === "https:"

  return {
    visitorId,
    setCookieHeader: serialize(VISITOR_ID_COOKIE_NAME, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: ONE_YEAR_IN_SECONDS,
      path: "/",
      secure: isSecure,
    }),
  }
}
