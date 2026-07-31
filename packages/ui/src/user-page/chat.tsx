import { ArrowUp02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { type KeyboardEvent, useMemo, useRef, useState } from "react"
import TextareaAutosize from "react-textarea-autosize"
import { cn } from "../lib/utils"
import { ChatMessageContent } from "./chat-message-content"

export type ChatMessage = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  status?: "pending" | "complete" | "streaming" | "error"
}

export function Chat({
  messages,
  sendMessage,
}: {
  messages: ChatMessage[]
  sendMessage: (message: string) => Promise<void>
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const lastMessage = useMemo(() => {
    if (!messages.length) return null
    return messages[messages.length - 1]
  }, [messages])

  const reversedMessages = useMemo(
    () => Array.from(messages).reverse(),
    [messages],
  )

  return (
    <div className="flex h-full w-full flex-col text-up-foreground">
      <div
        className={cn(
          "flex w-full flex-1 grow flex-col-reverse gap-y-3 overflow-auto scroll-smooth px-4 py-5",
          "[&::-webkit-scrollbar]:w-1.5",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:bg-[color:color-mix(in_srgb,var(--color-up-foreground)_28%,transparent)]",
          "[&::-webkit-scrollbar-thumb:hover]:bg-[color:color-mix(in_srgb,var(--color-up-foreground)_42%,transparent)]",
        )}
      >
        {(lastMessage?.status === "pending" ||
          lastMessage?.status === "streaming") &&
        !lastMessage.content ? (
          <div className="w-full max-w-prose">
            <p
              className="animate-pulse text-sm italic"
              style={{ color: "var(--chat-muted)" }}
            >
              Thinking...
            </p>
          </div>
        ) : null}
        {reversedMessages.map((item) => {
          const isUserMessage = item.role === "user"

          return (
            <div
              key={item.id}
              className={cn("w-full", isUserMessage && "flex justify-end")}
            >
              <ChatMessageContent
                className={cn(
                  "max-w-[min(85%,22rem)]",
                  isUserMessage
                    ? "rounded-2xl rounded-br-md bg-up-button px-3.5 py-2.5 shadow-sm prose-p:my-0"
                    : "px-0.5 py-0.5",
                )}
                tone={isUserMessage ? "onAccent" : "default"}
              >
                {item.content}
              </ChatMessageContent>
            </div>
          )
        })}
      </div>
      <div className="w-full shrink-0 border-t border-[color:var(--chat-border)] px-3 py-3">
        <form
          ref={formRef}
          className="flex items-end gap-2 rounded-2xl border border-[color:var(--chat-border)] bg-[var(--chat-elevated)] p-1.5 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault()
            if (message.trim().length === 0 || sending) return
            setSending(true)
            try {
              await sendMessage(message)
              setMessage("")
            } finally {
              setSending(false)
            }
          }}
        >
          <TextareaAutosize
            className="min-h-10 w-full resize-none rounded-md bg-transparent px-3 py-2.5 text-sm text-up-foreground outline-none placeholder:text-[color:var(--chat-muted)]"
            placeholder="Answer here..."
            value={message}
            onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
              if (event.key === "Enter" && !event.shiftKey && formRef.current) {
                event.preventDefault()
                formRef.current.requestSubmit()
              }
            }}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={message.trim().length === 0 || sending}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-up-button text-up-button-foreground transition-opacity hover:brightness-105 disabled:opacity-40"
          >
            <HugeiconsIcon icon={ArrowUp02Icon} size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
