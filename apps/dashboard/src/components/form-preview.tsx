import { Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "./ui/button"
import { useForm } from "@/hooks/queries/forms"
import type { Form } from "@/lib/types"

type FormField = Form["fields"][number]

type FieldMeta = {
  label: string
  hint: string
}

const FIELD_META: Record<FormField["type"], FieldMeta> = {
  shortText: {
    label: "Short text",
    hint: "One-line text response.",
  },
  longText: {
    label: "Long text",
    hint: "Multi-line detailed response.",
  },
  email: {
    label: "Email",
    hint: "Email address response.",
  },
  phoneNumber: {
    label: "Phone number",
    hint: "Phone number response.",
  },
  number: {
    label: "Number",
    hint: "Numeric response.",
  },
  select: {
    label: "Select",
    hint: "Pick one option from a list.",
  },
  checkbox: {
    label: "Checkbox",
    hint: "Yes/No choice.",
  },
  date: {
    label: "Date",
    hint: "Calendar date response.",
  },
  dateTime: {
    label: "Date + time",
    hint: "Date and time response.",
  },
}

export function FormPreview({
  formId,
  onDoneClicked,
}: {
  formId: string
  onDoneClicked: () => void
}) {
  const { data: form } = useForm(formId)

  if (!form) {
    return (
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader className="px-4 py-4">
          <CardTitle>Form preview</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader className="border-b hidden sm:block">
        <CardTitle className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
          Built So Far
        </CardTitle>
        <CardAction>
          <Button size="sm" onClick={onDoneClicked}>
            <HugeiconsIcon icon={Tick02Icon} /> Done
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4 overflow-auto">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight">{form.title}</h2>
          <p className="text-xs text-muted-foreground">
            This is a preview of the structure your agent will run.
          </p>
          {form.description ? (
            <div className="pt-4">
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
                Description
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {form.description}
              </p>
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
            Fields
          </p>
          {form.fields.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 text-center">
              <p className="text-sm font-medium">No questions yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Keep chatting with the agent to define the first field.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {form.fields.map((field, index) => (
                <PreviewField key={field.id} field={field} index={index} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PreviewField({ field, index }: { field: FormField; index: number }) {
  const typeMeta = FIELD_META[field.type]
  const options = field.options?.filter(Boolean) ?? []
  const optionPreview =
    field.type === "select" && options.length > 0
      ? `Options: ${options.slice(0, 3).join(", ")}${options.length > 3 ? ` +${options.length - 3} more` : ""}`
      : null

  return (
    <div className="py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Q{index + 1}</Badge>
        <Badge variant="outline">{typeMeta.label}</Badge>
        {field.required ? (
          <Badge>Required</Badge>
        ) : (
          <Badge variant="ghost">Optional</Badge>
        )}
      </div>

      <p className="mt-2 text-sm font-medium leading-tight">{field.label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {typeMeta.hint}
        {optionPreview ? ` ${optionPreview}` : ""}
      </p>

      {field.type === "select" && options.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {options.slice(0, 4).map((option) => (
            <Badge
              key={option}
              variant="outline"
              className="h-4 px-1.5 text-[10px]"
            >
              {option}
            </Badge>
          ))}
          {options.length > 4 ? (
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
              +{options.length - 4}
            </Badge>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function EmptyFormPreview() {
  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="px-4 py-4">
        <CardTitle>Form preview</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Agent working on creating the form
        </p>
      </CardContent>
    </Card>
  )
}
