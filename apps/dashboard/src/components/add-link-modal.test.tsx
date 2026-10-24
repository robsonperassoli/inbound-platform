import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AddLinkModal } from "./add-link-modal"

const createLink = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
}))

vi.mock("@/hooks/queries/links", () => ({
  useCreateLink: () => ({
    mutateAsync: createLink.mutateAsync,
  }),
}))

function renderModal(
  props?: Partial<{
    open: boolean
    onClose: () => void
    order: number
    profileId: string
  }>,
) {
  const onClose = props?.onClose ?? vi.fn()
  const view = render(
    <AddLinkModal
      open={props?.open ?? true}
      onClose={onClose}
      order={props?.order ?? 3}
      profileId={props?.profileId ?? "profile-1"}
    />,
  )
  return { ...view, onClose }
}

describe("AddLinkModal", () => {
  beforeEach(() => {
    createLink.mutateAsync.mockReset()
    createLink.mutateAsync.mockResolvedValue({})
  })

  it("stays closed until open is set", () => {
    renderModal({ open: false })

    expect(screen.queryByRole("dialog")).toBeNull()
    expect(screen.queryByText("Add Button")).toBeNull()
  })

  it("creates a url link from the title and url fields", async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal({ order: 4, profileId: "profile-42" })

    await user.type(screen.getByPlaceholderText("Book a tour"), "Open house")
    await user.type(
      screen.getByPlaceholderText("https://example.com"),
      "https://example.com/tour",
    )
    await user.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() => {
      expect(createLink.mutateAsync).toHaveBeenCalledWith({
        profileId: "profile-42",
        title: "Open house",
        type: "url",
        url: "https://example.com/tour",
        order: 4,
        active: true,
      })
    })
    expect(onClose).toHaveBeenCalled()
  })

  it("blocks submit when the title is short or the url is invalid", async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()

    await user.type(screen.getByPlaceholderText("Book a tour"), "Yo")
    await user.type(
      screen.getByPlaceholderText("https://example.com"),
      "not a url",
    )
    await user.click(screen.getByRole("button", { name: "Create" }))

    expect(
      await screen.findByText("Should have at least 4 characters"),
    ).toBeTruthy()
    expect(screen.getByRole("dialog")).toBeTruthy()
    expect(createLink.mutateAsync).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it("cancels without creating a link and clears the fields when reopened", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const view = renderModal({ onClose })

    await user.type(screen.getByPlaceholderText("Book a tour"), "Temporary")
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onClose).toHaveBeenCalled()
    expect(createLink.mutateAsync).not.toHaveBeenCalled()

    view.rerender(
      <AddLinkModal
        open={false}
        onClose={onClose}
        order={3}
        profileId="profile-1"
      />,
    )
    view.rerender(
      <AddLinkModal open onClose={onClose} order={3} profileId="profile-1" />,
    )

    expect(screen.getByPlaceholderText("Book a tour")).toHaveProperty(
      "value",
      "",
    )
    expect(screen.getByPlaceholderText("https://example.com")).toHaveProperty(
      "value",
      "",
    )
  })
})
