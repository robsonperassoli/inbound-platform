import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "../lib/utils"

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
        "prose prose-sm text-up-foreground prose-headings:text-up-foreground prose-strong:text-up-foreground prose-a:text-up-button hover:prose-a:text-up-button/80 prose-code:text-up-foreground prose-code:before:content-none prose-code:after:content-none prose-pre:bg-up-button/10 prose-pre:text-up-foreground prose-blockquote:text-up-foreground/70 prose-blockquote:border-up-foreground/20 prose-hr:border-up-foreground/20 prose-li:marker:text-up-foreground/60 prose-table:text-sm prose-th:text-up-foreground prose-td:text-up-foreground",
      )}
    >
      <Markdown remarkPlugins={[remarkGfm]}>{children}</Markdown>
    </div>
  )
}
