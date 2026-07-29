import { createId, getDefaultTheme } from "@inbound/shared"
import * as accounts from "../domains/accounts/index"
import * as forms from "../domains/forms/index"
import * as profiles from "../domains/profiles/index"
import { sqlite } from "../db/client"

async function seed() {
  const existing = await accounts.getUserByEmail("dev@inbound.click")
  if (existing) {
    console.log("Seed already applied")
    return
  }

  const userId = createId()
  const accountId = createId()
  const profileId = createId()
  const formId = createId()
  const theme = getDefaultTheme()
  const now = Date.now()

  await accounts.createUser({
    id: userId,
    authId: "dev_dev@inbound.click",
    email: "dev@inbound.click",
    name: "Dev User",
  })

  await accounts.createAccount({
    id: accountId,
    type: "individual",
  })

  await accounts.createMembership({
    accountId,
    userId,
    role: "owner",
    profiles: ["all"],
    joinedAt: now,
  })

  await profiles.insertProfile({
    id: profileId,
    accountId,
    userId,
    username: "demo",
    title: "Demo Creator",
    bio: "Welcome to my inbound bio page.",
    publishedAt: now,
    theme: theme.name,
    backgroundColor: theme.backgroundColor,
    fontFamily: theme.fontFamily,
    textColor: theme.textColor,
    buttonShape: theme.buttonShape,
    buttonStyle: theme.buttonStyle,
    buttonColor: theme.buttonColor,
    buttonTextColor: theme.buttonTextColor,
    createdAt: now,
    updatedAt: now,
  })

  await forms.insertForm({
    id: formId,
    userId,
    title: "Contact me",
    description: "Say hello",
    fields: [
      {
        id: "name",
        type: "shortText",
        label: "Name",
        required: true,
      },
      {
        id: "email",
        type: "email",
        label: "Email",
        required: true,
      },
    ],
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  })

  await profiles.insertLink({
    userId,
    profileId,
    title: "My Website",
    type: "url",
    url: "https://inbound.click",
    order: 0,
    active: true,
  })
  await profiles.insertLink({
    userId,
    profileId,
    title: "Contact",
    type: "form",
    formId,
    order: 1,
    active: true,
  })
  await profiles.insertLink({
    userId,
    profileId,
    title: "Instagram",
    type: "social",
    platform: "instagram",
    url: "https://instagram.com/demo",
    order: 2,
    active: true,
  })

  console.log("Seeded demo user/profile at /demo")
}

await seed()
sqlite.close()
