import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import { useSiteHeader } from "@/components/site-header"
import { ThemePreview } from "@/components/theme-preview"
import { Button } from "@/components/ui/button"
import { useUpdateProfile } from "@/hooks/queries"
import { useSelectedProfile } from "@/hooks/use-selected-profile"
import { type Theme, themes } from "@/lib/themes"

export const Route = createFileRoute("/_authenticated/bio/appearance/themes")({
  component: RouteComponent,
})

function RouteComponent() {
  useSiteHeader({ title: "Theme Gallery", titleMode: "append" })

  const navigate = useNavigate()
  const profileData = useSelectedProfile()
  const profile = profileData?.profile
  const updateTheme = useUpdateProfile()
  const [isApplying, setIsApplying] = useState<string | null>(null)

  const handleSelectTheme = async (theme: Theme) => {
    if (!profile || isApplying) return

    setIsApplying(theme.name)
    try {
      await updateTheme.mutateAsync({
        id: profile.id,
        theme: theme.name,
        backgroundColor: theme.backgroundColor,
        fontFamily: theme.fontFamily,
        textColor: theme.textColor,
        buttonShape: theme.buttonShape,
        buttonStyle: theme.buttonStyle,
        buttonColor: theme.buttonColor,
        buttonTextColor: theme.buttonTextColor,
      })
      toast.success(`Applied ${theme.name} theme`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to apply theme")
    } finally {
      setIsApplying(null)
    }
  }

  if (!profile) {
    return null
  }

  const currentThemeName = profile.theme === "Custom" ? null : profile.theme

  return (
    <div className="max-w-4xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => navigate({ to: "/bio/appearance" })}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4 mr-1" />
        Back to Appearance
      </Button>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-8">
        {themes.map((theme) => (
          <ThemePreview
            key={theme.name}
            theme={theme}
            selected={currentThemeName === theme.name}
            onClick={() => handleSelectTheme(theme)}
            className={isApplying === theme.name ? "opacity-70" : ""}
          />
        ))}
      </div>
    </div>
  )
}
