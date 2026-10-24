import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

describe("test harness", () => {
  it("renders in jsdom and accepts clicks", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <button type="button" onClick={onClick}>
        harness
      </button>,
    )

    await user.click(screen.getByRole("button", { name: "harness" }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
