import { Chat01Icon, Close } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Popover } from "radix-ui"
import { cn } from "../lib/utils"
import { Chat, type ChatMessage } from "./chat"
import { getChatThemeStyle, type ChatPopupTheme } from "./chat-theme"

export type { ChatPopupTheme }

export function ChatPopup({
  sessionId,
  open,
  onClose,
  onOpen,
  messages = [],
  sendMessage,
  theme,
}: {
  sessionId: string
  open: boolean
  onOpen: () => void
  onClose: () => void
  messages?: ChatMessage[]
  sendMessage?: (message: string) => Promise<void>
  theme: ChatPopupTheme
}) {
  const themeStyle = getChatThemeStyle(theme)

  return (
    <Popover.Root open={open}>
      <Popover.Anchor asChild>
        {sessionId && (
          <div
            className="fixed bottom-4 sm:bottom-10 right-4 sm:right-10"
            style={themeStyle}
          >
            <button
              type="button"
              onClick={open ? onClose : onOpen}
              className={cn(
                "transition-all ease-in-out rounded-full shadow-lg text-xs",
                "bg-up-button text-up-button-foreground hover:brightness-105",
                !open &&
                  "h-10 w-24 flex items-center justify-center gap-x-1",
                open && "size-10 flex items-center justify-center p-1",
              )}
            >
              <HugeiconsIcon
                icon={open ? Close : Chat01Icon}
                size={20}
                strokeWidth={2}
              />
              {!open && "Continue"}
            </button>
          </div>
        )}
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          align="end"
          side="top"
          sideOffset={10}
          style={themeStyle}
          className={cn(
            "relative isolate rounded-2xl w-screen sm:w-full sm:max-w-sm h-[80vh] md:h-120 overflow-hidden",
            "bg-[var(--chat-surface)] text-up-foreground",
            "border border-[color:var(--chat-border)]",
            "shadow-[0_24px_70px_var(--chat-shadow)]",
            "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0",
            "data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=top]:slide-in-from-bottom-2",
          )}
        >
          <Chat
            messages={messages}
            sendMessage={async (message: string) => {
              await sendMessage?.(message)
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
