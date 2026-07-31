import type { CSSProperties } from "react"
import { getRelativeLuminance } from "../lib/colors"

export type ChatPopupTheme = {
  backgroundColor: string
  textColor: string
  buttonColor: string
  buttonTextColor: string
}

/** Contrast-safe chat CSS vars derived from the profile palette. */
export function getChatThemeStyle(theme: ChatPopupTheme): CSSProperties {
  const isDark = getRelativeLuminance(theme.backgroundColor) < 0.45

  return {
    "--up-background": theme.backgroundColor,
    "--up-foreground": theme.textColor,
    "--up-button-background": theme.buttonColor,
    "--up-button-foreground": theme.buttonTextColor,
    // Slightly lifted solid surface so the panel reads as a card, not glass wash.
    "--chat-surface": isDark
      ? `color-mix(in srgb, ${theme.backgroundColor} 90%, white)`
      : `color-mix(in srgb, ${theme.backgroundColor} 94%, black)`,
    "--chat-elevated": isDark
      ? `color-mix(in srgb, ${theme.backgroundColor} 82%, white)`
      : `color-mix(in srgb, ${theme.backgroundColor} 88%, black)`,
    "--chat-border": `color-mix(in srgb, ${theme.textColor} 16%, transparent)`,
    "--chat-muted": `color-mix(in srgb, ${theme.textColor} 58%, transparent)`,
    "--chat-shadow": isDark ? "rgb(0 0 0 / 0.5)" : "rgb(15 23 42 / 0.16)",
  } as CSSProperties
}
