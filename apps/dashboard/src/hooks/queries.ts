import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import type { Form, Link, Profile } from "@/lib/types"
import { useSelectedProfileId } from "@/stores/profiles"

export const queryKeys = {
  session: ["session"] as const,
  profiles: ["profiles"] as const,
  profile: (id: string) => ["profile", id] as const,
  forms: ["forms"] as const,
  form: (id: string) => ["form", id] as const,
  submissions: (formId: string) => ["submissions", formId] as const,
  thread: (id: string) => ["thread", id] as const,
}

export function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: () => apiClient.getSession(),
    retry: false,
  })
}

export function useProfiles() {
  return useQuery({
    queryKey: queryKeys.profiles,
    queryFn: async () => {
      const { profiles } = await apiClient.listProfiles()
      return profiles
    },
  })
}

export function useProfileWithLinks(profileId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.profile(profileId ?? "none"),
    enabled: Boolean(profileId),
    queryFn: async () => {
      if (!profileId) throw new Error("Missing profile id")
      return apiClient.getProfile(profileId)
    },
  })
}

export function useSelectedProfile() {
  const profileId = useSelectedProfileId()
  const query = useProfileWithLinks(profileId)
  return query.data ?? null
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: string } & Parameters<typeof apiClient.updateProfile>[1]) =>
      apiClient.updateProfile(id, body),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profiles })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.profile(data.profile.id),
      })
    },
  })
}

export function usePublishProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.publishProfile(id),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profiles })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.profile(data.profile.id),
      })
    },
  })
}

export function useCreateLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      profileId,
      ...body
    }: { profileId: string } & Parameters<typeof apiClient.createLink>[1]) =>
      apiClient.createLink(profileId, body),
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.profile(vars.profileId),
      })
    },
  })
}

export function useUpdateLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string
      profileId: string
    } & Parameters<typeof apiClient.updateLink>[1]) => {
      const { profileId: _, ...rest } = body as {
        profileId: string
      } & Parameters<typeof apiClient.updateLink>[1]
      return apiClient.updateLink(id, rest)
    },
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.profile(vars.profileId),
      })
    },
  })
}

export function useDeleteLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; profileId: string }) =>
      apiClient.deleteLink(id),
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.profile(vars.profileId),
      })
    },
  })
}

export function useReorderLinks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      profileId,
      orderedIds,
    }: {
      profileId: string
      orderedIds: string[]
    }) => {
      await apiClient.reorderLinks(profileId, orderedIds)
      return { profileId }
    },
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.profile(vars.profileId),
      })
    },
  })
}

export function useForms() {
  return useQuery({
    queryKey: queryKeys.forms,
    queryFn: async () => {
      const { forms } = await apiClient.listForms()
      return forms
    },
  })
}

export function useForm(formId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.form(formId ?? "none"),
    enabled: Boolean(formId),
    queryFn: async () => {
      if (!formId) throw new Error("Missing form id")
      return (await apiClient.getForm(formId)).form
    },
  })
}

export function useFormSubmissions(formId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.submissions(formId ?? "none"),
    enabled: Boolean(formId),
    queryFn: async () => {
      if (!formId) throw new Error("Missing form id")
      return (await apiClient.listSubmissions(formId)).submissions
    },
  })
}

export function useThread(threadId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.thread(threadId ?? "none"),
    enabled: Boolean(threadId),
    queryFn: async () => {
      if (!threadId) throw new Error("Missing thread id")
      return apiClient.getThreadMessages(threadId)
    },
    refetchInterval: (query) => {
      const messages = query.state.data?.messages
      if (!messages) return false
      return messages.some(
        (m: { status?: string }) => m.status === "streaming",
      )
        ? 500
        : false
    },
  })
}

export function useCreateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.createProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.profiles }),
  })
}

export function useCreateForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.createForm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.forms }),
  })
}

export function useUpdateTheme() {
  return useUpdateProfile()
}

export function useUpdateForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Parameters<typeof apiClient.updateForm>[1]) =>
      apiClient.updateForm(id, body),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.forms })
      void queryClient.invalidateQueries({ queryKey: queryKeys.form(data.form.id) })
    },
  })
}

export function useSaveFormFields() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: Form["fields"] }) =>
      apiClient.updateFormFields(id, fields),
    onSuccess: (data) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.form(data.form.id) }),
  })
}

export function toUserPageProfile(profile: Profile) {
  return {
    title: profile.title,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    backgroundImageUrl: profile.backgroundImageUrl,
    backgroundColor: profile.backgroundColor,
    fontFamily: profile.fontFamily,
    textColor: profile.textColor,
    buttonShape: profile.buttonShape,
    buttonStyle: profile.buttonStyle,
    buttonColor: profile.buttonColor,
    buttonTextColor: profile.buttonTextColor,
  }
}

export function toUserPageLinks(links: Link[]) {
  return links.map((link) => ({
    id: link.id,
    type: link.type,
    title: link.title,
    url: link.url ?? undefined,
    formId: link.formId ?? undefined,
    platform: link.platform ?? undefined,
  }))
}
