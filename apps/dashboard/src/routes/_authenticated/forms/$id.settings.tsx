import {
  Delete02Icon,
  Edit02Icon,
  MoreHorizontal,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useForm } from "@tanstack/react-form"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import z from "zod"
import { useSiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  useForm as useFormQuery,
  useSaveFormFields,
  useUpdateForm,
} from "@/hooks/queries/forms"
import type { Form } from "@/lib/types"

export const Route = createFileRoute("/_authenticated/forms/$id/settings")({
  component: RouteComponent,
})

type FormField = Form["fields"][number]
type FormFieldType = FormField["type"]

const fieldTypes: Array<{ value: FormFieldType; label: string }> = [
  { value: "shortText", label: "Short text" },
  { value: "longText", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "phoneNumber", label: "Phone number" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "dateTime", label: "Date + time" },
]

const headerSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string(),
})

const fieldSchema = z
  .object({
    label: z.string().trim().min(1, "Field label is required"),
    type: z.enum([
      "shortText",
      "longText",
      "email",
      "phoneNumber",
      "number",
      "select",
      "checkbox",
      "date",
      "dateTime",
    ]),
    required: z.boolean(),
    optionsText: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.type !== "select") {
      return
    }

    const options = value.optionsText
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean)

    if (options.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["optionsText"],
        message: "Add at least one option for select fields",
      })
    }
  })

function newFieldId() {
  return `field_${Math.random().toString(36).slice(2, 10)}`
}

function RouteComponent() {
  useSiteHeader({ title: "Settings", titleMode: "append" })

  const { id: formId } = Route.useParams()
  const { data: formData } = useFormQuery(formId)

  if (!formData) {
    return (
      <div className="text-sm text-muted-foreground">Loading settings...</div>
    )
  }

  return <SettingsEditor formId={formId} formData={formData} />
}

function SettingsEditor({
  formId,
  formData,
}: {
  formId: string
  formData: Form
}) {
  const updateFormHeader = useUpdateForm()
  const saveFormFields = useSaveFormFields()

  const [isSavingHeader, setIsSavingHeader] = useState(false)
  const [isDeletingFieldId, setIsDeletingFieldId] = useState<string | null>(
    null,
  )

  const [isFieldSheetOpen, setIsFieldSheetOpen] = useState(false)
  const [editingField, setEditingField] = useState<FormField | null>(null)

  const headerForm = useForm({
    defaultValues: {
      title: formData.title,
      description: formData.description ?? "",
    },
    validators: {
      onSubmit: headerSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSavingHeader(true)
      try {
        await updateFormHeader.mutateAsync({
          id: formId,
          title: value.title.trim(),
          description: value.description.trim() || null,
        })
      } finally {
        setIsSavingHeader(false)
      }
    },
  })

  const typeLabelByValue = useMemo(() => {
    return Object.fromEntries(
      fieldTypes.map((fieldType) => [fieldType.value, fieldType.label]),
    ) as Record<FormFieldType, string>
  }, [])

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Form header</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void headerForm.handleSubmit()
            }}
          >
            <FieldGroup>
              <headerForm.Field name="title">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>Title</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Contact form"
                      />
                      {isInvalid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : (
                        <FieldDescription>
                          This appears at the top of your form.
                        </FieldDescription>
                      )}
                    </Field>
                  )
                }}
              </headerForm.Field>

              <headerForm.Field name="description">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>Description</FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Tell people what this form is for"
                      />
                      {isInvalid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : (
                        <FieldDescription>
                          Optional text shown under the title.
                        </FieldDescription>
                      )}
                    </Field>
                  )
                }}
              </headerForm.Field>

              <Field orientation="horizontal">
                <Button type="submit" disabled={isSavingHeader}>
                  {isSavingHeader ? "Saving..." : "Save header"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fields</CardTitle>
          <CardAction>
            <Button
              onClick={() => {
                setEditingField(null)
                setIsFieldSheetOpen(true)
              }}
            >
              Add field
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="divide-y">
          {formData.fields.length === 0 && (
            <p className="py-3 text-sm text-muted-foreground">
              No fields yet. Add your first field.
            </p>
          )}

          {formData.fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center justify-between gap-3 py-3 transition-colors duration-200 ease-out hover:bg-muted/30 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{field.label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline">
                    {typeLabelByValue[field.type]}
                  </Badge>
                  {field.required && (
                    <Badge variant="secondary">Required</Badge>
                  )}
                </div>
              </div>

              <ButtonGroup>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingField(field)
                    setIsFieldSheetOpen(true)
                  }}
                >
                  <HugeiconsIcon icon={Edit02Icon} size={16} className="mr-2" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="pl-2!"
                    >
                      <HugeiconsIcon icon={MoreHorizontal} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      disabled={isDeletingFieldId === field.id}
                      onClick={async () => {
                        setIsDeletingFieldId(field.id)
                        try {
                          await saveFormFields.mutateAsync({
                            id: formId,
                            fields: formData.fields.filter(
                              (currentField) => currentField.id !== field.id,
                            ),
                          })
                        } finally {
                          setIsDeletingFieldId(null)
                        }
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        size={16}
                        className="mr-2"
                      />
                      {isDeletingFieldId === field.id
                        ? "Removing..."
                        : "Remove"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ButtonGroup>
            </div>
          ))}
        </CardContent>
      </Card>

      <FieldEditorSheet
        key={editingField?.id ?? "new-field"}
        formId={formId}
        open={isFieldSheetOpen}
        onOpenChange={setIsFieldSheetOpen}
        initialField={editingField}
        fields={formData.fields}
      />
    </div>
  )
}

