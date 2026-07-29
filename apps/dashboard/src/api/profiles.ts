import type { Link, Profile } from "@/lib/types"
import { api } from "./client"

export function listProfiles() {
  return api<{ profiles: Profile[] }>("/profiles")
}

export function checkUsernameAvailability(username: string) {
  return api<{ available: boolean }>(
    `/profiles/username-available?${new URLSearchParams({ username })}`,
  )
}

export function isUsernameAvailable(username: string) {
  return api<{ available: boolean }>(
    `/profiles/username-available?username=${encodeURIComponent(username)}`,
  )
}

export function getProfile(id: string) {
  return api<{ profile: Profile; links: Link[] }>(`/profiles/${id}`)
}

export function createProfile(body: {
  username: string
  title: string
  bio?: string
}) {
  return api<{ profile: Profile }>("/profiles", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export type UpdateProfileBody = Partial<{
  title: string
  bio: string
  theme: string
  backgroundColor: string
  fontFamily: string
  textColor: string
  buttonShape: Profile["buttonShape"]
  buttonStyle: Profile["buttonStyle"]
  buttonColor: string
  buttonTextColor: string
  avatarKey: string | null
  backgroundImageKey: string | null
  publishedAt: number | null
}>

export function updateProfile(id: string, body: UpdateProfileBody) {
  return api<{ profile: Profile }>(`/profiles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function publishProfile(id: string) {
  return api<{ profile: Profile }>(`/profiles/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ publishedAt: Date.now() }),
  })
}
