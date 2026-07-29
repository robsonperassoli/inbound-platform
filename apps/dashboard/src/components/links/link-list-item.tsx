import { useSortable } from "@dnd-kit/react/sortable"
import {
  DatabaseLightningIcon,
  DragDropVerticalIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { type ReactNode, type Ref, useRef, useState } from "react"
import type { Link as ProfileLink } from "@/lib/types"
import { cn } from "@/lib/utils"

export function SortableLinkListItem({
  index,
  link,
}: {
  index: number
  link: ProfileLink
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
    <LinkListItem
      sortable
      link={link}
      handleRef={handleRef}
      setElement={setElement}
      isDragging={isDragging}
    />
  )
}

export function LinkListItem({
  link,
  actions,
  sortable,
  handleRef,
  setElement,
  isDragging,
}: {
  link: ProfileLink
  actions?: ReactNode
  setElement?: (element: Element | null) => void
  handleRef?: Ref<HTMLButtonElement>
  sortable?: boolean
  isDragging?: boolean
}) {
  return (
    <li
      ref={setElement}
      key={link.id}
      className={cn(
        "group grid border-b border-border/60 py-4 last:border-b-0 md:items-center",
        sortable
          ? "grid-cols-[1.5rem_auto] pr-5 pl-2 gap-2"
          : "grid-cols-[1fr_auto] px-5 gap-4",
        isDragging && "border-b-0",
      )}
    >
      {sortable && (
        <button
          type="button"
          ref={handleRef}
          className={cn(
            "rounded py-1 hover:bg-muted w-6",
            isDragging && "bg-muted",
          )}
        >
          <HugeiconsIcon icon={DragDropVerticalIcon} />
        </button>
      )}
      <div className="min-w-0 space-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold">{link.title}</span>
          <span
            className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
              link.active
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-border/60 bg-muted/40 text-muted-foreground"
            }`}
          >
            {link.active ? "Live" : "Hidden"}
          </span>
        </div>

        {link.type === "form" && link.formId ? (
          <div className="flex items-center gap-2 text-sm">
            <Link
              to="/forms/$id/submissions"
              params={{ id: link.formId }}
              className="flex gap-x-1 items-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <HugeiconsIcon icon={DatabaseLightningIcon} size={12} /> View
              collected data
            </Link>
          </div>
        ) : (
          <a
            href={link.url ?? undefined}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.url}
          </a>
        )}
      </div>

      {!sortable && actions}
    </li>
  )
}
