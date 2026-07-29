import { ApiError, client } from "./client"

export async function presignUpload(key: string, contentType: string) {
  const res = await client.uploads.presign.$post({
    json: { key, contentType },
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}
