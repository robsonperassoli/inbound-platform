import { ArrowUp02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { type KeyboardEvent, useMemo, useRef, useState } from "react"
import TextareaAutosize from "react-textarea-autosize"
import { cn } from "../lib/utils"

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
    <div className="flex h-full w-full flex-col items-center py-4">
      <div className="flex w-full flex-1 grow flex-col-reverse gap-y-4 overflow-auto scroll-smooth py-8 pr-2 pl-4">
        {(lastMessage?.status === "pending" ||
          lastMessage?.status === "streaming") &&
        !lastMessage.content ? (
          <div className="mx-auto w-full max-w-prose">
            <p className="animate-pulse italic text-teal-700">Thinking...</p>
          </div>
        ) : null}
        {reversedMessages.map((item) => {
          const isUserMessage = item.role === "user"

          return (
            <div
              key={item.id}
              className={cn("w-full", isUserMessage && "flex justify-end")}
            >
              <div
                className={cn(
                  "whitespace-pre-wrap text-sm",
                  isUserMessage
                    ? "max-w-[min(75%,36rem)] rounded-2xl rounded-br-md border border-teal-700/20 bg-teal-700/10 px-4 py-3 shadow-sm"
                    : "mx-auto w-full max-w-prose",
                )}
              >
                {item.content}
              </div>
            </div>
          )
        })}
      </div>
      <div className="w-full shrink-0 px-4">
        <form
          ref={formRef}
          className="flex items-end gap-2 rounded-2xl border bg-white/70 p-2 shadow-sm backdrop-blur"
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
            className="min-h-10 w-full resize-none rounded-md bg-transparent px-3 py-2.5 text-sm outline-none"
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
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white disabled:opacity-50"
          >
            <HugeiconsIcon icon={ArrowUp02Icon} size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}
