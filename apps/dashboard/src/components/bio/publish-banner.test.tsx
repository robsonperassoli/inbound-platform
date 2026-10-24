import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createElement, type ReactNode } from "react"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PublishBanner } from "./publish-banner"

const harness = vi.hoisted(() => ({
  selected: null as {
    profile: { id: string; publishedAt: number | null }
  } | null,
  session: undefined as { subscribed: boolean } | undefined,
  mutateAsync: vi.fn(),
}))

vi.mock("@/hooks/use-selected-profile", () => ({
  useSelectedProfile: () => harness.selected,
}))

vi.mock("@/hooks/queries/profiles", () => ({
  usePublishProfile: () => ({
    mutateAsync: harness.mutateAsync,
  }),
}))

vi.mock("@/hooks/use-session", () => ({
  useSession: () => harness.session,
}))

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children?: ReactNode }) =>
    createElement("a", { href: to }, children),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe("PublishBanner", () => {
  beforeEach(() => {
    harness.selected = null
    harness.session = undefined
    harness.mutateAsync.mockReset()
    harness.mutateAsync.mockResolvedValue({})
  })

  it("renders nothing without a profile or after the profile is published", () => {
    const { container, rerender } = render(<PublishBanner />)
    expect(container.innerHTML).toBe("")

    harness.selected = { profile: { id: "profile-1", publishedAt: 123 } }
    rerender(<PublishBanner />)
    expect(container.innerHTML).toBe("")
  })

  it("shows a loading action until the session resolves", () => {
    harness.selected = { profile: { id: "profile-1", publishedAt: null } }

    render(<PublishBanner />)

    expect(screen.getByText("Draft")).toBeTruthy()
    expect(screen.getByText("Your profile is ready.")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Loading..." })).toHaveProperty(
      "disabled",
      true,
    )
  })

  it("publishes the draft and confirms it is live", async () => {
    const user = userEvent.setup()
    harness.selected = { profile: { id: "profile-1", publishedAt: null } }
    harness.session = { subscribed: true }
    let release: (() => void) | undefined
    harness.mutateAsync.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    )

    render(<PublishBanner />)
    await user.click(screen.getByRole("button", { name: "Publish" }))

    expect(
      await screen.findByRole("button", { name: "Publishing…" }),
    ).toHaveProperty("disabled", true)
    expect(harness.mutateAsync).toHaveBeenCalledWith("profile-1")

    release?.()
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Your profile is now live.")
    })
  })

  it("shows the error message when publishing fails", async () => {
    const user = userEvent.setup()
    harness.selected = { profile: { id: "profile-1", publishedAt: null } }
    harness.session = { subscribed: true }
    harness.mutateAsync.mockRejectedValue(new Error("Card declined"))

    render(<PublishBanner />)
    await user.click(screen.getByRole("button", { name: "Publish" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Card declined")
    })
    expect(screen.getByRole("button", { name: "Publish" })).toBeTruthy()
  })

  it("uses a generic message when the failure is not an Error", async () => {
    const user = userEvent.setup()
    harness.selected = { profile: { id: "profile-1", publishedAt: null } }
    harness.session = { subscribed: true }
    harness.mutateAsync.mockRejectedValue("offline")

    render(<PublishBanner />)
    await user.click(screen.getByRole("button", { name: "Publish" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to publish profile")
    })
  })

  it("sends an unsubscribed user to upgrade instead of publishing", () => {
    harness.selected = { profile: { id: "profile-1", publishedAt: null } }
    harness.session = { subscribed: false }

    render(<PublishBanner />)

    const link = screen.getByRole("link", { name: /Publish/ })
    expect(link.getAttribute("href")).toBe("/upgrade")
    expect(screen.queryByRole("button", { name: "Publish" })).toBeNull()
    expect(harness.mutateAsync).not.toHaveBeenCalled()
  })
})
