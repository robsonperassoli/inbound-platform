import { useQuery } from "@tanstack/react-query"
import { listSystemUsers } from "@/api/system"
import { queryKeys } from "./keys"

export function useSystemUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.systemUsers,
    enabled,
    queryFn: async () => (await listSystemUsers()).users,
  })
}
