import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type CreateLinkButtonProps = {
  onAddLink: () => void
  onAddSocial: () => void
  onAddAiLeadCapture: () => void
}

export function CreateLinkButton({
  onAddLink,
  onAddSocial,
  onAddAiLeadCapture,
}: CreateLinkButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          <HugeiconsIcon icon={PlusSignIcon} />
          Add Button
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Add Button</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex flex-col items-start gap-0.5 py-2"
          onSelect={() => onAddLink()}
        >
          <div className="text-sm font-medium leading-none">Add a link</div>
          <div className="text-xs text-muted-foreground">
            Add a title and destination to your bio page
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="flex flex-col items-start gap-0.5 py-2"
          onSelect={() => onAddSocial()}
        >
          <div className="text-sm font-medium leading-none">Add social</div>
          <div className="text-xs text-muted-foreground">
            Add social links for Instagram, TikTok, X, and more
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="flex flex-col items-start gap-0.5 py-2"
          onSelect={() => onAddAiLeadCapture()}
        >
          <div className="text-sm font-medium leading-none">
            Add AI lead capture
          </div>
          <div className="text-xs text-muted-foreground">
            Create a conversational flow that collects and qualifies leads
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
