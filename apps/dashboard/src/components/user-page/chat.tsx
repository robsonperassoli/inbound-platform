import { ArrowUp02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { type KeyboardEvent, useMemo, useRef, useState } from "react"
import TextareaAutosize from "react-textarea-autosize"
import type { ThreadMessage } from "@/api/threads"
import { cn } from "@/lib/utils"
import { ChatMessageContent } from "../chat-message-content"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "../ui/input-group"

export function Chat({
  messages,
  sendMessage,
}: {
  messages: Array<
    ThreadMessage & {
      status?: "pending" | "complete" | "streaming" | "error"
    }
  >
  sendMessage: (message: string) => Promise<void>
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [message, setMessage] = useState("")

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
    <div className={cn("flex flex-col items-center w-full h-full py-4")}>
      <div className="flex-1 grow scroll-smooth overflow-auto pl-4 pr-2 flex flex-col-reverse w-full gap-y-4 py-8">
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
                    : "w-full mx-auto",
                )}
              >
                {message.content}
              </ChatMessageContent>
            </div>
          )
        })}
      </div>
      <div className="shrink-0 w-full px-4">
        <form
          ref={formRef}
          onSubmit={async (e) => {
            e.preventDefault()

            if (message.trim().length === 0) {
              return
            }

            await sendMessage(message)
            setMessage("")
          }}
        >
          <InputGroup>
            <TextareaAutosize
              data-slot="input-group-control"
              className="flex field-sizing-content min-h-10 w-full resize-none rounded-md bg-transparent px-3 py-2.5 text-base transition-[color,box-shadow] outline-none md:text-sm"
              placeholder="Answer here..."
              value={message}
              onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  formRef.current
                ) {
                  event.preventDefault()

                  formRef.current.requestSubmit()
                }
              }}
              onChange={(e) => setMessage(e.target.value)}
            />
            <InputGroupAddon align="block-end">
              <InputGroupButton
                className="ml-auto"
                size="icon-sm"
                variant="default"
                type="submit"
                disabled={message.trim().length === 0}
              >
                <HugeiconsIcon icon={ArrowUp02Icon} />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>
    </div>
  )
}
