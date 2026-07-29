import { redirect } from "@tanstack/react-router"
import { ApiError } from "@/api/client"
import { getSession } from "@/api/session"
import { API_URL } from "@/lib/config"

/** SPA auth gate — relies on API session cookie from WorkOS callback */
export async function ensureAuthenticated(returnPathname: string) {
  try {
    await getSession()
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
