"use client"

import {  ViewIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Spinner } from "@/components/ui/spinner"

export function ImagePreview({ url }: { url: string }) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="secondary" size="icon">
          <HugeiconsIcon icon={ViewIcon} />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="p-0 w-auto" side="top" align="center">
        <div className="w-64 h-48 overflow-hidden rounded-xl relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
              <Spinner className="size-8" />
            </div>
          )}
          <img
            src={url}
            alt="Preview"
            className="w-full h-full object-cover relative z-10"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
