/**
 * Tinybird Definitions
 *
 * Define your datasources, endpoints, and client here.
 */

import {
  defineDatasource,
  defineEndpoint,
  engine,
  type InferOutputRow,
  type InferParams,
  type InferRow,
  node,
  p,
  Tinybird,
  t,
} from "@tinybirdco/sdk"

// ============================================================================
// Datasources
// ============================================================================

/**
 * Page views datasource - tracks page view events
 */
export const pageViews = defineDatasource("page_views", {
  description: "Page view tracking data",
  schema: {
    profile_id: t.string(),
    visitor_id: t.string(),
    timestamp: t.dateTime(),
    referrer: t.string().nullable(),
    referrer_name: t.string().nullable(),
    device: t.string().nullable(),
  },
  engine: engine.mergeTree({
    sortingKey: ["profile_id", "timestamp"],
  }),
})

export type PageViewsRow = InferRow<typeof pageViews>

/**
 * Link click datasource - tracks bio page link clicks
 */
export const linkClicks = defineDatasource("link_clicks", {
  description: "Link click tracking data",
  schema: {
    profile_id: t.string(),
    visitor_id: t.string(),
    link_id: t.string(),
    timestamp: t.dateTime(),
  },
  engine: engine.mergeTree({
    sortingKey: ["profile_id", "link_id", "timestamp"],
  }),
})

export type LinkClickRow = InferRow<typeof linkClicks>

// ============================================================================
// Endpoints
// ============================================================================

export const overview = defineEndpoint("overview", {
  description:
    "Overview metrics: total page views, unique visitors, total link clicks, average CTR",
  params: {
    profile_id: p.string(),
    start_date: p.dateTime(),
    end_date: p.dateTime(),
  },
  nodes: [
    node({
      name: "views",
      sql: `
        SELECT
          profile_id,
          count() AS total_page_views,
          uniqExact(visitor_id) AS unique_visitors
        FROM page_views
        WHERE profile_id = {{String(profile_id)}}
          AND timestamp >= {{DateTime(start_date)}}
          AND timestamp <= {{DateTime(end_date)}}
        GROUP BY profile_id
      `,
    }),
    node({
      name: "clicks",
      sql: `
        SELECT
          profile_id,
          count() AS total_link_clicks
        FROM link_clicks
        WHERE profile_id = {{String(profile_id)}}
          AND timestamp >= {{DateTime(start_date)}}
          AND timestamp <= {{DateTime(end_date)}}
        GROUP BY profile_id
      `,
    }),
    node({
      name: "final",
      sql: `
        SELECT
          coalesce(v.profile_id, c.profile_id) AS profile_id,
          coalesce(v.total_page_views, 0) AS total_page_views,
          coalesce(v.unique_visitors, 0) AS unique_visitors,
          coalesce(c.total_link_clicks, 0) AS total_link_clicks,
          if(coalesce(v.total_page_views, 0) = 0,
             0,
             coalesce(c.total_link_clicks, 0) / coalesce(v.total_page_views, 0)
          ) AS average_ctr
        FROM views v
        FULL OUTER JOIN clicks c USING (profile_id)
      `,
    }),
  ],
  output: {
    profile_id: t.string(),
    total_page_views: t.uint64(),
    unique_visitors: t.uint64(),
    total_link_clicks: t.uint64(),
    average_ctr: t.float64(),
  },
})

export type OverviewParams = InferParams<typeof overview>
export type OverviewOutput = InferOutputRow<typeof overview>

export const linkClicksByLink = defineEndpoint("link_clicks_by_link", {
  description: "Total clicks per link in a time range",
  params: {
    profile_id: p.string(),
    start_date: p.dateTime(),
    end_date: p.dateTime(),
    limit: p.int32(),
    offset: p.int32(),
  },
  nodes: [
    node({
      name: "by_link",
      sql: `
        SELECT
          link_id,
          count() AS clicks,
          uniqExact(visitor_id) AS unique_clickers
        FROM link_clicks
        WHERE profile_id = {{String(profile_id)}}
          AND timestamp >= {{DateTime(start_date)}}
          AND timestamp <= {{DateTime(end_date)}}
        GROUP BY link_id
        ORDER BY clicks DESC
        LIMIT {{Int32(limit)}}
        OFFSET {{Int32(offset)}}
      `,
    }),
  ],
  output: {
    link_id: t.string(),
    clicks: t.uint64(),
    unique_clickers: t.uint64(),
  },
})

export const referrerBreakdown = defineEndpoint("referrer_breakdown", {
  description: "Break down page views by referrer",
  params: {
    profile_id: p.string(),
    start_date: p.dateTime(),
    end_date: p.dateTime(),
    limit: p.int32(),
  },
  nodes: [
    node({
      name: "referrers",
      sql: `
        SELECT
          coalesce(referrer_name, 'direct') AS referrer,
          count() AS views,
          uniqExact(visitor_id) AS unique_visitors
        FROM page_views
        WHERE profile_id = {{String(profile_id)}}
          AND timestamp >= {{DateTime(start_date)}}
          AND timestamp <= {{DateTime(end_date)}}
        GROUP BY referrer_name
        ORDER BY views DESC
        LIMIT {{Int32(limit)}}
      `,
    }),
  ],
  output: {
    referrer: t.string(),
    views: t.uint64(),
    unique_visitors: t.uint64(),
  },
})

export const deviceBreakdown = defineEndpoint("device_breakdown", {
  description: "Break down page views by device",
  params: {
    profile_id: p.string(),
    start_date: p.dateTime(),
    end_date: p.dateTime(),
    limit: p.int32(),
  },
  nodes: [
    node({
      name: "devices",
      sql: `
        SELECT
          coalesce(device, 'unknown') AS device,
          count() AS views,
          uniqExact(visitor_id) AS unique_visitors
        FROM page_views
        WHERE profile_id = {{String(profile_id)}}
          AND timestamp >= {{DateTime(start_date)}}
          AND timestamp <= {{DateTime(end_date)}}
        GROUP BY device
        ORDER BY views DESC
        LIMIT {{Int32(limit)}}
      `,
    }),
  ],
  output: {
    device: t.string(),
    views: t.uint64(),
    unique_visitors: t.uint64(),
  },
})

// ============================================================================
// Client
// ============================================================================

export const tinybird = new Tinybird({
  datasources: {
    pageViews,
    linkClicks,
  },
  pipes: {
    overview,
    linkClicksByLink,
    referrerBreakdown,
    deviceBreakdown,
  },
})
