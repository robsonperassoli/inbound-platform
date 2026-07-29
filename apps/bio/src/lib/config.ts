function env(
  keys: { vite: string; node: string },
  fallback: string,
): string {
  if (typeof process !== "undefined" && process.env[keys.node]) {
    return process.env[keys.node]!
  }
  if (typeof import.meta !== "undefined" && import.meta.env?.[keys.vite]) {
    return import.meta.env[keys.vite] as string
  }
  return fallback
}

export const API_URL = env(
  { vite: "VITE_API_URL", node: "API_URL" },
  "http://localhost:8787",
)

export const BIO_URL = env(
  { vite: "VITE_BIO_URL", node: "BIO_URL" },
  "http://localhost:3001",
)
