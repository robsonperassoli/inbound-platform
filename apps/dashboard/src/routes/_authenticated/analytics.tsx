import {
  ArrowDownIcon,
  ArrowUpIcon,
  ComputerIcon,
  SmartPhoneIcon,
  UnfoldLessIcon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Temporal } from "@js-temporal/polyfill"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import z from "zod"
import { ScrollableContainer } from "@/components/app-layout/scrollable-container"
import { useSiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAnalyticsOverview } from "@/hooks/queries/analytics"
import { useSelectedProfile } from "@/hooks/use-selected-profile"
import { formatToTinybirdDateTime } from "@/lib/dates"

const periodSchema = z.enum(["today", "7days", "30days", "3months", "6months"])
type TimePeriod = z.infer<typeof periodSchema>

const periodSelectOptions: { label: string; value: TimePeriod }[] = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "7days" },
  { label: "Last 30 Days", value: "30days" },
  { label: "Last 3 Months", value: "3months" },
  { label: "Last 6 Months", value: "6months" },
]

const periodToRangeLabel: Record<TimePeriod, string> = {
  today: "Today",
  "7days": "Last 7 days",
  "30days": "Last 30 days",
  "3months": "Last 3 months",
  "6months": "Last 6 months",
}

const getPeriodDates = (period: TimePeriod) => {
  const end = Temporal.Now.zonedDateTimeISO().with({
    hour: 23,
    minute: 59,
    second: 59,
    millisecond: 999,
  })

  const start = Temporal.Now.zonedDateTimeISO().with({
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  })

  switch (period) {
    case "today": {
      return {
        start,
        end,
      }
    }
    case "7days":
      return {
        start: start.subtract({ days: 7 }),
        end: end,
      }
    case "30days": {
      return {
        start: start.subtract({ days: 30 }),
        end: end,
      }
    }
    case "3months": {
      return {
        start: start.subtract({ days: 90 }),
        end: end,
      }
    }
    case "6months":
      return {
        start: start.subtract({ days: 180 }),
        end: end,
      }
  }
}

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export const Route = createFileRoute("/_authenticated/analytics")({
  component: RouteComponent,
  ssr: false,
  validateSearch: {
    parse: (input: unknown) =>
      z
        .object({
          period: periodSchema.default("7days"),
        })
        .parse(input),
  },
  // loaderDeps: ({ search }) => search,
})

// ============================================================================
// Analytics Header
// ============================================================================

