export function apiUrl() {
  if (typeof process !== "undefined" && process.env.API_URL) {
    return process.env.API_URL
  }
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string
  }
  return "http://localhost:8787"
}
