import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createProfile,
  generateTheme,
  isUsernameAvailable,
  listProfiles,
  getProfile,
  publishProfile,
  updateProfile,
  type UpdateProfileBody,
} from "@/api/profiles"
import type { Link, Profile } from "@/lib/types"
import { useSelectedProfileId } from "@/stores/profiles"
import { queryKeys } from "./keys"

export function useProfiles() {
  return useQuery({
    queryKey: queryKeys.profiles,
    queryFn: async () => {
      const { profiles } = await listProfiles()
      return profiles
    },
  })
}

export function useProfileWithLinks(
  profileId: string | null | undefined,
  options?: { refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: queryKeys.profile(profileId ?? "none"),
    enabled: Boolean(profileId),
    queryFn: async () => {
      if (!profileId) throw new Error("Missing profile id")
      return getProfile(profileId)
    },
    refetchInterval: options?.refetchInterval,
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
    }: { id: string } & UpdateProfileBody) => updateProfile(id, body),
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
    mutationFn: (id: string) => publishProfile(id),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profiles })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.profile(data.profile.id),
      })
    },
  })
}

export function useGenerateTheme() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => generateTheme(id),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profiles })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.profile(data.profile.id),
      })
    },
  })
}

export function useCreateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProfile,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles }),
  })
}

export function useIsUsernameAvailable() {
  return useMutation({
    mutationFn: async (username: string) => {
      const { available } = await isUsernameAvailable(username)
      return available
    },
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