function AnalyticsHeader({
  period,
  onPeriodChange,
}: {
  period: TimePeriod
  onPeriodChange: (period: TimePeriod) => void
}) {
  return (
    <div className="flex justify-end">
      <Select
        value={period}
        onValueChange={(selectedPeriod: TimePeriod) =>
          onPeriodChange(selectedPeriod)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select time range" />
        </SelectTrigger>
        <SelectContent>
          {periodSelectOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ============================================================================
// KPI Cards
// ============================================================================

function KpiCard({
  title,
  value,
  subtitle,
  formatter = numberFormatter,
}: {
  title: string
  value: number
  subtitle: string
  formatter?: Intl.NumberFormat
}) {
  return (
    <Card className="min-h-22">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs">{title}</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          {formatter.format(value)}
        </CardTitle>
        <p className="text-muted-foreground text-xs">{subtitle}</p>
      </CardHeader>
    </Card>
  )
}

function KpiRow({
  overview,
  rangeLabel,
}: {
  overview: {
    total_page_views: number
    unique_visitors: number
    total_link_clicks: number
    average_ctr: number
  } | null
  rangeLabel: string
}) {
  const views = overview?.total_page_views ?? 0
  const visitors = overview?.unique_visitors ?? 0
  const clicks = overview?.total_link_clicks ?? 0
  const ctr = overview?.average_ctr ?? 0

  const showSmallSampleWarning = views > 0 && views < 50

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Views" value={views} subtitle={rangeLabel} />
        <KpiCard title="Visitors" value={visitors} subtitle={rangeLabel} />
        <KpiCard title="Clicks" value={clicks} subtitle={rangeLabel} />
        <KpiCard
          title="CTR"
          value={views === 0 ? 0 : ctr}
          subtitle={rangeLabel}
          formatter={percentFormatter}
        />
      </div>
      {showSmallSampleWarning && (
        <p className="text-muted-foreground text-xs">
          Small sample size—metrics may fluctuate.
        </p>
      )}
    </div>
  )
}

// ============================================================================
// Link Performance Table
// ============================================================================

type SortField = "clicks" | "ctr"
type SortDirection = "asc" | "desc"

function LinkPerformanceCard({
  linkClicks,
  totalViews,
  totalClicks,
  links,
}: {
  linkClicks: Array<{
    link_id: string
    clicks: number
    unique_clickers: number
  }> | null
  totalViews: number
  totalClicks: number
  links: Array<{ id: string; title: string; url?: string | null }>
}) {
  const [sortField, setSortField] = useState<SortField>("clicks")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [showAll, setShowAll] = useState(false)

  const linkMap = useMemo(() => {
    return links.reduce(
      (acc, link) => {
        acc[link.id] = link
        return acc
      },
      {} as Record<string, (typeof links)[0]>,
    )
  }, [links])

  const tableData = useMemo(() => {
    const data =
      linkClicks?.map((lc) => {
        const link = linkMap[lc.link_id]
        const ctr = totalViews > 0 ? lc.clicks / totalViews : 0
        const share = totalClicks > 0 ? lc.clicks / totalClicks : 0
        return {
          id: lc.link_id,
          title: link?.title ?? "Unknown",
          domain: link?.url ?? undefined,
          clicks: lc.clicks,
          ctr,
          share,
          url: link?.url,
        }
      }) ?? []

    return data.sort((a, b) => {
      const aVal = sortField === "clicks" ? a.clicks : a.ctr
      const bVal = sortField === "clicks" ? b.clicks : b.ctr
      return sortDirection === "desc" ? bVal - aVal : aVal - bVal
    })
  }, [linkClicks, linkMap, totalViews, totalClicks, sortField, sortDirection])

  const displayData = showAll ? tableData : tableData.slice(0, 5)
  const hasMore = tableData.length > 5
  const isEmpty = totalClicks === 0

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <HugeiconsIcon
          icon={UnfoldMoreIcon}
          className="ml-1 h-3 w-3 text-muted-foreground/50"
        />
      )
    }
    return sortDirection === "desc" ? (
      <HugeiconsIcon icon={ArrowDownIcon} className="ml-1 h-3 w-3" />
    ) : (
      <HugeiconsIcon icon={ArrowUpIcon} className="ml-1 h-3 w-3" />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Top links</CardTitle>
        <CardDescription className="text-xs">
          Clicks and CTR per link
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground text-sm">No link clicks yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">Link</TableHead>
                  <TableHead
                    className="w-25 cursor-pointer text-right"
                    onClick={() => toggleSort("clicks")}
                  >
                    <div className="flex items-center justify-end">
                      Clicks
                      {getSortIcon("clicks")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-25 cursor-pointer text-right"
                    onClick={() => toggleSort("ctr")}
                  >
                    <div className="flex items-center justify-end">
                      CTR
                      {getSortIcon("ctr")}
                    </div>
                  </TableHead>
                  <TableHead className="w-20 text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((row) => (
                  <TableRow
                    key={row.id}
                    className={row.url ? "cursor-pointer" : undefined}
                  >
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium">{row.title}</div>
                        {row.domain && (
                          <div className="text-muted-foreground text-xs">
                            {row.domain}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {numberFormatter.format(row.clicks)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-between">
                        <span className="w-12 tabular-nums">
                          {percentFormatter.format(row.ctr)}
                        </span>
                        <div className="bg-muted h-1.5 w-12 overflow-hidden rounded-full">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{
                              width: `${Math.min(row.ctr * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {percentFormatter.format(row.share)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {hasMore && !showAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(true)}
                className="w-full"
              >
                View all {tableData.length} links
                <HugeiconsIcon icon={UnfoldMoreIcon} className="ml-1 h-4 w-4" />
              </Button>
            )}
            {showAll && hasMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(false)}
                className="w-full"
              >
                Show less
                <HugeiconsIcon icon={UnfoldLessIcon} className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Device Breakdown
// ============================================================================

function DeviceBreakdownCard({
  deviceBreakdown,
  totalViews,
}: {
  deviceBreakdown: Array<{
    device: string
    views: number
    unique_visitors: number
  }> | null
  totalViews: number
}) {
  const data = useMemo(() => {
    if (!deviceBreakdown || deviceBreakdown.length === 0) return []
    return deviceBreakdown.map((d) => ({
      ...d,
      percent: totalViews > 0 ? d.views / totalViews : 0,
    }))
  }, [deviceBreakdown, totalViews])

  const isEmpty = !deviceBreakdown || deviceBreakdown.length === 0

  const getDeviceIcon = (device: string) => {
    const d = device.toLowerCase()
    if (d === "mobile" || d === "phone") {
      return <HugeiconsIcon icon={SmartPhoneIcon} className="h-4 w-4" />
    }
    return <HugeiconsIcon icon={ComputerIcon} className="h-4 w-4" />
  }

  return (
    <Card className="h-[260px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Devices</CardTitle>
        <CardDescription className="text-xs">
          Views by device type
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground text-sm">No device data yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((device) => (
              <div key={device.device} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(device.device)}
                    <span className="capitalize">{device.device}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground tabular-nums">
                      {numberFormatter.format(device.views)}
                    </span>
                    <span className="w-12 text-right tabular-nums">
                      {percentFormatter.format(device.percent)}
                    </span>
                  </div>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${Math.max(device.percent * 100, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Referrer Breakdown
// ============================================================================

function ReferrerBreakdownCard({
  referrerBreakdown,
  totalViews,
}: {
  referrerBreakdown: Array<{
    referrer: string
    views: number
    unique_visitors: number
  }> | null
  totalViews: number
}) {
  const data = useMemo(() => {
    if (!referrerBreakdown) return []
    // Sort: put "direct" first, then by views desc, then "other" last
    const sorted = [...referrerBreakdown].sort((a, b) => {
      const aLower = a.referrer.toLowerCase()
      const bLower = b.referrer.toLowerCase()
      if (aLower === "direct") return -1
      if (bLower === "direct") return 1
      if (aLower === "other") return 1
      if (bLower === "other") return -1
      return b.views - a.views
    })
    return sorted.slice(0, 5).map((r) => ({
      ...r,
      percent: totalViews > 0 ? r.views / totalViews : 0,
    }))
  }, [referrerBreakdown, totalViews])

  const isEmpty = !referrerBreakdown || referrerBreakdown.length === 0

  const formatReferrer = (referrer: string) => {
    if (referrer.toLowerCase() === "direct") return "Direct"
    // Capitalize first letter of each word
    return referrer
      .split(/[\s_]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  return (
    <Card className="h-65">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Channels</CardTitle>
        <CardDescription className="text-xs">
          Top traffic sources
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No channel data yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((ref) => (
              <div key={ref.referrer} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{formatReferrer(ref.referrer)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground tabular-nums">
                      {numberFormatter.format(ref.views)}
                    </span>
                    <span className="w-12 text-right tabular-nums">
                      {percentFormatter.format(ref.percent)}
                    </span>
                  </div>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${Math.max(ref.percent * 100, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Main Component
// ============================================================================

function RouteComponent() {
  useSiteHeader({ title: "Analytics" })
  const navigate = useNavigate()
  const { period } = Route.useSearch()
  const profileData = useSelectedProfile()
  const links = profileData?.links
  const profile = profileData?.profile

  const dateRange = useMemo(() => getPeriodDates(period), [period])
  const { data: stats } = useAnalyticsOverview({
    period,
    profileId: profile?.id,
    start: formatToTinybirdDateTime(dateRange.start.toInstant()),
    end: formatToTinybirdDateTime(dateRange.end.toInstant()),
    enabled: !!profileData,
  })

  const handlePeriodChange = async (newPeriod: TimePeriod) => {
    await navigate({ to: ".", search: { period: newPeriod } })
  }

  if (!stats || !links) {
    return null
  }

  const totalViews = stats.overview?.total_page_views ?? 0
  const totalClicks = stats.overview?.total_link_clicks ?? 0

  return (
    <ScrollableContainer className="mx-auto w-full max-w-350 space-y-6">
      <AnalyticsHeader period={period} onPeriodChange={handlePeriodChange} />

      <KpiRow
        overview={stats.overview}
        rangeLabel={periodToRangeLabel[period]}
      />

      <LinkPerformanceCard
        linkClicks={stats.linkClicks}
        totalViews={totalViews}
        totalClicks={totalClicks}
        links={links}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <DeviceBreakdownCard
          deviceBreakdown={stats.deviceBreakdown}
          totalViews={totalViews}
        />
        <ReferrerBreakdownCard
          referrerBreakdown={stats.referrerBreakdown}
          totalViews={totalViews}
        />
      </div>
    </ScrollableContainer>
  )
}
