// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AddSocialLinkModal } from "./add-social-link-modal"

const addLinkMock = vi.fn()

vi.mock("@/hooks/queries/links", () => ({
  useCreateLink: () => ({ mutateAsync: addLinkMock }),
}))

vi.mock("@/components/ui/field", () => ({
  Field: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FieldDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  FieldError: ({
    errors,
  }: {
    errors?: Array<{ message?: string } | undefined>
  }) => <div role="alert">{errors?.[0]?.message}</div>,
  FieldGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  FieldLabel: ({
    children,
    htmlFor,
    className,
  }: {
    children: React.ReactNode
    htmlFor?: string
    className?: string
  }) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}))

vi.mock("@/components/ui/select", () => {
  let currentValue: string | undefined
  let currentOnValueChange: ((value: string) => void) | undefined

  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value?: string
      onValueChange?: (value: string) => void
      children: React.ReactNode
    }) => {
      currentValue = value
      currentOnValueChange = onValueChange

      return <div>{children}</div>
    },
    SelectTrigger: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => (
      <span>{currentValue ?? placeholder}</span>
    ),
    SelectContent: ({ children }: { children: React.ReactNode }) => {
      return (
        <select
          aria-label="Platform"
          value={currentValue}
          onChange={(event) => currentOnValueChange?.(event.target.value)}
        >
          {children}
        </select>
      )
    },
    SelectItem: ({
      value,
      children,
    }: {
      value: string
      children: React.ReactNode
    }) => (
      <option value={value}>
        {React.Children.toArray(children)
          .filter((child) => typeof child === "string")
          .join("")}
      </option>
    ),
  }
})

describe("AddSocialLinkModal", () => {
  beforeEach(() => {
    addLinkMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it("renders platform options with icons and updates identifier wording", async () => {
    render(
      <AddSocialLinkModal
        open
        onClose={() => {}}
        order={3}
        profileId="profile_123"
      />,
    )

    expect(screen.getByLabelText("username").getAttribute("placeholder")).toBe(
      "@creator",
    )

    fireEvent.change(screen.getByLabelText("Platform"), {
      target: { value: "youtube" },
    })

    await waitFor(() => {
      expect(screen.getByLabelText("handle").getAttribute("placeholder")).toBe(
        "@channelname or channelname",
      )
    })
  })

  it("submits a canonical social link payload", async () => {
    const onClose = vi.fn()

    addLinkMock.mockResolvedValue(undefined)

    render(
      <AddSocialLinkModal
        open
        onClose={onClose}
        order={7}
        profileId="profile_123"
      />,
    )

    fireEvent.change(screen.getByLabelText("username"), {
      target: { value: "https://instagram.com/creator_name/" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() => {
      expect(addLinkMock).toHaveBeenCalledWith({
        profileId: "profile_123",
        title: "Instagram",
        details: {
          type: "social",
          platform: "instagram",
          url: "https://instagram.com/creator_name",
        },
        order: 7,
        active: true,
      })
    })

    expect(onClose).toHaveBeenCalled()
  })

  it("blocks submit when the identifier is empty", async () => {
    render(
      <AddSocialLinkModal
        open
        onClose={() => {}}
        order={1}
        profileId="profile_123"
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(
        "Enter a username or handle",
      )
    })

    expect(addLinkMock).not.toHaveBeenCalled()
  })
})
