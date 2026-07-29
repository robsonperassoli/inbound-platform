import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"

export const EmptyLinksList = ({
  onAddlinkClick,
}: {
  onAddlinkClick: () => void
}) => {
  return (
    <Card className="border-border/60 bg-muted/20">
      <CardContent className="flex flex-col gap-3 py-10">
        <p className="text-sm text-muted-foreground">
          No links yet. Add your first link to start building your page.
        </p>
        <div>
          <Button size="sm" onClick={onAddlinkClick}>
            <HugeiconsIcon icon={PlusSignIcon} />
            Add first link
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
