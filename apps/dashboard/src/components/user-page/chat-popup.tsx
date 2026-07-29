import { Chat01Icon, Close } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Popover } from "radix-ui"
import { cn } from "@/lib/utils"
import {
  useFormSessionMessages,
  useSendFormSessionMessage,
} from "@/hooks/queries/form-sessions"
import { Chat } from "./chat"

export function ChatPopup({
  sessionId,
  open,
  onClose,
  onOpen,
}: {
  sessionId: string
  open: boolean
  onOpen: () => void
  onClose: () => void
}) {
  const addMessage = useSendFormSessionMessage()
  const { data } = useFormSessionMessages(sessionId)

  return (
    <Popover.Root open={open}>
      <Popover.Anchor asChild>
        {sessionId && (
          <div className="fixed bottom-4 sm:bottom-10 right-4 sm:right-10">
            <button
              type="button"
              onClick={open ? onClose : onOpen}
              className={cn(
                "transition-all ease-in-out",
                !open &&
                  "h-10 w-24 flex items-center justify-center gap-x-1 bg-teal-700/70 hover:bg-teal-700/80 text-white rounded-full shadow-lg text-xs",
                open &&
                  "size-10 flex items-center justify-center p-1 bg-black/40 hover:bg-black/50 text-white rounded-full shadow-lg",
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
          className={cn(
            "relative isolate border rounded-2xl shadow-lg w-screen sm:w-full sm:max-w-sm h-[80vh] md:h-120 overflow-hidden",

            // gradients
            "text-slate-900 dark:text-slate-50",
            "backdrop-blur-xl backdrop-saturate-150",
            "bg-linear-to-br",
            "from-white/80 via-white/70 to-white/55",
            "dark:from-slate-950/65 dark:via-slate-950/55 dark:to-slate-950/40",
            "border border-white/40 dark:border-white/10",
            "shadow-[0_1px_0_rgba(255,255,255,0.55)_inset,0_24px_70px_rgba(2,6,23,0.22)]",

            // 'before:-z-10' to push the sheen behind the text
            "before:-z-10 before:pointer-events-none before:absolute before:inset-0 before:content-['']",
            "before:bg-[radial-gradient(70%_55%_at_20%_0%,rgba(255,255,255,0.75),transparent_60%)]",

            // 'after:-z-10' to push the vignette behind the text
            "after:-z-10 after:pointer-events-none after:absolute after:inset-0 after:content-['']",
            "after:bg-[radial-gradient(120%_90%_at_50%_110%,rgba(2,6,23,0.10),transparent_55%)]",
            "dark:after:bg-[radial-gradient(120%_90%_at_50%_110%,rgba(0,0,0,0.35),transparent_55%)]",

            // animations
            "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0",
            "data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=top]:slide-in-from-bottom-2",
          )}
        >
          <Chat
            messages={data?.messages ?? []}
            sendMessage={async (message: string) => {
              await addMessage.mutateAsync({ sessionId, message })
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
