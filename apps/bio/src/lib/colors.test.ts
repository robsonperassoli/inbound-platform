import { describe, expect, it } from "vitest"
import { getRelativeLuminance, hexToRgb } from "./colors"

describe("hexToRgb", () => {
  it("expands three-digit hex and accepts a leading hash", () => {
    expect(hexToRgb("#abc")).toEqual({ r: 0xaa, g: 0xbb, b: 0xcc })
    expect(hexToRgb(" #fff ")).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb("#1E293B")).toEqual({ r: 30, g: 41, b: 59 })
  })

  it("rejects values that are not 3 or 6 hex digits", () => {
    expect(hexToRgb("#ffff")).toBeNull()
    expect(hexToRgb("gggggg")).toBeNull()
    expect(hexToRgb("")).toBeNull()
  })
})

describe("getRelativeLuminance", () => {
  it("returns the sRGB ends of the scale and a known blue", () => {
    expect(getRelativeLuminance("#000000")).toBe(0)
    expect(getRelativeLuminance("#FFFFFF")).toBe(1)
    expect(getRelativeLuminance("#0000ff")).toBeCloseTo(0.0722, 4)
  })

  it("treats an unreadable color as light so text stays dark", () => {
    expect(getRelativeLuminance("nope")).toBe(1)
    expect(getRelativeLuminance("#12")).toBe(1)
  })
})
