import { api } from "./client"

export function presignUpload(key: string, contentType: string) {
  return api<{ url: string; key: string }>("/uploads/presign", {
    method: "POST",
    body: JSON.stringify({ key, contentType }),
  })
}
