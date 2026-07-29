import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

export function ChatMessageContent({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div
      className={cn(
        className,
        "prose prose-sm text-foreground dark:prose-invert prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:text-muted-foreground prose-blockquote:border-border prose-hr:border-border prose-li:marker:text-muted-foreground prose-table:text-sm prose-th:text-foreground prose-td:text-foreground",
      )}
    >
      <Markdown remarkPlugins={[remarkGfm]}>{children}</Markdown>
    </div>
  )
}
