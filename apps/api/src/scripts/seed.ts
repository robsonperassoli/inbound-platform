import { createId, getDefaultTheme } from "@inbound/shared"
import { eq } from "drizzle-orm"
import { db, sqlite } from "../db/client.ts"
import {
  accountMembers,
  accounts,
  forms,
  links,
  profiles,
  users,
} from "../db/schema.ts"

async function seed() {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, "dev@inbound.click"),
  })
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

  await db.insert(users).values({
    id: userId,
    authId: "dev_dev@inbound.click",
    email: "dev@inbound.click",
    name: "Dev User",
  })

  await db.insert(accounts).values({
    id: accountId,
    type: "individual",
  })

  await db.insert(accountMembers).values({
    id: createId(),
    accountId,
    userId,
    role: "owner",
    profiles: ["all"],
    joinedAt: now,
  })

  await db.insert(profiles).values({
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

  await db.insert(forms).values({
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

  await db.insert(links).values([
    {
      id: createId(),
      userId,
      profileId,
      title: "My Website",
      type: "url",
      url: "https://inbound.click",
      order: 0,
      active: true,
    },
    {
      id: createId(),
      userId,
      profileId,
      title: "Contact",
      type: "form",
      formId,
      order: 1,
      active: true,
    },
    {
      id: createId(),
      userId,
      profileId,
      title: "Instagram",
      type: "social",
      platform: "instagram",
      url: "https://instagram.com/demo",
      order: 2,
      active: true,
    },
  ])

  console.log("Seeded demo user/profile at /demo")
}

await seed()
sqlite.close()
