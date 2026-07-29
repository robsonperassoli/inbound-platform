import type { Profile } from "@/lib/types"
import { PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useForm } from "@tanstack/react-form"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import z from "zod"
import { PublishBanner } from "@/components/bio/publish-banner"
import { FileUpload } from "@/components/file-upload"
import { BIO_DOMAIN } from "@/components/share-button"
import { useSiteHeader } from "@/components/site-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { useFileUpload } from "@/hooks/use-file-upload"
import { useSelectedProfile } from "@/hooks/use-selected-profile"
import { useUpdateProfile } from "@/hooks/queries"

export const Route = createFileRoute("/_authenticated/bio/settings")({
  component: RouteComponent,
  ssr: false,
})

const profileHeaderSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Use letters, numbers, underscores, and hyphens only",
    ),
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  bio: z.string().trim().min(2, "Bio must be at least 2 characters"),
})

type ProfileHeaderValues = z.infer<typeof profileHeaderSchema>

function RouteComponent() {
  useSiteHeader({ title: "Settings", titleMode: "append" })

  const profileData = useSelectedProfile()

  if (!profileData) {
    return (
      <div className="text-sm text-muted-foreground">Loading profile...</div>
    )
  }

  return <SettingsForm profile={profileData.profile} />
}

function SettingsForm({ profile }: { profile: Profile }) {
  const { uploadFile } = useFileUpload()
  const updateProfile = useUpdateProfile()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const normalizeValues = (
    values: ProfileHeaderValues,
  ): ProfileHeaderValues => ({
    username: values.username.trim(),
    title: values.title.trim(),
    bio: values.bio.trim(),
  })

  const form = useForm({
    defaultValues: {
      username: profile.username,
      title: profile.title,
      bio: profile.bio,
    },
    validators: {
      onSubmit: profileHeaderSchema,
    },
    onSubmit: async ({ value }) => {
      const normalizedValue = normalizeValues(value)
      setIsSaving(true)
      setSaveError(null)

      try {
        await updateProfile.mutateAsync({
          id: profile.id,
          title: normalizedValue.title,
          bio: normalizedValue.bio,
        })
        form.reset(normalizedValue)
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : "Failed to update profile",
        )
      } finally {
        setIsSaving(false)
      }
    },
  })

  const handleAvatarUpload = async (file: File) => {
    const { storageId } = await uploadFile(file)

    await updateProfile.mutateAsync({ id: profile.id, avatarKey: storageId })
  }

  return (
    <div className="space-y-6">
      <PublishBanner />

      <Card>
        <CardHeader>
          <CardTitle>Profile header</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <FieldGroup>
              <FileUpload
                onChange={(_tempUrl, file) => handleAvatarUpload(file)}
              >
                <Avatar size="lg" className="group overflow-hidden">
                  {profile.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} />
                  ) : (
                    <AvatarFallback />
                  )}
                  <div className="absolute inset-0 bg-primary/40 opacity-0 flex items-center justify-center text-primary-foreground group-hover:opacity-100 duration-200">
                    <HugeiconsIcon icon={PencilEdit01Icon} size={16} />
                  </div>
                </Avatar>
              </FileUpload>

              <form.Field name="username">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>Username</FieldLabel>

                      <InputGroup className="[--radius:9999px]">
                        <InputGroupAddon className="pl-1.5 text-muted-foreground">
                          {BIO_DOMAIN}/
                        </InputGroupAddon>
                        <InputGroupInput
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="the_real_john"
                          autoComplete="off"
                        />
                      </InputGroup>

                      {isInvalid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : (
                        <FieldDescription>
                          Your public page URL uses this username.
                        </FieldDescription>
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              <form.Field name="title">
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
                        placeholder="John Labrador"
                      />

                      {isInvalid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : (
                        <FieldDescription>
                          This appears under your avatar on the public page.
                        </FieldDescription>
                      )}
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
                      <FieldLabel>Bio</FieldLabel>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Making dreams come true"
                      />

                      {isInvalid ? (
                        <FieldError errors={field.state.meta.errors} />
                      ) : (
                        <FieldDescription>
                          A short summary visitors see on your profile.
                        </FieldDescription>
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              {saveError && (
                <p className="text-sm text-destructive" role="alert">
                  {saveError}
                </p>
              )}

              <Field orientation="horizontal">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save profile"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
