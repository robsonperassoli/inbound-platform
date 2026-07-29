import { useForm } from "@tanstack/react-form"
import { useEffect } from "react"
import z from "zod"
import { useCreateLink } from "@/hooks/queries/links"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "./ui/field"
import { Input } from "./ui/input"

export function AddLinkModal({
  open,
  onClose,
  order,
  profileId,
}: {
  open: boolean
  onClose: () => void
  order: number
  profileId: string
}) {
  const addLink = useCreateLink()

  const form = useForm({
    defaultValues: {
      title: "",
      url: "",
    },
    validators: {
      onSubmit: z.object({
        title: z.string().min(4, "Should have at least 4 characters").max(100),
        url: z.url(),
      }),
    },
    onSubmit: async ({ value }) => {
      await addLink.mutateAsync({
        profileId,
        title: value.title,
        type: "url",
        url: value.url,
        order,
        active: true,
      })
      onClose()
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Button</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="title">
              {(f) => {
                const isInvalid =
                  f.state.meta.isTouched && !f.state.meta.isValid
                return (
                  <Field>
                    <FieldLabel>Title</FieldLabel>
                    <Input
                      id={f.name}
                      name={f.name}
                      value={f.state.value}
                      onBlur={f.handleBlur}
                      onChange={(e) => f.handleChange(e.target.value)}
                      placeholder="Book a tour"
                    />
                    {isInvalid ? (
                      <FieldError errors={f.state.meta.errors} />
                    ) : (
                      <FieldDescription>
                        Text that shows up on the button
                      </FieldDescription>
                    )}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name="url">
              {(f) => {
                const isInvalid =
                  f.state.meta.isTouched && !f.state.meta.isValid
                return (
                  <Field>
                    <FieldLabel>URL</FieldLabel>
                    <Input
                      id={f.name}
                      name={f.name}
                      value={f.state.value}
                      onBlur={f.handleBlur}
                      onChange={(e) => f.handleChange(e.target.value)}
                      placeholder="https://example.com"
                    />
                    {isInvalid ? (
                      <FieldError errors={f.state.meta.errors} />
                    ) : (
                      <FieldDescription>
                        The link for the button
                      </FieldDescription>
                    )}
                  </Field>
                )
              }}
            </form.Field>
            <Field orientation="horizontal">
              <Button size="lg" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="lg">
                Create
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
