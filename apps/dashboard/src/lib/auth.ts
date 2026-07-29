import { redirect } from "@tanstack/react-router"
import { apiClient, API_URL, ApiError } from "@/lib/api"

/** SPA auth gate — relies on API session cookie from WorkOS callback */
export async function ensureAuthenticated(returnPathname: string) {
  try {
    await apiClient.getSession()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw redirect({
        to: "/signin",
        search: { returnPathname, workos: undefined },
      })
    }
    throw redirect({
      to: "/signin",
      search: { returnPathname, workos: undefined },
    })
  }
}

export function getWorkOsLoginUrl() {
  return `${API_URL}/auth/login`
}
