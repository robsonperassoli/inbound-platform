import { HugeiconsIcon } from "@hugeicons/react"
import { useForm } from "@tanstack/react-form"
import { useEffect } from "react"
import z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  buildSocialUrl,
  normalizeSocialHandle,
  type SocialPlatform,
  socialConfig,
  socialPlatforms,
} from "@/lib/social-links"
import { useCreateLink } from "@/hooks/queries"

export const addSocialLinkSchema = z
  .object({
    platform: z.enum(socialPlatforms),
    identifier: z.string().trim().min(1, "Enter a username or handle"),
  })
  .superRefine((value, ctx) => {
    const normalized = normalizeSocialHandle(value.platform, value.identifier)

    if (!normalized || !buildSocialUrl(value.platform, normalized)) {
      ctx.addIssue({
        code: "custom",
        path: ["identifier"],
        message: `Enter a valid ${socialConfig[value.platform].fieldLabel}`,
      })
    }
  })

type AddSocialLinkValues = z.infer<typeof addSocialLinkSchema>

export function AddSocialLinkModal({
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
      platform: "instagram" as SocialPlatform,
      identifier: "",
    },
    validators: {
      onSubmit: addSocialLinkSchema,
    },
    onSubmit: async ({ value }) => {
      await handleAddSocialLink({
        addLink,
        onClose,
        order,
        profileId,
        value,
      })
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
          <DialogTitle>Add Social</DialogTitle>
          <DialogDescription>
            Choose a platform and connect a social profile to your page.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="platform">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Platform</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as SocialPlatform)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {socialPlatforms.map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            <HugeiconsIcon
                              icon={socialConfig[platform].icon}
                              size={16}
                            />
                            {socialConfig[platform].title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : (
                      <FieldDescription>
                        Pick the social platform you want to add.
                      </FieldDescription>
                    )}
                  </Field>
                )
              }}
            </form.Field>

            <form.Subscribe selector={(state) => state.values.platform}>
              {(platform) => (
                <form.Field name="identifier">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    const platformConfig = socialConfig[platform]

                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name} className="capitalize">
                          {platformConfig.fieldLabel}
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupAddon className="pl-3 text-muted-foreground">
                            {platformConfig.prefix}
                          </InputGroupAddon>
                          <InputGroupInput
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder={platformConfig.placeholder}
                          />
                        </InputGroup>
                        {isInvalid ? (
                          <FieldError errors={field.state.meta.errors} />
                        ) : (
                          <FieldDescription>
                            Paste the full URL or just the{" "}
                            {platformConfig.fieldLabel}. We&apos;ll save{" "}
                            {platformConfig.prefix}
                            {platformConfig.fieldLabel === "handle"
                              ? "your-handle"
                              : "your-username"}
                            .
                          </FieldDescription>
                        )}
                      </Field>
                    )
                  }}
                </form.Field>
              )}
            </form.Subscribe>

            <Field orientation="horizontal">
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={onClose}
              >
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

async function handleAddSocialLink({
  addLink,
  onClose,
  order,
  profileId,
  value,
}: {
  addLink: { mutateAsync: (args: {
    profileId: string
    title: string
    type: "social"
    platform: SocialPlatform
    url: string
    order: number
    active: boolean
  }) => Promise<unknown> }
  onClose: () => void
  order: number
  profileId: string
  value: AddSocialLinkValues
}) {
  const normalized = normalizeSocialHandle(value.platform, value.identifier)
  const url = buildSocialUrl(value.platform, normalized)

  if (!url) {
    return
  }

  await addLink.mutateAsync({
    profileId,
    title: socialConfig[value.platform].title,
    type: "social",
    platform: value.platform,
    url,
    order,
    active: true,
  })

  onClose()
}
