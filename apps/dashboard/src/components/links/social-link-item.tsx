import { useSortable } from "@dnd-kit/react/sortable"
import { HugeiconsIcon } from "@hugeicons/react"
import { type ReactNode, type Ref, useMemo, useRef, useState } from "react"
import { socialConfig } from "@/lib/social-links"
import { cn } from "@/lib/utils"

export function SortableSocialLinkItem({
  index,
  link,
}: {
  index: number
  link: Link
}) {
  const [element, setElement] = useState<Element | null>(null)
  const handleRef = useRef<HTMLButtonElement | null>(null)
  const { isDragging } = useSortable({
    id: link.id,
    index,
    element,
    handle: handleRef,
  })

  return (
    <SocialLinkItem
      sortable
      link={link}
      handleRef={handleRef}
      setElement={setElement}
      isDragging={isDragging}
    />
  )
}

export function SocialLinkItem({
  link,
  actions,
  sortable,
  handleRef: _handleRef,
  setElement,
  isDragging: _isDragging,
}: {
  link: Link
  actions?: ReactNode
  setElement?: (element: Element | null) => void
  handleRef?: Ref<HTMLButtonElement>
  sortable?: boolean
  isDragging?: boolean
}) {
  const platformConfig = useMemo(() => socialConfig[link.platform!], [link])

  return (
    <li
      ref={setElement}
      key={link.id}
      className={cn(
        "size-16 border border-border/60 rounded-lg p-3 relative overflow-hidden",
        "bg-gradient-to-br from-muted/50 to-muted/30",
        "hover:border-border/80",
        "transition-colors duration-200",
        "group",
      )}
    >
      <HugeiconsIcon
        icon={platformConfig.icon}
        className="w-full h-full transition-transform duration-200 group-hover:scale-105"
      />

      <div className="absolute -top-2 -right-2">{!sortable && actions}</div>
    </li>
  )
}
