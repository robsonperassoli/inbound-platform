import { getDefaultTheme, type Theme } from "@/lib/themes"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { ThemePreview } from "./theme-preview"

function classTokens(element: HTMLElement) {
  return element.className.split(/\s+/)
}

function previewBars(button: HTMLElement) {
  const group = button.querySelector("header")?.nextElementSibling
  if (!group) return []
  return [...group.children].filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  )
}

function matchesColor(actual: string, hex: string) {
  const normalized = actual.replace(/\s+/g, "").toLowerCase()
  const channels = [0, 2, 4].map((offset) =>
    Number.parseInt(hex.slice(1 + offset, 3 + offset), 16),
  )
  const rgb = `rgb(${channels.join(",")})`
  return normalized === hex.toLowerCase() || normalized === rgb
}

describe("ThemePreview", () => {
  it("renders the theme background and calls onClick", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const theme = getDefaultTheme()

    render(<ThemePreview theme={theme} selected={false} onClick={onClick} />)

    const button = screen.getByRole("button")
    expect(
      matchesColor(button.style.backgroundColor, theme.backgroundColor),
    ).toBe(true)
    expect(classTokens(button)).toContain("shadow-md")
    expect(classTokens(button)).not.toContain("ring-primary")
    expect(classTokens(button)).toContain("max-w-56")

    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("marks the selected theme", () => {
    render(
      <ThemePreview theme={getDefaultTheme()} selected onClick={vi.fn()} />,
    )

    const button = screen.getByRole("button")
    expect(classTokens(button)).toContain("ring-primary")
    expect(classTokens(button)).toContain("shadow-xl")
  })

  it("clamps the preview button count to between 1 and 4", () => {
    const theme = getDefaultTheme()
    const { rerender } = render(
      <ThemePreview theme={theme} selected={false} onClick={vi.fn()} />,
    )

    expect(previewBars(screen.getByRole("button"))).toHaveLength(3)

    rerender(
      <ThemePreview
        theme={theme}
        selected={false}
        onClick={vi.fn()}
        buttonCount={0}
      />,
    )
    expect(previewBars(screen.getByRole("button"))).toHaveLength(1)

    rerender(
      <ThemePreview
        theme={theme}
        selected={false}
        onClick={vi.fn()}
        buttonCount={8}
      />,
    )
    expect(previewBars(screen.getByRole("button"))).toHaveLength(4)
  })

  it("draws outline squares, filled pills, and a 3d offset", () => {
    const base = getDefaultTheme()
    const outline: Theme = {
      ...base,
      name: "Outline",
      buttonStyle: "outline",
      buttonShape: "square",
      buttonColor: "#ff00aa",
    }
    const raised: Theme = {
      ...base,
      name: "Raised",
      buttonStyle: "3d",
      buttonShape: "pill",
      buttonColor: "#3366ff",
    }

    const { rerender } = render(
      <ThemePreview theme={outline} selected={false} onClick={vi.fn()} />,
    )
    const outlineBar = previewBars(screen.getByRole("button"))[0]
    if (!outlineBar) throw new Error("missing outline preview")
    expect(classTokens(outlineBar)).toContain("rounded-md")
    expect(classTokens(outlineBar)).toContain("border-2")
    expect(outlineBar.style.backgroundColor).toBe("transparent")
    expect(matchesColor(outlineBar.style.borderColor, "#ff00aa")).toBe(true)

    rerender(<ThemePreview theme={raised} selected={false} onClick={vi.fn()} />)
    const raisedBar = previewBars(screen.getByRole("button"))[0]
    if (!raisedBar) throw new Error("missing raised preview")
    expect(classTokens(raisedBar)).toContain("rounded-full")
    expect(matchesColor(raisedBar.style.backgroundColor, "#3366ff")).toBe(true)
    expect(raisedBar.style.boxShadow.replace(/\s+/g, " ")).toContain("4px 4px")
  })

  it("uses the compact frame", () => {
    render(
      <ThemePreview
        theme={getDefaultTheme()}
        selected={false}
        onClick={vi.fn()}
        size="compact"
      />,
    )

    expect(classTokens(screen.getByRole("button"))).toContain("max-w-48")
  })
})
