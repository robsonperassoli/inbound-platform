import { describe, expect, it } from "vitest"
import {
  greetingMessage,
  oneShootSystemPrompt,
  systemPrompt,
} from "./theme-designer"

const fonts = [
  "Inter",
  "DM Sans",
  "Manrope",
  "Plus Jakarta Sans",
  "Outfit",
  "Poppins",
  "Montserrat",
  "Playfair Display",
  "Merriweather",
  "Libre Baskerville",
  "Lora",
  "Bebas Neue",
  "Anton",
  "Archivo Black",
  "Space Grotesk",
]

describe("theme designer prompts", () => {
  it("keeps the updateTheme input contract and the allowed fonts", () => {
    expect(systemPrompt).toContain("updateTheme")
    expect(systemPrompt).toContain("CURRENT_THEME:")
    for (const shape of ["square", "rounded", "pill"]) {
      expect(systemPrompt).toContain(`"${shape}"`)
    }
    for (const style of [
      "solid",
      "outline",
      "paper",
      "shadow",
      "3d",
      "ghost",
    ]) {
      expect(systemPrompt).toContain(`"${style}"`)
    }
    for (const font of fonts) {
      expect(systemPrompt).toContain(font)
      expect(oneShootSystemPrompt).toContain(font)
    }
    expect(oneShootSystemPrompt).toContain("#ffffff")
  })

  it("greets someone who has not used a design tool", () => {
    expect(greetingMessage).toContain("do not need to know design tools")
  })
})
