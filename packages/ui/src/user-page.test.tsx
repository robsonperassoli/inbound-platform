import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { UserPageProfile } from "./user-page"
import { UserPage } from "./user-page"
import { loadFont } from "./lib/load-font"

vi.mock("./lib/load-font", () => ({
  loadFont: vi.fn(),
}))

const profile: UserPageProfile = {
  title: "Ada Lovelace",
  bio: "Analytical engine",
  avatarUrl: "https://example.com/ada.png",
  backgroundImageUrl: null,
  backgroundColor: "#ffffff",
  fontFamily: "Inter",
  textColor: "#111111",
  buttonShape: "pill",
  buttonStyle: "solid",
  buttonColor: "#111111",
  buttonTextColor: "#ffffff",
}

describe("UserPage", () => {
  beforeEach(() => {
    vi.mocked(loadFont).mockClear()
  })

  it("renders the profile, a url link, a form button, and a social icon", async () => {
    const user = userEvent.setup()
    const onFormLinkClick = vi.fn()

    render(
      <UserPage
        profile={profile}
        onFormLinkClick={onFormLinkClick}
        links={[
          {
            id: "papers",
            type: "url",
            title: "Papers",
            url: "https://example.com/papers",
          },
          {
            id: "contact",
            type: "form",
            title: "Contact",
            formId: "form-1",
          },
          {
            id: "instagram",
            type: "social",
            title: "Instagram",
            url: "https://instagram.com/ada",
            platform: "instagram",
          },
        ]}
      />,
    )

    expect(screen.getByRole("heading", { name: "Ada Lovelace" })).toBeTruthy()
    expect(screen.getByText("Analytical engine")).toBeTruthy()
    expect(loadFont).toHaveBeenCalledWith("Inter")

    const papers = screen.getByRole("link", { name: "Papers" })
    expect(papers.getAttribute("href")).toBe("https://example.com/papers")
    expect(papers.getAttribute("target")).toBe("_blank")
    expect(papers.className.split(/\s+/)).toContain("rounded-full")

    const social = document.querySelector('a[href="https://instagram.com/ada"]')
    expect(social).toBeTruthy()
    expect(social?.textContent).not.toContain("Instagram")

    await user.click(screen.getByRole("button", { name: "Contact" }))
    expect(onFormLinkClick).toHaveBeenCalledTimes(1)
    expect(onFormLinkClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "contact",
        type: "form",
        formId: "form-1",
      }),
    )
  })

  it("hides an empty bio and uses the outline square treatment", () => {
    render(
      <UserPage
        profile={{
          ...profile,
          bio: "",
          fontFamily: "Lora",
          buttonShape: "square",
          buttonStyle: "outline",
        }}
        links={[
          {
            id: "papers",
            type: "url",
            title: "Papers",
            url: "https://example.com/papers",
          },
        ]}
        onFormLinkClick={vi.fn()}
      />,
    )

    expect(screen.queryByRole("paragraph")).toBeNull()
    const papers = screen.getByRole("link", { name: "Papers" })
    const tokens = papers.className.split(/\s+/)
    expect(tokens).toContain("rounded-none")
    expect(tokens).toContain("border-up-button")
    expect(loadFont).toHaveBeenCalledWith("Lora")
  })
})
