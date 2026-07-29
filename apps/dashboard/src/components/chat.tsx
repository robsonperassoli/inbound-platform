import { useMemo } from "react"
import type { ThreadMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ChatMessageContent } from "./chat-message-content"
import { ChatMessageForm } from "./chat-message-form"

export function Chat({
  viewType = "fullscreen",
  messages,
  sendMessage,
  chatActions,
}: {
  viewType?: "fullscreen" | "sidebar"
  messages: Array<
    ThreadMessage & {
      status?: "pending" | "complete" | "streaming" | "error"
    }
  >
  sendMessage: (message: string) => Promise<void>
  chatActions?: React.ReactNode
}) {
  const lastMessage = useMemo(() => {
    if (!messages) {
      return null
    }

    return messages[messages.length - 1]
  }, [messages])

  const reversedMessages = useMemo(
    () => (messages ? Array.from(messages).reverse() : []),
    [messages],
  )

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        viewType === "fullscreen" && "h-screen",
        viewType === "sidebar" && "self-stretch",
      )}
    >
      {chatActions}
      <div className="flex-1 overflow-auto grow flex flex-col-reverse w-full gap-y-4 py-4 pl-4 pr-2">
        {lastMessage?.status === "pending" && (
          <div className="w-full max-w-prose prose-sm mx-auto">
            <p className="italic animate-pulse text-primary">Thinking...</p>
          </div>
        )}
        {reversedMessages.map((message) => {
          const isUserMessage = message.role === "user"

          return (
            <div
              key={message.id}
              className={cn("w-full", isUserMessage && "flex justify-end")}
            >
              <ChatMessageContent
                className={cn(
                  isUserMessage
                    ? "max-w-[min(75%,36rem)] rounded-2xl rounded-br-md border border-primary/20 bg-primary/15 px-4 py-3 text-foreground shadow-sm prose-p:my-0 prose-headings:text-foreground prose-strong:text-foreground prose-a:text-foreground prose-code:text-foreground prose-blockquote:text-foreground/90 prose-li:marker:text-foreground/70"
                    : "max-w-prose w-full",
                )}
              >
                {message.content}
              </ChatMessageContent>
            </div>
          )
        })}
      </div>

      <div className="shrink-0 w-full px-4 pb-4">
        <ChatMessageForm
          onSubmit={sendMessage}
          className="w-full max-w-prose mx-auto"
        />
      </div>
    </div>
  )
}