function FieldEditorSheet({
  formId,
  open,
  onOpenChange,
  initialField,
  fields,
}: {
  formId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initialField: FormField | null
  fields: Form["fields"]
}) {
  const saveFormFields = useSaveFormFields()
  const [isSavingField, setIsSavingField] = useState(false)

  const fieldForm = useForm({
    defaultValues: {
      label: initialField?.label ?? "",
      type: initialField?.type ?? ("shortText" as FormFieldType),
      required: initialField?.required ?? false,
      optionsText: initialField?.options?.join("\n") ?? "",
    },
    validators: {
      onSubmit: fieldSchema,
    },
    onSubmit: async ({ value }) => {
      const options = value.optionsText
        .split("\n")
        .map((option) => option.trim())
        .filter(Boolean)

      const fieldPayload: FormField = {
        id: initialField?.id ?? newFieldId(),
        type: value.type,
        label: value.label.trim(),
        required: value.required,
        options: value.type === "select" ? options : undefined,
      }

      setIsSavingField(true)
      try {
        await saveFormFields.mutateAsync({
          id: formId,
          fields: initialField
            ? fields.map((field) =>
                field.id === initialField.id ? fieldPayload : field,
              )
            : [...fields, fieldPayload],
        })
        onOpenChange(false)
      } finally {
        setIsSavingField(false)
      }
    },
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{initialField ? "Update field" : "Add field"}</SheetTitle>
          <SheetDescription>
            Configure this field and save changes.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void fieldForm.handleSubmit()
          }}
        >
          <FieldGroup className="px-6 pb-6">
            <fieldForm.Field name="label">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Label</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Your question"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </fieldForm.Field>

            <fieldForm.Field name="type">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Type</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as FormFieldType)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Field type" />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((fieldType) => (
                          <SelectItem
                            key={fieldType.value}
                            value={fieldType.value}
                          >
                            {fieldType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </fieldForm.Field>

            <fieldForm.Subscribe selector={(state) => state.values.type}>
              {(type) => (
                <fieldForm.Field name="optionsText">
                  {(field) => {
                    if (type !== "select") {
                      return null
                    }

                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid

                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel>Options</FieldLabel>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder={
                            "One option per line\nFirst option\nSecond option"
                          }
                          className="min-h-32"
                        />
                        {isInvalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : (
                          <FieldDescription>
                            Use one option per line.
                          </FieldDescription>
                        )}
                      </Field>
                    )
                  }}
                </fieldForm.Field>
              )}
            </fieldForm.Subscribe>

            <fieldForm.Field name="required">
              {(field) => (
                <Field orientation="horizontal">
                  <FieldLabel htmlFor={`${field.name}_required`}>
                    Required
                  </FieldLabel>
                  <Switch
                    id={`${field.name}_required`}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                </Field>
              )}
            </fieldForm.Field>
          </FieldGroup>

          <Field orientation="horizontal" className="border-t px-6 py-4">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingField} className="flex-1">
              {isSavingField ? "Saving..." : initialField ? "Update" : "Create"}
            </Button>
          </Field>
        </form>
      </SheetContent>
    </Sheet>
  )
}
