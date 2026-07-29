import {
  Delete02Icon,
  Edit02Icon,
  MoreHorizontal,
  Sorting01Icon,
  Sparkles,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LinkListItemActions({
  link,
  onEdit,
  onDelete,
  onReorder,
  onToggleActive,
  onEditForm,
  viewMode,
}: {
  link: Link
  onEdit: () => void
  onDelete: () => void
  onReorder: () => void
  onToggleActive: () => void
  onEditForm?: () => void
  viewMode: "normal" | "compact"
}) {
  return (
    <ButtonGroup>
      {viewMode === "normal" && (
        <Button size="sm" variant="outline" onClick={onEdit}>
          <HugeiconsIcon icon={Edit02Icon} size={16} className="mr-2" />
          Edit
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size={viewMode === "compact" ? "icon-sm" : "sm"}
            variant={viewMode === "compact" ? "ghost" : "outline"}
            className={viewMode === "normal" ? "pl-2!" : ""}
          >
            <HugeiconsIcon icon={MoreHorizontal} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            {viewMode === "compact" && (
              <DropdownMenuItem onClick={onEdit}>
                <HugeiconsIcon icon={Edit02Icon} size={16} className="mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {link.type === "form" && (
              <DropdownMenuItem onClick={onEditForm}>
                <HugeiconsIcon icon={Sparkles} size={16} className="mr-2" />
                Edit Form
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={onReorder}>
              <HugeiconsIcon icon={Sorting01Icon} size={16} className="mr-2" />
              Reorder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleActive}>
              <HugeiconsIcon
                icon={link.active ? ViewOffSlashIcon : ViewIcon}
                size={16}
                className="mr-2"
              />
              {link.active ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}
