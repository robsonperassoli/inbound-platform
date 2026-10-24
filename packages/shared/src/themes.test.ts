import { describe, expect, it } from "vitest"
import { buttonShapeSchema, buttonStyleSchema } from "./schemas/index"
import {
  basicThemes,
  fonts,
  getDefaultTheme,
  getUserPageFontClassName,
  getUserPageFontTracking,
  themes,
} from "./themes"

describe("themes", () => {
  it("keeps theme names unique and basic themes as the leading set", () => {
    const names = themes.map((theme) => theme.name)

    expect(new Set(names).size).toBe(names.length)
    expect(themes.slice(0, basicThemes.length)).toEqual(basicThemes)
  })

  it("points every theme at a known font and a valid button treatment", () => {
    const fontNames = new Set(fonts.map((font) => font.name))

    for (const theme of themes) {
      expect(fontNames.has(theme.fontFamily)).toBe(true)
      expect(buttonShapeSchema.safeParse(theme.buttonShape).success).toBe(true)
      expect(buttonStyleSchema.safeParse(theme.buttonStyle).success).toBe(true)
      expect(theme.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(theme.buttonColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it("returns Pearl White as the default theme", () => {
    const theme = getDefaultTheme()

    expect(theme.name).toBe("Pearl White")
    expect(theme).toEqual(themes.find((item) => item.name === "Pearl White"))
    expect(theme.buttonStyle).toBe("solid")
    expect(theme.buttonShape).toBe("pill")
  })
})

describe("user page fonts", () => {
  it("maps every catalog font to its class and falls back for unknown fonts", () => {
    expect(new Set(fonts.map((font) => font.className)).size).toBe(fonts.length)

    for (const font of fonts) {
      expect(font.className.startsWith("font-")).toBe(true)
      expect(getUserPageFontClassName(font.name)).toBe(font.className)
    }

    expect(getUserPageFontClassName("Not A Font")).toBe("font-sans")
  })

  it.each([
    ["Bebas Neue", "tracking-[0.02em]", "tracking-[0.01em]"],
    ["Anton", "tracking-[0.025em]", "tracking-[0.015em]"],
    ["Archivo Black", "tracking-[0.005em]", "tracking-normal"],
    ["Inter", "tracking-[-0.03em]", "tracking-normal"],
  ] as const)("sets tracking for %s", (fontName, heading, body) => {
    expect(getUserPageFontTracking(fontName)).toEqual({ heading, body })
  })
})
