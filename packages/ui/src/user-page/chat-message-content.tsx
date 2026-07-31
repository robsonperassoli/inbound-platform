import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "../lib/utils"

export function ChatMessageContent({
  children,
  className,
  tone = "default",
}: {
  children: string
  className?: string
  tone?: "default" | "onAccent"
}) {
  return (
    <div
      className={cn(
        "prose prose-sm prose-code:before:content-none prose-code:after:content-none prose-table:text-sm",
        tone === "onAccent"
          ? "text-up-button-foreground prose-headings:text-up-button-foreground prose-strong:text-up-button-foreground prose-a:text-up-button-foreground prose-a:underline prose-code:text-up-button-foreground prose-pre:bg-up-button-foreground/10 prose-pre:text-up-button-foreground prose-blockquote:text-up-button-foreground/80 prose-blockquote:border-up-button-foreground/25 prose-hr:border-up-button-foreground/25 prose-li:marker:text-up-button-foreground/65 prose-th:text-up-button-foreground prose-td:text-up-button-foreground"
          : "text-up-foreground prose-headings:text-up-foreground prose-strong:text-up-foreground prose-a:text-up-button hover:prose-a:brightness-110 prose-code:text-up-foreground prose-pre:bg-[var(--chat-elevated)] prose-pre:text-up-foreground prose-blockquote:text-[color:var(--chat-muted)] prose-blockquote:border-[color:var(--chat-border)] prose-hr:border-[color:var(--chat-border)] prose-li:marker:text-[color:var(--chat-muted)] prose-th:text-up-foreground prose-td:text-up-foreground",
        className,
      )}
    >
      <Markdown remarkPlugins={[remarkGfm]}>{children}</Markdown>
    </div>
  )
}
