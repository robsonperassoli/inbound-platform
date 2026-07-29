import {
  ArrowRight01Icon,
  Rocket01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePublishProfile } from "@/hooks/queries/profiles"
import { useSelectedProfile } from "@/hooks/use-selected-profile"
import { useSession } from "@/hooks/use-session"

export function PublishBanner() {
  const profileData = useSelectedProfile()
  const profile = profileData?.profile
  const session = useSession()
  const publishProfile = usePublishProfile()
  const [isPublishing, setIsPublishing] = useState(false)

  if (!profile || profile.publishedAt) {
    return null
  }

  const hasActiveSubscription = Boolean(session?.subscribed)

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      await publishProfile.mutateAsync(profile.id)
      toast.success("Your profile is now live.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to publish profile",
      )
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="flex flex-row items-center justify-between gap-3 rounded-lg border border-primary/15 bg-primary/8 px-3.5 py-2 sm:px-4">
      <div className="min-w-0 flex flex-1 items-center gap-2">
        <Badge
          variant="outline"
          className="h-4.5 shrink-0 border-primary/20 bg-primary/8 px-2 text-[11px] text-primary"
        >
          <HugeiconsIcon
            icon={hasActiveSubscription ? Rocket01Icon : SparklesIcon}
            strokeWidth={2}
          />
          Draft
        </Badge>
        <p className="min-w-0 text-sm text-foreground">
          <span className="font-semibold">Your profile is ready.</span> Publish
          to make it live for visitors.
        </p>
      </div>

      <div className="flex shrink-0 items-center">
        {session === undefined ? (
          <Button size="sm" disabled>
            Loading...
          </Button>
        ) : hasActiveSubscription ? (
          <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? "Publishing…" : "Publish"}
          </Button>
        ) : (
          <Button size="sm" asChild>
            <Link to="/upgrade">
              Publish
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
