import { Temporal } from "@js-temporal/polyfill"
import { describe, expect, it } from "vitest"
import { formatToLocalDateTime, formatToTinybirdDateTime } from "./dates"

describe("formatToTinybirdDateTime", () => {
  it("formats a UTC instant as a zero-padded Tinybird datetime", () => {
    const instant = Temporal.Instant.from("2024-01-02T03:04:05Z")

    expect(formatToTinybirdDateTime(instant)).toBe("2024-01-02 03:04:05")
  })

  it("keeps the clock in UTC when the instant is not on a UTC hour boundary", () => {
    const instant = Temporal.Instant.from("2024-03-09T23:59:58Z")

    expect(formatToTinybirdDateTime(instant)).toBe("2024-03-09 23:59:58")
  })
})

describe("formatToLocalDateTime", () => {
  it("formats epoch milliseconds with en-US short date and medium time in the local zone", () => {
    const epoch = Date.UTC(2024, 6, 4, 18, 30, 0)
    const expected = Temporal.Instant.fromEpochMilliseconds(epoch)
      .toZonedDateTimeISO(Temporal.Now.timeZoneId())
      .toLocaleString("en-US", {
        dateStyle: "short",
        timeStyle: "medium",
      })

    expect(formatToLocalDateTime(epoch)).toBe(expected)
    expect(expected).toMatch(/\d/)
    expect(expected).toContain(":")
  })
})
