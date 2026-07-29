import { InformationCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { PlanFeature } from "@/lib/pricing-plans"

export function PlanFeatureLabel({ feature }: { feature: PlanFeature }) {
  if (typeof feature === "string") {
    return feature
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{feature.label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`More info about ${feature.label.toLowerCase()}`}
          >
            <HugeiconsIcon icon={InformationCircleIcon} size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          {feature.tooltip}
        </TooltipContent>
      </Tooltip>
    </span>
  )
}
