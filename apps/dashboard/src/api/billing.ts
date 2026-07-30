import type { InferRequestType } from "hono/client"
import { ApiError, client } from "./client"

export async function createCheckout(
  input: InferRequestType<typeof client.billing.checkout.$post>["json"],
) {
  const res = await client.billing.checkout.$post({ json: input })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function createPortal() {
  const res = await client.billing.portal.$post()
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function submitSalesLead(
  input: InferRequestType<(typeof client.billing)["sales-lead"]["$post"]>["json"],
) {
  const res = await client.billing["sales-lead"].$post({ json: input })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}
