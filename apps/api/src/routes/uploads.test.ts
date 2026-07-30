import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../integrations/storage.ts", () => ({
  createUploadUrl: vi.fn(async (key: string) => `https://upload.example.com/${key}`),
  resolveAssetUrl: vi.fn(async () => null),
}))

import { createUploadUrl } from "../integrations/storage"
import { createUserAccount } from "../test/factories"
import { client, withAuth } from "../test/http"

describe("uploads routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns a presigned upload URL", async () => {
    const { user } = await createUserAccount()
    const res = await client.uploads.presign.$post(
      {
        json: {
          key: "avatars/user.png",
          contentType: "image/png",
        },
      },
      withAuth(user.id),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      url: "https://upload.example.com/avatars/user.png",
      key: "avatars/user.png",
    })
    expect(createUploadUrl).toHaveBeenCalledWith(
      "avatars/user.png",
      "image/png",
    )
  })
})
