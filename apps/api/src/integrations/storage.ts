import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { env } from "../lib/env"

function createClient() {
  if (!env.B2_ENDPOINT || !env.B2_KEY_ID || !env.B2_APPLICATION_KEY) {
    return null
  }

  return new S3Client({
    endpoint: env.B2_ENDPOINT,
    region: env.B2_REGION,
    credentials: {
      accessKeyId: env.B2_KEY_ID,
      secretAccessKey: env.B2_APPLICATION_KEY,
    },
    forcePathStyle: true,
  })
}

const client = createClient()

export function isStorageConfigured() {
  return Boolean(client && env.B2_BUCKET)
}

export async function createUploadUrl(key: string, contentType: string) {
  if (!client || !env.B2_BUCKET) {
    throw new Error("Backblaze storage is not configured")
  }

  const command = new PutObjectCommand({
    Bucket: env.B2_BUCKET,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(client, command, { expiresIn: 60 * 15 })
}

export async function createDownloadUrl(key: string) {
  if (env.B2_PUBLIC_URL) {
    return `${env.B2_PUBLIC_URL.replace(/\/$/, "")}/${key}`
  }

  if (!client || !env.B2_BUCKET) {
    return null
  }

  const command = new GetObjectCommand({
    Bucket: env.B2_BUCKET,
    Key: key,
  })

  return getSignedUrl(client, command, { expiresIn: 60 * 60 })
}

export async function resolveAssetUrl(key: string | null | undefined) {
  if (!key) return null
  return createDownloadUrl(key)
}
