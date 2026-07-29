import { API_URL } from "./config.ts"
import type { Form, Link, Profile, Session } from "./types.ts"

export type FormSubmission = {
  id: string
  formId: string
  values: Record<string, string | number | boolean | null>
  createdAt: number
  completedAt: number | null
}

export type ThreadMessage = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: number
  status?: "pending" | "complete" | "streaming" | "error"
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  })

  if (!response.ok) {
    const body = await response.text()
    throw new ApiError(response.status, body || response.statusText)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const apiClient = {
  getSession: () => api<Session>("/me"),
  listProfiles: () => api<{ profiles: Profile[] }>("/profiles"),
  checkUsernameAvailability: (username: string) =>
    api<{ available: boolean }>(
      `/profiles/username-available?${new URLSearchParams({ username })}`,
    ),
  isUsernameAvailable: (username: string) =>
    api<{ available: boolean }>(
      `/profiles/username-available?username=${encodeURIComponent(username)}`,
    ),
  getProfile: (id: string) =>
    api<{ profile: Profile; links: Link[] }>(`/profiles/${id}`),
  createProfile: (body: { username: string; title: string; bio?: string }) =>
    api<{ profile: Profile }>("/profiles", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateProfile: (
    id: string,
    body: Partial<{
      title: string
      bio: string
      theme: string
      backgroundColor: string
      fontFamily: string
      textColor: string
      buttonShape: Profile["buttonShape"]
      buttonStyle: Profile["buttonStyle"]
      buttonColor: string
      buttonTextColor: string
      avatarKey: string | null
      backgroundImageKey: string | null
      publishedAt: number | null
    }>,
  ) =>
    api<{ profile: Profile }>(`/profiles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  publishProfile: (id: string) =>
    api<{ profile: Profile }>(`/profiles/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ publishedAt: Date.now() }),
    }),
  createLink: (
    profileId: string,
    body: {
      title: string
      type: Link["type"]
      url?: string
      platform?: Link["platform"]
      formId?: string
      order?: number
      active?: boolean
    },
  ) =>
    api<{ link: Link }>(`/profiles/${profileId}/links`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateLink: (
    id: string,
    body: Partial<{
      title: string
      url: string | null
      order: number
      active: boolean
      platform: Link["platform"]
      formId: string | null
    }>,
  ) =>
    api<{ link: Link }>(`/links/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteLink: (id: string) =>
    api<{ ok: true }>(`/links/${id}`, { method: "DELETE" }),
  listForms: () => api<{ forms: Form[] }>("/forms"),
  getForm: (id: string) => api<{ form: Form }>(`/forms/${id}`),
  createForm: (body: {
    title: string
    description?: string
    fields?: Form["fields"]
  }) =>
    api<{ form: Form }>("/forms", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateForm: (
    id: string,
    body: Partial<{
      title: string
      description: string | null
      fields: Form["fields"]
      publishedAt: number | null
    }>,
  ) =>
    api<{ form: Form }>(`/forms/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  listSubmissions: (formId: string) =>
    api<{ submissions: FormSubmission[] }>(`/forms/${formId}/submissions`),
  updateFormFields: (id: string, fields: Form["fields"]) =>
    api<{ form: Form }>(`/forms/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ fields }),
    }),
  startThemeDesigner: (profileId: string) =>
    api<{ threadId: string }>("/threads/theme-designer", {
      method: "POST",
      body: JSON.stringify({ profileId }),
    }),
  startFormBuilder: (profileId?: string) =>
    api<{ threadId: string }>("/threads/form-builder", {
      method: "POST",
      body: JSON.stringify({ profileId }),
    }),
  getThreadMessages: (threadId: string) =>
    api<{
      thread: {
        id: string
        type: "formSubmission" | "formBuilder" | "themeDesigner"
        formId: string | null
        profileId: string | null
      }
      messages: ThreadMessage[]
    }>(`/threads/${threadId}/messages`),
  sendThreadMessage: (threadId: string, message: string) =>
    api<{ ok: true }>(`/threads/${threadId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  startFormSession: (body: {
    profileId: string
    formId: string
    linkId?: string
  }) =>
    api<{ sessionId: string }>("/public/form-sessions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getFormSessionMessages: (sessionId: string) =>
    api<{ messages: ThreadMessage[] }>(
      `/public/form-sessions/${sessionId}/messages`,
    ),
  sendFormSessionMessage: (sessionId: string, message: string) =>
    api<{ ok: true }>(`/public/form-sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  createCheckout: (input: {
    plan: "starter" | "pro"
    cycle: "monthly" | "yearly"
  }) =>
    api<{ sessionId: string; url: string | null }>("/billing/checkout", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  createPortal: () =>
    api<{ url: string }>("/billing/portal", { method: "POST" }),
  analyticsOverview: (params: {
    profileId: string
    startDate: string
    endDate: string
  }) => {
    const q = new URLSearchParams(params)
    return api<unknown>(`/analytics/overview?${q}`)
  },
  sendSupport: (message: string) =>
    api<{ ok: true }>("/support", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  sendFeedback: (message: string) =>
    api<{ ok: true }>("/feedback", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  presignUpload: (key: string, contentType: string) =>
    api<{ url: string; key: string }>("/uploads/presign", {
      method: "POST",
      body: JSON.stringify({ key, contentType }),
    }),
  logout: () =>
    api<{ ok: true }>("/auth/logout", {
      method: "POST",
      body: "{}",
    }),
  listTeamMembers: () =>
    api<{
      members: Array<{
        membershipId: string
        userId: string
        email: string
        name: string
        role: "owner" | "admin" | "member"
        profiles: string[]
        joinedAt: number
      }>
    }>("/team/members"),
  listTeamInvitations: () =>
    api<{
      invitations: Array<{
        invitationId: string
        email: string
        role: "owner" | "admin" | "member"
        profiles: string[]
        expiresAt: number
        invitedByName: string
      }>
    }>("/team/invitations"),
  listTeamProfiles: () =>
    api<{
      profiles: Array<{ id: string; title: string; username: string }>
    }>("/team/profiles"),
  createTeamInvitation: (body: {
    email: string
    role: "admin" | "member" | "owner"
    profiles: string[]
  }) =>
    api<{ invitationId: string; token: string; expiresAt: number }>(
      "/team/invitations",
      { method: "POST", body: JSON.stringify(body) },
    ),
  resendTeamInvitation: (invitationId: string) =>
    api<{ invitationId: string; token: string; expiresAt: number }>(
      `/team/invitations/${invitationId}/resend`,
      { method: "POST", body: "{}" },
    ),
  revokeTeamInvitation: (invitationId: string) =>
    api<{ ok: true }>(`/team/invitations/${invitationId}`, {
      method: "DELETE",
    }),
  updateTeamMemberPermissions: (
    membershipId: string,
    body: { profiles: string[] },
  ) =>
    api<{ ok: true }>(`/team/members/${membershipId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getInvitationByToken: (token: string) =>
    api<
      | {
          status: "valid"
          email: string
          role: "owner" | "admin" | "member"
          invitedByName: string
        }
      | { status: "invalid"; message: string }
    >(`/invitations/${token}`),
  acceptInvitation: (token: string) =>
    api<{ ok: true }>(`/invitations/${token}/accept`, {
      method: "POST",
      body: "{}",
    }),
  listSystemUsers: () =>
    api<{
      users: Array<{
        userId: string
        accountId: string
        accountType: "team" | "individual" | null
        name: string
        email: string
        role: "owner" | "admin" | "member"
        canSetupStripe: boolean
      }>
    }>("/system/users"),
  reorderLinks: (profileId: string, linkIds: string[]) =>
    api<{ ok: true }>(`/profiles/${profileId}/links/reorder`, {
      method: "POST",
      body: JSON.stringify({ linkIds }),
    }),
  getSubmissionTranscript: (formId: string, submissionId: string) =>
    api<{
      submission: FormSubmission
      messages: Array<{
        id: string
        role: "user" | "assistant" | "system"
        content: string
        createdAt: number
        status: string
      }>
    }>(`/forms/${formId}/submissions/${submissionId}/transcript`),
}
