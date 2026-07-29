import type { PublicMessage, PublicProfileResponse } from "@inbound/shared"
import { API_URL } from "./config.ts"

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export type PublicLinkDetail = {
  id: string
  title: string
  order: number
  active: boolean
  type: string
  formId: string | null
  url: string | null
  platform: string | null
  profileId: string
}

export type TrackPageViewInput = {
  profileId: string
  visitorId: string
  referrer?: string | null
  referrerName?: string | null
  device?: string | null
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const body = await response.text()
    throw new ApiError(response.status, body || response.statusText)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function getPublicProfile(username: string) {
  return api<PublicProfileResponse>(
    `/public/profiles/${encodeURIComponent(username)}`,
  )
}

export function trackPageView(body: TrackPageViewInput) {
  return api<{ ok: true }>("/public/page-views", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function getPublicLink(linkId: string) {
  return api<PublicLinkDetail>(`/public/links/${encodeURIComponent(linkId)}`)
}

export function trackLinkClick(linkId: string, visitorId = "anonymous") {
  return api<{ url: string | null; type: string }>(
    `/public/links/${encodeURIComponent(linkId)}/click`,
    {
      method: "POST",
      body: JSON.stringify({ visitorId }),
    },
  )
}

export function startFormSession(body: { profileId: string; formId: string }) {
  return api<{ sessionId: string }>("/public/form-sessions", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function getFormSessionMessages(sessionId: string) {
  return api<{ messages: PublicMessage[] }>(
    `/public/form-sessions/${encodeURIComponent(sessionId)}/messages`,
  )
}

export function sendFormSessionMessage(sessionId: string, message: string) {
  return api<{ ok: true }>(
    `/public/form-sessions/${encodeURIComponent(sessionId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
  )
}
