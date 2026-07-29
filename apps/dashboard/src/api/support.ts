import { ApiError, client } from "./client"

export async function sendSupport(message: string) {
  const res = await client.support.$post({ json: { message } })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function sendFeedback(message: string) {
  const res = await client.feedback.$post({ json: { message } })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}
