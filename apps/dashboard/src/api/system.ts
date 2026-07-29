import { api } from "./client"

export type SystemUser = {
  userId: string
  accountId: string
  accountType: "team" | "individual" | null
  name: string
  email: string
  role: "owner" | "admin" | "member"
  canSetupStripe: boolean
}

export function listSystemUsers() {
  return api<{ users: SystemUser[] }>("/system/users")
}
