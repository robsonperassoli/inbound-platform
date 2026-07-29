import { useForm } from "@tanstack/react-form"
import z from "zod"
import { Button } from "../ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../ui/field"
import { Input } from "../ui/input"

const titleSchema = z
  .string()
  .min(4, "Should have at least 4 characters")
  .max(100)

interface EditLinkFormProps {
  defaultValues: {
    title: string
    url: string | null
  }
  onSubmit: (values: { title: string; url: string | null }) => void
  onCancel: () => void
  editUrl: boolean
}

export function EditLinkForm({
  defaultValues,
  onSubmit,
  onCancel,
  editUrl,
}: EditLinkFormProps) {
  const validatorSchema = z.object({
    title: titleSchema,
    url: editUrl ? z.url() : z.url().nullable(),
  })

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: validatorSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field
          name="title"
          children={(f) => {
            const isInvalid = f.state.meta.isTouched && !f.state.meta.isValid
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
        />

        {editUrl && (
          <form.Field
            name="url"
            children={(f) => {
              const isInvalid = f.state.meta.isTouched && !f.state.meta.isValid
              return (
                <Field>
                  <FieldLabel>URL</FieldLabel>
                  <Input
                    id={f.name}
                    name={f.name}
                    value={f.state.value ?? ""}
                    onBlur={f.handleBlur}
                    onChange={(e) => f.handleChange(e.target.value)}
                    placeholder="https://example.com"
                  />
                  {isInvalid ? (
                    <FieldError errors={f.state.meta.errors} />
                  ) : (
                    <FieldDescription>The link for the button</FieldDescription>
                  )}
                </Field>
              )
            }}
          />
        )}

        <Field orientation="horizontal">
          <Button size="lg" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="lg">
            Save
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
