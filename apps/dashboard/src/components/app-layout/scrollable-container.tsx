import { cn } from "@/lib/utils"

export function ScrollableContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-4 md:p-6", className)}>
      {children}
    </div>
  )
}
