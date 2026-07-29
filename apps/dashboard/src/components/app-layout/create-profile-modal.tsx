import { useForm } from "@tanstack/react-form"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import z from "zod"
import { BIO_DOMAIN } from "@/components/share-button"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { useCreateLink } from "@/hooks/queries/links"
import {
  useCreateProfile,
  useIsUsernameAvailable,
} from "@/hooks/queries/profiles"

const createProfileSchema = z.object({
  title: z.string().trim().min(2, "Name must be at least 2 characters"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Use letters, numbers, underscores, and hyphens only",
    ),
  bio: z.string().trim().min(2, "Bio must be at least 2 characters"),
})

const starterLinks = [
  {
    title: "Book a call",
    url: "https://cal.com",
  },
  {
    title: "Visit website",
    url: "https://example.com",
  },
  {
    title: "Latest work",
    url: "https://www.behance.net",
  },
] as const

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "error"

export function CreateProfileModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (profileId: string) => void
}) {
  const createProfile = useCreateProfile()
  const createLink = useCreateLink()
  const checkUsername = useIsUsernameAvailable()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle")
  const [usernameInput, setUsernameInput] = useState("")
  const [usernameBlurred, setUsernameBlurred] = useState(false)
  const [lastCheckedUsername, setLastCheckedUsername] = useState("")
  const requestRef = useRef(0)

  const form = useForm({
    defaultValues: {
      title: "",
      username: "",
      bio: "",
    },
    validators: {
      onSubmit: createProfileSchema,
    },
    onSubmit: async ({ value }) => {
      const normalizedUsername = value.username.trim()

      setIsSubmitting(true)
      setSubmitError(null)

      try {
        const availability = await checkUsernameAvailability(normalizedUsername)

        if (availability !== "available") {
          setSubmitError(
            availability === "error"
              ? "Could not verify username availability right now"
              : "Username is already taken",
          )
          return
        }

        const { profile } = await createProfile.mutateAsync({
          title: value.title.trim(),
          username: normalizedUsername,
          bio: value.bio.trim(),
        })

        await Promise.all(
          starterLinks.map((link, order) =>
            createLink.mutateAsync({
              profileId: profile.id,
              title: link.title,
              type: "url",
              url: link.url,
              order,
              active: true,
            }),
          ),
        )

        onCreated(profile.id)
        onOpenChange(false)
        toast.success("Page created")
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create page"
        setSubmitError(message)
        toast.error(message)
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  const normalizedUsername = usernameInput.trim()
  const usernameError = useMemo(
    () =>
      createProfileSchema.shape.username.safeParse(normalizedUsername).error
        ?.issues[0]?.message,
    [normalizedUsername],
  )

  const checkUsernameAvailability = useCallback(
    async (value: string): Promise<UsernameStatus> => {
      const normalized = value.trim()

      if (!normalized || usernameError) {
        setUsernameStatus("idle")
        return "idle"
      }

      const requestId = ++requestRef.current
      setUsernameStatus("checking")

      try {
        const available = await checkUsername.mutateAsync(normalized)

        if (requestId !== requestRef.current) {
          return "idle"
        }

        setLastCheckedUsername(normalized)
        const nextStatus = available ? "available" : "taken"
        setUsernameStatus(nextStatus)
        return nextStatus
      } catch {
        if (requestId !== requestRef.current) {
          return "idle"
        }

        setUsernameStatus("error")
        return "error"
      }
    },
    [checkUsername, usernameError],
  )

  useEffect(() => {
    if (!normalizedUsername || usernameError) {
      setUsernameStatus("idle")
      setLastCheckedUsername("")
      return
    }

    const timeout = setTimeout(() => {
      void checkUsernameAvailability(normalizedUsername)
    }, 400)

    return () => clearTimeout(timeout)
  }, [checkUsernameAvailability, normalizedUsername, usernameError])

  const usernameStatusText = useMemo(() => {
    if (!normalizedUsername) {
      return "Choose a unique handle for your URL."
    }

    if (usernameError) {
      return usernameBlurred
        ? usernameError
        : "Use 3-30 characters with letters, numbers, _ or -."
    }

    if (usernameStatus === "checking") {
      return "Checking username availability..."
    }

    if (
      usernameStatus === "available" &&
      lastCheckedUsername === normalizedUsername
    ) {
      return "Username is available."
    }

    if (usernameStatus === "taken") {
      return "Username is already taken."
    }

    if (usernameStatus === "error") {
      return "Could not verify availability right now."
    }

    return `Your page will live at ${BIO_DOMAIN}/${normalizedUsername}`
  }, [
    lastCheckedUsername,
    normalizedUsername,
    usernameBlurred,
    usernameError,
    usernameStatus,
  ])

  const hasUsernameInput = normalizedUsername.length > 0

  const usernameStatusClassName =
    (hasUsernameInput && usernameError) || usernameStatus === "taken"
      ? "text-destructive"
      : usernameStatus === "available" &&
          lastCheckedUsername === normalizedUsername
        ? "text-emerald-700"
        : undefined

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset()
    setSubmitError(null)
    setIsSubmitting(false)
    setUsernameInput("")
    setUsernameBlurred(false)
    setUsernameStatus("idle")
    setLastCheckedUsername("")
    requestRef.current += 1
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new page</DialogTitle>
          <DialogDescription>
            Start with the basics. You can customize links, theme, and layout
            after creation.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="title">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <InputGroup className="[--radius:9999px]">
                      <InputGroupInput
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        placeholder="Alex Jordan"
                      />
                    </InputGroup>
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : (
                      <FieldDescription>
                        This is the display name visitors will see.
                      </FieldDescription>
                    )}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name="username">
              {(field) => {
                const isInvalid = Boolean(hasUsernameInput && usernameError)

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                    <InputGroup className="[--radius:9999px]">
                      <InputGroupAddon className="pl-1.5 text-muted-foreground">
                        {BIO_DOMAIN}/
                      </InputGroupAddon>
                      <InputGroupInput
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={() => {
                          field.handleBlur()
                          setUsernameBlurred(true)
                        }}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          requestRef.current += 1
                          field.handleChange(nextValue)
                          setUsernameInput(nextValue)
                          setUsernameStatus("idle")
                          setLastCheckedUsername("")
                          setSubmitError(null)
                        }}
                        placeholder="alex-jordan"
                        autoComplete="off"
                        aria-invalid={isInvalid}
                      />
                    </InputGroup>
                    <FieldDescription className={usernameStatusClassName}>
                      {usernameStatusText}
                    </FieldDescription>
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name="bio">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Bio</FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      placeholder="Helping clients book more meetings and close faster."
                    />
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : (
                      <FieldDescription>
                        We&apos;ll add a few starter links so the page is ready
                        to customize.
                      </FieldDescription>
                    )}
                  </Field>
                )
              }}
            </form.Field>

            {submitError ? (
              <p className="text-sm text-destructive" role="alert">
                {submitError}
              </p>
            ) : null}
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create page"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
