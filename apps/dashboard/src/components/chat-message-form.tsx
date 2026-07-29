import { ArrowUp02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { type KeyboardEvent, useRef, useState } from "react"
import TextareaAutosize from "react-textarea-autosize"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group"

export function ChatMessageForm({
  onSubmit,
  className,
}: {
  onSubmit: (message: string) => Promise<void>
  className?: string
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [message, setMessage] = useState("")

  return (
    <form
      ref={formRef}
      onSubmit={async (e) => {
        e.preventDefault()

        if (message.trim().length === 0) {
          return
        }

        await onSubmit(message)
        setMessage("")
      }}
      className={className}
    >
      <InputGroup>
        <TextareaAutosize
          data-slot="input-group-control"
          className="flex field-sizing-content min-h-16 w-full resize-none rounded-md bg-transparent px-3 py-2.5 text-base transition-[color,box-shadow] outline-none md:text-sm"
          placeholder="type your question here..."
          value={message}
          onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key === "Enter" && !event.shiftKey && formRef.current) {
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
  )
}
