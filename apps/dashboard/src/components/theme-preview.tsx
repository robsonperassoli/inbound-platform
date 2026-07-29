import type { Theme } from "@/lib/themes"
import { cn } from "@/lib/utils"

function adjustColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  // Calculate luminance to determine if color is light or dark
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // For dark backgrounds, lighten; for light backgrounds, darken
  const isDark = luminance < 0.5
  const adjustment = isDark ? 1 + factor : 1 - factor

  const newR = Math.min(255, Math.max(0, Math.floor(r * adjustment)))
  const newG = Math.min(255, Math.max(0, Math.floor(g * adjustment)))
  const newB = Math.min(255, Math.max(0, Math.floor(b * adjustment)))

  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`
}

export function ThemePreview({
  theme,
  selected,
  onClick,
  className,
  buttonCount = 3,
  size = "default",
}: {
  theme: Theme
  selected: boolean
  onClick: () => void
  className?: string
  buttonCount?: number
  size?: "default" | "compact"
}) {
  const normalizedButtonCount = Math.max(1, Math.min(4, buttonCount))
  const previewButtonIds = Array.from(
    { length: normalizedButtonCount },
    (_, idx) => `preview-${idx + 1}`,
  )

  return (
    <button
      type="button"
      key={theme.name}
      className={cn(
        "overflow-hidden rounded-lg border-2 text-left transition",
        size === "compact" ? "max-w-48" : "max-w-56",
        "hover:shadow-lg hover:scale-[1.02]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        selected ? "ring-2 ring-primary shadow-xl scale-[1.02]" : "shadow-md",
        className,
      )}
      style={{
        backgroundColor: theme.backgroundColor,
        borderColor: adjustColor(theme.backgroundColor, 0.15),
      }}
      onClick={onClick}
    >
      <div
        className={cn(
          "space-y-1",
          size === "compact"
            ? "min-h-40 px-4 pt-4 pb-5"
            : "min-h-56 px-6 pt-6 pb-8",
        )}
      >
        <header className="space-y-2 pt-1">
          <div
            className={cn(
              "mx-auto rounded-full w-full",
              size === "compact" ? "h-3.5" : "h-4",
            )}
            style={{ backgroundColor: `${theme.textColor}33` }}
          />
          <div
            className={cn(
              "mx-auto rounded-full",
              size === "compact" ? "h-3 w-20" : "h-3 w-28",
            )}
            style={{ backgroundColor: `${theme.textColor}26` }}
          />
        </header>

        <div
          className={cn(
            size === "compact" ? "mt-3 space-y-2" : "mt-5 space-y-2.5",
          )}
        >
          {previewButtonIds.map((buttonId) => {
            const isOutline = theme.buttonStyle === "outline"
            const isGhost = theme.buttonStyle === "ghost"
            const isFilled = !isOutline && !isGhost

            return (
              <div
                key={buttonId}
                className={cn(
                  "w-full",
                  isOutline && "border-2",
                  size === "compact" ? "h-8" : "h-10",
                  theme.buttonShape === "pill"
                    ? "rounded-full"
                    : theme.buttonShape === "rounded"
                      ? "rounded-lg"
                      : "rounded-md",
                )}
                style={{
                  backgroundColor: isFilled ? theme.buttonColor : "transparent",
                  borderColor: isOutline ? theme.buttonColor : "transparent",
                  boxShadow:
                    theme.buttonStyle === "shadow"
                      ? `0 4px 12px ${theme.buttonColor}50`
                      : theme.buttonStyle === "3d"
                        ? `4px 4px 0px 0px ${theme.textColor}30`
                        : "none",
                }}
              />
            )
          })}
        </div>
      </div>
    </button>
  )
}
