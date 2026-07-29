import type { Profile } from "@/lib/types"
import {
  ArrowRight01Icon,
  Image,
  MessageSquare,
  type PaintBoardIcon,
  SlidersHorizontal,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import { GenerateThemeButton } from "@/components/bio/generate-theme-button"
import { useSiteHeader } from "@/components/site-header"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useSelectedProfile } from "@/hooks/use-selected-profile"
import { apiClient } from "@/lib/api"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_authenticated/bio/appearance/")({
  component: RouteComponent,
})

const buttonShapeLabels: Record<Profile["buttonShape"], string> = {
  square: "Square",
  rounded: "Rounded",
  pill: "Pill",
}

const buttonStyleLabels: Record<Profile["buttonStyle"], string> = {
  solid: "Solid",
  outline: "Outline",
  paper: "Paper",
  shadow: "Shadow",
  "3d": "3D",
  ghost: "Ghost",
}

const colorLabels = ["Background", "Text", "Button", "Button Text"]

function ColorSwatches({
  colors,
  fontFamily,
}: {
  colors: string[]
  fontFamily: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        {colors.map((color, index) => (
          <div
            key={colorLabels[index]}
            className="group relative"
            title={colorLabels[index]}
          >
            <div
              className="h-6 w-6 rounded-full border border-black/10 transition-transform group-hover:scale-110"
              style={{ backgroundColor: color }}
            />
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {colorLabels[index]}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 bg-muted px-2 py-1 rounded-full">
        <span className="text-sm font-bold leading-none">Aa</span>
        <span className="text-xs font-medium text-muted-foreground">
          {fontFamily}
        </span>
      </div>
    </div>
  )
}

function NavigationCard({
  icon,
  title,
  subtitle,
  onClick,
  className,
}: {
  icon: typeof PaintBoardIcon
  title: string
  subtitle: string
  onClick?: () => void
  className?: string
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200",
        "hover:border-primary/50 hover:bg-muted/50 hover:scale-[1.01]",
        "active:scale-[0.99]",
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 py-3 px-4">
        <div className="shrink-0">
          <HugeiconsIcon icon={icon} className="size-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="size-4 text-muted-foreground shrink-0"
          strokeWidth={2}
        />
      </CardContent>
    </Card>
  )
}

function RouteComponent() {
  useSiteHeader({ title: "Appearance", titleMode: "append" })
  const navigate = useNavigate()
  const profileData = useSelectedProfile()
  const profile = profileData?.profile
  const [aiLoading, setAiLoading] = useState(false)

  const startChatWithAI = async () => {
    try {
      if (!profile) {
        throw new Error("Profile not selected")
      }

      setAiLoading(true)
      const { threadId } = await apiClient.startThemeDesigner(profile.id)
      await navigate({ to: "/design/theme/$threadId", params: { threadId } })
    } catch (error) {
      console.error(error)
      toast.error("Could not start a conversation with the AI")
    } finally {
      setAiLoading(false)
    }
  }

  if (!profile) {
    return null
  }

  const isCustomTheme = profile.theme === "Custom"
  const currentThemeName = isCustomTheme ? "Custom" : profile.theme
  const themeColors = [
    profile.backgroundColor,
    profile.textColor,
    profile.buttonColor,
    profile.buttonTextColor,
  ]

  return (
    <div className="max-w-md space-y-6">
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Current Style
        </h2>
        <Card className="border bg-muted/30">
          <CardContent className="py-4 px-4 space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Active Theme</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold">{currentThemeName}</p>
                <div className="flex gap-1.5">
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {buttonShapeLabels[profile.buttonShape]}
                  </span>
                  <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                    {buttonStyleLabels[profile.buttonStyle]}
                  </span>
                </div>
              </div>
            </div>

            <ColorSwatches
              colors={themeColors}
              fontFamily={profile.fontFamily}
            />
          </CardContent>
        </Card>
      </div>

      {/* Section: Let AI Do The Work */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          AI Assisted
        </h2>

        {/* Magic Button */}
        <GenerateThemeButton profileId={profile.id} />

        {/* Chat Entry */}
        <Card
          className={cn(
            "cursor-pointer transition-all duration-200",
            "hover:border-primary/50 hover:bg-muted/50 hover:scale-[1.01]",
            "active:scale-[0.99]",
          )}
          onClick={!aiLoading ? startChatWithAI : undefined}
        >
          <CardContent className="flex items-center gap-3 py-3 px-4">
            {aiLoading ? (
              <Spinner className="size-5" />
            ) : (
              <HugeiconsIcon
                icon={MessageSquare}
                className="size-5 text-primary"
              />
            )}
            <span className="font-medium text-sm flex-1">
              Talk to AI Designer
            </span>
            {!aiLoading && (
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-4 text-muted-foreground"
                strokeWidth={2}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section: Do It Yourself */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Manual Controls
        </h2>

        <div className="flex flex-col gap-3">
          <NavigationCard
            icon={Image}
            title="Browse Theme Gallery"
            subtitle="Pick from 20+ pre-designed styles."
            onClick={() => navigate({ to: "/bio/appearance/themes" })}
          />
          <NavigationCard
            icon={SlidersHorizontal}
            title="Customize Everything"
            subtitle="Fine-tune colors, fonts, shapes, and backgrounds."
            onClick={() => navigate({ to: "/bio/appearance/customize" })}
          />
        </div>
      </div>
    </div>
  )
}
