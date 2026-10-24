import { describe, expect, it } from "vitest"
import {
  CustomFacebookIcon,
  CustomInstagramIcon,
  CustomLinkedinIcon,
  CustomTiktokIcon,
  CustomXIcon,
  CustomYoutubeIcon,
} from "./social-icons"

const icons = [
  ["facebook", CustomFacebookIcon],
  ["instagram", CustomInstagramIcon],
  ["linkedin", CustomLinkedinIcon],
  ["tiktok", CustomTiktokIcon],
  ["x", CustomXIcon],
  ["youtube", CustomYoutubeIcon],
] as const

describe("social icons", () => {
  it("exports a unique Hugeicons path list for every platform", () => {
    const signatures = icons.map(([, icon]) =>
      icon.map(([, attrs]) => attrs.d).join("|"),
    )

    expect(new Set(signatures).size).toBe(icons.length)

    for (const [name, icon] of icons) {
      expect(icon.length, name).toBeGreaterThan(0)
      for (const [tag, attrs] of icon) {
        expect(tag, name).toBe("path")
        expect(attrs.fill, name).toBe("currentColor")
        expect(attrs.d.length, name).toBeGreaterThan(20)
      }
    }
  })
})
