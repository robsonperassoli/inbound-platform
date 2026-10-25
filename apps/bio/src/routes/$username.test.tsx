import type { PublicLink, PublicProfile } from "@inbound/shared"
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { routeTree } from "@/routeTree.gen"
import {
  ApiError,
  getFormSessionMessages,
  getPublicProfile,
  startFormSession,
} from "@/lib/api"

// The real chat popover loops in jsdom. This stand-in checks that the route opens it.
vi.mock("@/components/bio-form-chat", () => ({
  BioFormChat: ({ sessionId }: { sessionId: string }) => (
    <div>Form chat {sessionId}</div>
  ),
}))

vi.mock("@/lib/api", () => {
  class ProfileApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.name = "ApiError"
      this.status = status
    }
  }

  return {
    ApiError: ProfileApiError,
    getPublicProfile: vi.fn(),
    startFormSession: vi.fn(),
    trackPageView: vi.fn(),
    getPublicLink: vi.fn(),
    trackLinkClick: vi.fn(),
    getFormSessionMessages: vi.fn(),
    sendFormSessionMessage: vi.fn(),
  }
})

const profile: PublicProfile = {
  id: "profile-1",
  username: "jane",
  title: "Jane Doe",
  bio: "Tours and listings",
  avatarUrl: null,
  backgroundImageUrl: null,
  publishedAt: 1_700_000_000_000,
  theme: "Pearl White",
  backgroundColor: "#ffffff",
  fontFamily: "Inter",
  textColor: "#1e293b",
  buttonShape: "pill",
  buttonStyle: "solid",
  buttonColor: "#1e293b",
  buttonTextColor: "#ffffff",
}

const links: PublicLink[] = [
  {
    id: "link-tour",
    title: "Book a tour",
    order: 0,
    active: true,
    type: "url",
    url: "https://example.com/tour",
    formId: null,
    platform: null,
  },
  {
    id: "link-instagram",
    title: "Instagram",
    order: 1,
    active: true,
    type: "social",
    url: "https://instagram.com/jane",
    platform: "instagram",
    formId: null,
  },
  {
    id: "link-contact",
    title: "Contact",
    order: 2,
    active: true,
    type: "form",
    url: null,
    formId: "form-1",
    platform: null,
  },
]

async function renderUsername(path = "/jane") {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    scrollRestoration: false,
  })
  render(<RouterProvider router={router} />)
  await router.load()
  return router
}

describe("/$username", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url
        throw new Error(`unexpected fetch ${url}`)
      }),
    )
    vi.mocked(getPublicProfile).mockResolvedValue({ profile, links })
    vi.mocked(startFormSession).mockResolvedValue({ sessionId: "session-1" })
    vi.mocked(getFormSessionMessages).mockResolvedValue({ messages: [] })
  })

  it("renders a published profile and routes link clicks through the profile", async () => {
    await renderUsername()

    expect(
      await screen.findByRole("heading", { name: "Jane Doe" }),
    ).toBeTruthy()
    expect(screen.getByText("Tours and listings")).toBeTruthy()
    expect(getPublicProfile).toHaveBeenCalledWith("jane")

    const tour = screen.getByRole("link", { name: "Book a tour" })
    expect(tour.getAttribute("href")).toBe("/jane/link/link-tour")

    const instagram = document.querySelector(
      'a[href="/jane/link/link-instagram"]',
    )
    expect(instagram).toBeTruthy()
    expect(screen.queryByRole("link", { name: "Instagram" })).toBeNull()
  })

  it("starts a form session when a form link is clicked", async () => {
    const user = userEvent.setup()
    await renderUsername()

    await user.click(await screen.findByRole("button", { name: "Contact" }))

    await waitFor(() => {
      expect(startFormSession).toHaveBeenCalledWith({
        profileId: "profile-1",
        formId: "form-1",
      })
    })
    expect(await screen.findByText("Form chat session-1")).toBeTruthy()
  })

  it("shows the unpublished page instead of the links", async () => {
    vi.mocked(getPublicProfile).mockResolvedValue({
      profile: { ...profile, publishedAt: null },
      links,
    })

    await renderUsername()

    expect(await screen.findByRole("heading", { name: "@jane" })).toBeTruthy()
    expect(screen.getByText("This profile is not published yet")).toBeTruthy()
    expect(screen.queryByRole("link", { name: "Book a tour" })).toBeNull()
  })

  it("shows the route not-found state when the profile is missing", async () => {
    vi.mocked(getPublicProfile).mockRejectedValue(
      new ApiError(404, "not found"),
    )

    await renderUsername("/missing")

    expect(
      await screen.findByRole("heading", { name: "Profile not found" }),
    ).toBeTruthy()
    expect(screen.getByText("This bio page does not exist.")).toBeTruthy()
    expect(getPublicProfile).toHaveBeenCalledWith("missing")
  })

  it("reports a non-404 failure and does not render the profile", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.mocked(getPublicProfile).mockRejectedValue(new ApiError(500, "boom"))

    await renderUsername()

    expect(screen.queryByRole("heading", { name: "Jane Doe" })).toBeNull()
    expect(screen.queryByText("Profile not found")).toBeNull()
    expect(screen.queryByRole("link", { name: "Book a tour" })).toBeNull()
    const logged = vi
      .mocked(console.error)
      .mock.calls.flat()
      .map((value) => (value instanceof Error ? value.message : String(value)))
      .join("\n")
    expect(logged).toContain("boom")
  })
})
