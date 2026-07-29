import { env } from "../lib/env"

type IngestRow = Record<string, string | number | boolean | null>

async function ingest(datasource: string, rows: IngestRow[]) {
  if (!env.TINYBIRD_API_URL || !env.TINYBIRD_TOKEN) {
    console.info(`[tinybird:dev] ${datasource}`, rows)
    return { successful_rows: rows.length }
  }

  const response = await fetch(
    `${env.TINYBIRD_API_URL.replace(/\/$/, "")}/v0/events?name=${datasource}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.TINYBIRD_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: rows.map((row) => JSON.stringify(row)).join("\n"),
    },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Tinybird ingest failed: ${text}`)
  }

  return response.json()
}

export async function ingestPageView(row: {
  profile_id: string
  visitor_id: string
  timestamp: string
  referrer: string | null
  referrer_name: string | null
  device: string | null
}) {
  return ingest("page_views", [row])
}

export async function ingestLinkClick(row: {
  profile_id: string
  visitor_id: string
  link_id: string
  timestamp: string
}) {
  return ingest("link_clicks", [row])
}

export async function queryTinybirdEndpoint(
  endpoint: string,
  params: Record<string, string>,
): Promise<{ data?: Array<Record<string, unknown>> }> {
  if (!env.TINYBIRD_API_URL || !env.TINYBIRD_TOKEN) {
    return { data: [] }
  }

  const url = new URL(
    `${env.TINYBIRD_API_URL.replace(/\/$/, "")}/v0/pipes/${endpoint}.json`,
  )
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${env.TINYBIRD_TOKEN}` },
  })

  if (!response.ok) {
    throw new Error(`Tinybird query failed: ${await response.text()}`)
  }

  return (await response.json()) as { data?: Array<Record<string, unknown>> }
}
