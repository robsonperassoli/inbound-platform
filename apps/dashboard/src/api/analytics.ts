import { api } from "./client"

export function analyticsOverview(params: {
  profileId: string
  startDate: string
  endDate: string
}) {
  const q = new URLSearchParams(params)
  return api<unknown>(`/analytics/overview?${q}`)
}
