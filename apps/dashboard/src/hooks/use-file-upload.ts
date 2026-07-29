import { useCallback, useState } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { createId } from "@inbound/shared"

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)

  const uploadFile = useCallback(async (file: File) => {
    try {
      setUploading(true)
      const key = `uploads/${createId()}-${file.name.replace(/\s+/g, "-")}`
      const { url } = await apiClient.presignUpload(key, file.type || "application/octet-stream")

      const result = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      })

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`)
      }

      // Match the old Convex shape consumers expect: `{ storageId }`
      return { storageId: key, key }
    } catch (err) {
      console.error(err)
      toast.error("Failed to upload image")
      throw err
    } finally {
      setUploading(false)
    }
  }, [])

  return { uploading, uploadFile }
}
