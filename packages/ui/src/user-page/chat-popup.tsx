import { Chat01Icon, Close } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Popover } from "radix-ui"
import type { CSSProperties } from "react"
import { cn } from "../lib/utils"
import { Chat, type ChatMessage } from "./chat"

export type ChatPopupTheme = {
  backgroundColor: string
  textColor: string
  buttonColor: string
  buttonTextColor: string
}

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
  const themeStyle = {
    "--up-background": theme.backgroundColor,
    "--up-foreground": theme.textColor,
    "--up-button-background": theme.buttonColor,
    "--up-button-foreground": theme.buttonTextColor,
  } as CSSProperties

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
                "transition-all ease-in-out text-up-button-foreground rounded-full shadow-lg text-xs",
                !open &&
                  "h-10 w-24 flex items-center justify-center gap-x-1 bg-up-button/80 hover:bg-up-button",
                open &&
                  "size-10 flex items-center justify-center p-1 bg-up-foreground/40 hover:bg-up-foreground/50",
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
            "text-up-foreground",
            "backdrop-blur-xl backdrop-saturate-150",
            "bg-up-background/80",
            "border border-[color:color-mix(in_srgb,var(--color-up-foreground)_18%,transparent)]",
            "shadow-[0_1px_0_color-mix(in_srgb,var(--color-up-background)_55%,transparent)_inset,0_24px_70px_color-mix(in_srgb,var(--color-up-foreground)_22%,transparent)]",
            "before:-z-10 before:pointer-events-none before:absolute before:inset-0 before:content-['']",
            "before:bg-[radial-gradient(70%_55%_at_20%_0%,color-mix(in_srgb,var(--color-up-background)_75%,transparent),transparent_60%)]",
            "after:-z-10 after:pointer-events-none after:absolute after:inset-0 after:content-['']",
            "after:bg-[radial-gradient(120%_90%_at_50%_110%,color-mix(in_srgb,var(--color-up-foreground)_10%,transparent),transparent_55%)]",
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
