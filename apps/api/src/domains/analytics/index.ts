import * as repository from "./repository"

function formatTinybirdTimestamp(date = new Date()) {
  return date.toISOString().replace("T", " ").slice(0, 19)
}

export async function recordPageView(input: {
  profileId: string
  visitorId: string
  referrer?: string | null
  referrerName?: string | null
  device?: string | null
  timestamp?: string
}) {
  return repository.insertPageView({
    profile_id: input.profileId,
    visitor_id: input.visitorId,
    timestamp: input.timestamp ?? formatTinybirdTimestamp(),
    referrer: input.referrer ?? null,
    referrer_name: input.referrerName ?? null,
    device: input.device ?? null,
  })
}

export async function recordLinkClick(input: {
  profileId: string
  visitorId: string
  linkId: string
  timestamp?: string
}) {
  return repository.insertLinkClick({
    profile_id: input.profileId,
    visitor_id: input.visitorId,
    link_id: input.linkId,
    timestamp: input.timestamp ?? formatTinybirdTimestamp(),
  })
}

export async function getOverview(input: {
  profileId: string
  startDate: string
  endDate: string
}) {
  const params = {
    profile_id: input.profileId,
    start_date: input.startDate,
    end_date: input.endDate,
  }

  const [overview, linkClicks, deviceBreakdown, referrerBreakdown] =
    await Promise.all([
      repository.queryOverview(params),
      repository.queryLinkClicksByLink({
        ...params,
        limit: 10,
        offset: 0,
      }),
      repository.queryDeviceBreakdown({
        ...params,
        limit: 10,
      }),
      repository.queryReferrerBreakdown({
        ...params,
        limit: 20,
      }),
    ])

  return {
    overview: overview.data[0] ?? null,
    linkClicks: linkClicks.data ?? null,
    deviceBreakdown: deviceBreakdown.data ?? null,
    referrerBreakdown: referrerBreakdown.data ?? null,
  }
}
