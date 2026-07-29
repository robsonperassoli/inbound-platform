import { useQuery } from "@tanstack/react-query"
import { analyticsOverview } from "@/api/analytics"
import { queryKeys } from "./keys"

export function useAnalyticsOverview({
  period,
  profileId,
  start,
  end,
  enabled = true,
}: {
  period: string
  profileId: string | undefined
  start: string
  end: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: queryKeys.analytics(period, profileId),
    enabled: enabled && Boolean(profileId),
    queryFn: async () => {
      if (!profileId) throw new Error("Profile not selected")
      return analyticsOverview({
        profileId,
        startDate: start,
        endDate: end,
      })
    },
  })
}
