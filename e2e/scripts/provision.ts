import * as accounts from "../../apps/api/src/domains/accounts/index.ts"
import * as billing from "../../apps/api/src/domains/billing/index.ts"
import { sqlite } from "../../apps/api/src/db/client.ts"

const authId = process.env.E2E_WORKOS_USER_ID
const email = process.env.E2E_USER_EMAIL
const name = process.env.E2E_USER_NAME ?? "E2E User"

if (!authId || !email) {
  throw new Error("E2E_WORKOS_USER_ID and E2E_USER_EMAIL are required")
}

const user = await accounts.ensureUserFromWorkOS({ authId, email, name })
if (!user) throw new Error("Failed to provision user")

const scope = await accounts.getAuthScope(user.id)
if (!scope.ok) throw new Error(`Failed to load account: ${scope.reason}`)

await billing.syncSubscription({
  accountId: scope.scope.account.id,
  stripeCustomerId: "cus_e2e_local",
  stripeSubscriptionId: "sub_e2e_local",
  status: "active",
  priceId: "price_e2e_local",
  planType: "pro",
})

sqlite
  .prepare("update forms set user_id = ? where title = ?")
  .run(user.id, "Contact me")

console.log(JSON.stringify({ userId: user.id }))
sqlite.close()
