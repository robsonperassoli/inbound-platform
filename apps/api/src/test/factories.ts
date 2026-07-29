import { createId } from "@inbound/shared"
import * as accounts from "../domains/accounts/index.ts"
import * as forms from "../domains/forms/index.ts"
import * as profiles from "../domains/profiles/index.ts"

export async function createUserAccount(input?: {
  authId?: string
  email?: string
  name?: string
  accountType?: "individual" | "team"
}) {
  const authId = input?.authId ?? `auth_${createId()}`
  const email = input?.email ?? `${authId}@example.com`
  const name = input?.name ?? "Test User"

  const user = await accounts.ensureUserFromWorkOS({
    authId,
    email,
    name,
  })

  if (!user) {
    throw new Error("Failed to create user account")
  }

  if (input?.accountType === "team") {
    const scope = await accounts.getAuthScope(user.id)
    if (!scope.ok) {
      throw new Error(`Failed to resolve auth scope: ${scope.reason}`)
    }
    await accounts.setAccountType(scope.scope.account.id, "team")
  }

  const scope = await accounts.getAuthScope(user.id)
  if (!scope.ok) {
    throw new Error(`Failed to resolve auth scope: ${scope.reason}`)
  }

  return {
    user: scope.scope.user,
    account: scope.scope.account,
    membership: scope.scope.membership,
  }
}

export async function createProfileForAccount(input?: {
  accountId?: string
  userId?: string
  username?: string
  title?: string
  bio?: string
}) {
  const owner =
    input?.accountId && input?.userId
      ? null
      : await createUserAccount()

  const accountId = input?.accountId ?? owner!.account.id
  const userId = input?.userId ?? owner!.user.id
  const username = input?.username ?? `user_${createId().slice(0, 8)}`

  const profile = await profiles.createProfile({
    accountId,
    userId,
    username,
    title: input?.title ?? "Test Profile",
    bio: input?.bio,
  })

  return {
    user: owner?.user ?? { id: userId },
    account: owner?.account ?? { id: accountId },
    membership: owner?.membership,
    profile,
  }
}

export async function createFormForAccount(input?: {
  userId?: string
  title?: string
  description?: string
  fields?: Array<{
    id: string
    type: string
    label: string
    required: boolean
    options?: string[]
  }>
}) {
  const owner = input?.userId ? null : await createUserAccount()
  const userId = input?.userId ?? owner!.user.id

  const form = await forms.createFormForUser({
    userId,
    title: input?.title ?? "Lead Form",
    description: input?.description ?? "Capture leads",
    fields: input?.fields ?? [
      {
        id: "email",
        type: "email",
        label: "Email",
        required: true,
      },
    ],
  })

  return {
    user: owner?.user ?? { id: userId },
    account: owner?.account,
    membership: owner?.membership,
    form,
  }
}
