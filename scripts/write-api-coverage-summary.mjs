import fs from "node:fs"

const summaryFile = process.env.GITHUB_STEP_SUMMARY
if (!summaryFile) process.exit(0)

const coveragePath = new URL(
  "../apps/api/coverage/coverage-summary.json",
  import.meta.url,
)

if (!fs.existsSync(coveragePath)) {
  fs.appendFileSync(
    summaryFile,
    "### API coverage\n\nCoverage summary was not produced.\n",
  )
  process.exit(0)
}

const summary = JSON.parse(fs.readFileSync(coveragePath, "utf8"))
const total = summary.total
const metrics = ["lines", "statements", "functions", "branches"]

const rows = metrics.map((metric) => {
  const row = total[metric]
  return `| ${metric} | ${row.pct}% | ${row.covered}/${row.total} |`
})

fs.appendFileSync(
  summaryFile,
  [
    "### API coverage",
    "",
    "| Metric | Coverage | Covered |",
    "| --- | ---: | ---: |",
    ...rows,
    "",
  ].join("\n"),
)
