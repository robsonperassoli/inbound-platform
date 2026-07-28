import type {
  ButtonShape,
  ButtonStyle,
  LinkType,
  SocialPlatform,
} from "@inbound/shared"

/** Dashboard/bio profile shape returned by the API */
export type Profile = {
  id: string
  accountId: string | null
  userId: string
  username: string
  title: string
  bio: string
  avatarKey: string | null
  backgroundImageKey: string | null
  avatarUrl: string | null
  backgroundImageUrl: string | null
  publishedAt: number | null
  theme: string
  backgroundColor: string
  fontFamily: string
  textColor: string
  buttonShape: ButtonShape
  buttonStyle: ButtonStyle
  buttonColor: string
  buttonTextColor: string
  createdAt: number
  updatedAt: number
}

export type Link = {
  id: string
  userId: string
  profileId: string
  title: string
  order: number
  active: boolean
  type: LinkType
  formId: string | null
  url: string | null
  platform: SocialPlatform | null
  createdAt: number
}

export type Form = {
  id: string
  userId: string
  title: string
  description: string | null
  fields: Array<{
    id: string
    type: string
    label: string
    required: boolean
    options?: string[]
  }>
  publishedAt: number | null
  createdAt: number
  updatedAt: number
}

export type SessionUser = {
  id: string
  authId: string | null
  email: string | null
  name: string | null
  profilePictureUrl: string | null
}

export type Session = {
  user: SessionUser
  account: { id: string; type: "team" | "individual" }
  membership: {
    id: string
    accountId: string
    userId: string
    role: "owner" | "admin" | "member"
    profiles: string[]
  }
  subscribed: boolean
  plan: "free" | "starter" | "pro" | "team"
  isSuperUser: boolean
}
