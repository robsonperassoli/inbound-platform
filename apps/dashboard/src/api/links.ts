import type { Link } from "@/lib/types"
import { api } from "./client"

export type CreateLinkBody = {
  title: string
  type: Link["type"]
  url?: string
  platform?: Link["platform"]
  formId?: string
  order?: number
  active?: boolean
}

export function createLink(profileId: string, body: CreateLinkBody) {
  return api<{ link: Link }>(`/profiles/${profileId}/links`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export type UpdateLinkBody = Partial<{
  title: string
  url: string | null
  order: number
  active: boolean
  platform: Link["platform"]
  formId: string | null
}>

export function updateLink(id: string, body: UpdateLinkBody) {
  return api<{ link: Link }>(`/links/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function deleteLink(id: string) {
  return api<{ ok: true }>(`/links/${id}`, { method: "DELETE" })
}

export function reorderLinks(profileId: string, linkIds: string[]) {
  return api<{ ok: true }>(`/profiles/${profileId}/links/reorder`, {
    method: "POST",
    body: JSON.stringify({ linkIds }),
  })
}
