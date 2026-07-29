import type { ChatMessage } from "@inbound/ui"
import { ChatPopup } from "@inbound/ui"
import { useCallback, useEffect, useState } from "react"
import { getFormSessionMessages, sendFormSessionMessage } from "@/lib/api"

type SessionMessage = ChatMessage & {
  status?: "pending" | "complete" | "streaming" | "error"
}

export function BioFormChat({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(true)
  const [messages, setMessages] = useState<SessionMessage[]>([])

  const loadMessages = useCallback(async () => {
    try {
      const data = await getFormSessionMessages(sessionId)
      setMessages(
        data.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          status: message.status,
        })),
      )
    } catch {
      // Ignore transient poll failures while streaming.
    }
  }, [sessionId])

  useEffect(() => {
    void loadMessages()
  }, [loadMessages])

  useEffect(() => {
    const isStreaming = messages.some((m) => m.status === "streaming")
    if (!isStreaming) return
    const id = window.setInterval(() => {
      void loadMessages()
    }, 500)
    return () => window.clearInterval(id)
  }, [messages, loadMessages])

  return (
    <ChatPopup
      sessionId={sessionId}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      messages={messages}
      sendMessage={async (message) => {
        await sendFormSessionMessage(sessionId, message)
        await loadMessages()
      }}
    />
  )
}
