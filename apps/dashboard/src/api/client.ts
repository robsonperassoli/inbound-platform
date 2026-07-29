import { hc } from "hono/client"
import type { AppType, PricingPlanId } from "@inbound/api"
import { API_URL } from "@/lib/config"

export type { PricingPlanId }

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export const client = hc<AppType>(API_URL, {
  init: {
    credentials: "include",
  },
})
