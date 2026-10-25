import { createId } from "@inbound/shared"
import * as accounts from "../domains/accounts/index"
import * as billing from "../domains/billing/index"
import { isE2EHarnessEnabled } from "./e2e-harness"

export const E2E_USER_EMAIL = "e2e@inbound.click"
export const E2E_SEED_EMAIL = "dev@inbound.click"

export type E2EPersona = "stable" | "fresh" | "seed"

export function parseE2EPersona(value: string | undefined): E2EPersona {
  if (value === "fresh" || value === "seed") return value
  return "stable"
}

export async function resolveE2ELoginUser(persona: E2EPersona) {
  if (!isE2EHarnessEnabled()) {
    throw new Error("E2E login is disabled")
  }

  if (persona === "seed") {
    const user = await accounts.getUserByEmail(E2E_SEED_EMAIL)
    if (!user) {
      throw new Error("Seed user is not available")
    }
    return user
  }

  if (persona === "fresh") {
    return createHarnessUser({
      email: `e2e-fresh-${createId()}@inbound.click`,
      name: "E2E User",
      authId: `e2e_fresh_${createId()}`,
    })
  }

  const existing = await accounts.getUserByEmail(E2E_USER_EMAIL)
  if (existing) return existing

  return createHarnessUser({
    email: E2E_USER_EMAIL,
    name: "E2E User",
    authId: "e2e_e2e@inbound.click",
  })
}

async function createHarnessUser(input: {
  email: string
  name: string
  authId: string
}) {
  const user = await accounts.createUser({
    authId: input.authId,
    email: input.email,
    name: input.name,
  })
  const account = await accounts.createAccount({ type: "individual" })
  await accounts.createMembership({
    accountId: account.id,
    userId: user.id,
    role: "owner",
    profiles: ["all"],
  })

  // Local subscription row so publish works without calling Stripe.
  await billing.syncSubscription({
    accountId: account.id,
    stripeCustomerId: `cus_e2e_${user.id}`,
    stripeSubscriptionId: `sub_e2e_${user.id}`,
    status: "active",
    priceId: "price_e2e_local",
    planType: "pro",
  })

  return user
}
