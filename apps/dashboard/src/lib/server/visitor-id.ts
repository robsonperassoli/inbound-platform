const VISITOR_ID_COOKIE_NAME = "visitor_id"
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

export type VisitorIdResult = {
  visitorId: string
  setCookieHeader?: string
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {}
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => {
        const [rawKey, ...rest] = part.trim().split("=")
        if (!rawKey) return null
        return [rawKey, decodeURIComponent(rest.join("=") || "")] as const
      })
      .filter((entry) => entry !== null),
  )
}

export function getOrCreateVisitorId(request: Request): VisitorIdResult {
  const cookies = parseCookies(request.headers.get("cookie"))
  const existingVisitorId = cookies[VISITOR_ID_COOKIE_NAME]

  if (existingVisitorId) {
    return { visitorId: existingVisitorId }
  }

  const visitorId = crypto.randomUUID()
  const forwardedProto = request.headers.get("x-forwarded-proto")
  const isSecure =
    forwardedProto === "https" || new URL(request.url).protocol === "https:"

  const parts = [
    `${VISITOR_ID_COOKIE_NAME}=${encodeURIComponent(visitorId)}`,
    "Path=/",
    `Max-Age=${ONE_YEAR_IN_SECONDS}`,
    "SameSite=Lax",
    "HttpOnly",
  ]
  if (isSecure) parts.push("Secure")

  return {
    visitorId,
    setCookieHeader: parts.join("; "),
  }
}
