import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createLink,
  deleteLink,
  reorderLinks,
  updateLink,
  type CreateLinkBody,
  type UpdateLinkBody,
} from "@/api/links"
import { queryKeys } from "./keys"

export function useCreateLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      profileId,
      ...body
    }: { profileId: string } & CreateLinkBody) => createLink(profileId, body),
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
      profileId: _profileId,
      ...body
    }: {
      id: string
      profileId: string
    } & UpdateLinkBody) => updateLink(id, body),
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
    mutationFn: ({ id }: { id: string; profileId: string }) => deleteLink(id),
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
      await reorderLinks(profileId, orderedIds)
      return { profileId }
    },
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.profile(vars.profileId),
      })
    },
  })
}
