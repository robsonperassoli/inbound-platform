import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function S3Client(
    this: { config: unknown },
    config: unknown,
  ) {
    this.config = config
  }),
  PutObjectCommand: vi.fn(function PutObjectCommand(
    this: { input: unknown },
    input: unknown,
  ) {
    this.input = input
  }),
  GetObjectCommand: vi.fn(function GetObjectCommand(
    this: { input: unknown },
    input: unknown,
  ) {
    this.input = input
  }),
}))

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async () => "https://signed.example/object"),
}))

import { S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const B2_KEYS = [
  "B2_ENDPOINT",
  "B2_REGION",
  "B2_BUCKET",
  "B2_KEY_ID",
  "B2_APPLICATION_KEY",
  "B2_PUBLIC_URL",
] as const

async function loadStorage(
  overrides: Partial<Record<(typeof B2_KEYS)[number], string>> = {},
) {
  for (const key of B2_KEYS) delete process.env[key]
  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value
  }
  vi.resetModules()
  return import("./storage")
}

describe("storage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    for (const key of B2_KEYS) delete process.env[key]
  })

  it("is unconfigured and refuses uploads when credentials are missing", async () => {
    const storage = await loadStorage()

    expect(storage.isStorageConfigured()).toBe(false)
    await expect(storage.createUploadUrl("a.png", "image/png")).rejects.toThrow(
      /not configured/,
    )
    await expect(storage.createDownloadUrl("a.png")).resolves.toBeNull()
    await expect(storage.resolveAssetUrl(null)).resolves.toBeNull()
    await expect(storage.resolveAssetUrl("")).resolves.toBeNull()
    expect(S3Client).not.toHaveBeenCalled()
  })

  it("builds a public download URL without signing", async () => {
    const storage = await loadStorage({
      B2_PUBLIC_URL: "https://cdn.example/bucket/",
    })

    await expect(storage.createDownloadUrl("avatars/a.png")).resolves.toBe(
      "https://cdn.example/bucket/avatars/a.png",
    )
    await expect(storage.resolveAssetUrl("avatars/a.png")).resolves.toBe(
      "https://cdn.example/bucket/avatars/a.png",
    )
    expect(getSignedUrl).not.toHaveBeenCalled()
  })

  it("signs uploads and downloads when Backblaze is configured", async () => {
    const storage = await loadStorage({
      B2_ENDPOINT: "https://s3.example",
      B2_KEY_ID: "key",
      B2_APPLICATION_KEY: "secret",
      B2_BUCKET: "bucket",
    })

    expect(storage.isStorageConfigured()).toBe(true)
    expect(S3Client).toHaveBeenCalledWith({
      endpoint: "https://s3.example",
      region: "us-west-002",
      credentials: {
        accessKeyId: "key",
        secretAccessKey: "secret",
      },
      forcePathStyle: true,
    })

    await expect(storage.createUploadUrl("a.png", "image/png")).resolves.toBe(
      "https://signed.example/object",
    )
    await expect(storage.createDownloadUrl("a.png")).resolves.toBe(
      "https://signed.example/object",
    )

    expect(getSignedUrl).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        input: {
          Bucket: "bucket",
          Key: "a.png",
          ContentType: "image/png",
        },
      }),
      { expiresIn: 60 * 15 },
    )
    expect(getSignedUrl).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        input: { Bucket: "bucket", Key: "a.png" },
      }),
      { expiresIn: 60 * 60 },
    )
  })

  it("treats a client without a bucket as unconfigured", async () => {
    const storage = await loadStorage({
      B2_ENDPOINT: "https://s3.example",
      B2_KEY_ID: "key",
      B2_APPLICATION_KEY: "secret",
      B2_REGION: "eu-central-003",
    })

    expect(storage.isStorageConfigured()).toBe(false)
    expect(S3Client).toHaveBeenCalledWith(
      expect.objectContaining({ region: "eu-central-003" }),
    )
    await expect(storage.createUploadUrl("a.png", "image/png")).rejects.toThrow(
      /not configured/,
    )
    await expect(storage.createDownloadUrl("a.png")).resolves.toBeNull()
  })
})
