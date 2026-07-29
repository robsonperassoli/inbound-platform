export const queryKeys = {
  session: ["session"] as const,
  profiles: ["profiles"] as const,
  profile: (id: string) => ["profile", id] as const,
  forms: ["forms"] as const,
  form: (id: string) => ["form", id] as const,
  submissions: (formId: string) => ["submissions", formId] as const,
  transcript: (formId: string, submissionId: string) =>
    ["transcript", formId, submissionId] as const,
  thread: (id: string) => ["thread", id] as const,
  formSessionMessages: (sessionId: string) =>
    ["form-session-messages", sessionId] as const,
  teamMembers: ["team", "members"] as const,
  teamInvitations: ["team", "invitations"] as const,
  teamProfiles: ["team", "profiles"] as const,
  invitation: (token: string) => ["invitation", token] as const,
  systemUsers: ["system", "users"] as const,
  analytics: (period: string, profileId: string | undefined) =>
    ["stats", period, profileId] as const,
}
