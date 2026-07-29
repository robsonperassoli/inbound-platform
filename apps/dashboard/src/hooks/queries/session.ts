import { useQuery } from "@tanstack/react-query"
import { getSession } from "@/api/session"
import type { Session } from "@/lib/types"
import { queryKeys } from "./keys"

/** Flattened session shape used by dashboard UI components */
export type DashboardSession = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: Session["membership"]["role"]
  accountType: Session["account"]["type"]
  accountId: string
  membership: Session["membership"]
  account: Session["account"]
  user: Session["user"]
  subscribed: boolean
  plan: Session["plan"]
  isSuperUser: boolean
  phoneNumber?: string | null
}

function toDashboardSession(session: Session): DashboardSession {
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.profilePictureUrl,
    role: session.membership.role,
    accountType: session.account.type,
    accountId: session.account.id,
    membership: session.membership,
    account: session.account,
    user: session.user,
    subscribed: session.subscribed,
    plan: session.plan,
    isSuperUser: session.isSuperUser,
    phoneNumber: null,
  }
}

export function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: async () => toDashboardSession(await getSession()),
    retry: false,
  })
}

export function useSession(): DashboardSession | undefined {
  return useSessionQuery().data
}
