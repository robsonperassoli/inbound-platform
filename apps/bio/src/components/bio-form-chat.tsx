import type { ChatMessage } from "@inbound/ui"
import { ChatPopup } from "@inbound/ui"
import { useCallback, useEffect, useState } from "react"
import { apiUrl } from "@/lib/api"

type SessionMessage = ChatMessage & {
  status?: "pending" | "complete" | "streaming" | "error"
}

export function BioFormChat({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(true)
  const [messages, setMessages] = useState<SessionMessage[]>([])

  const loadMessages = useCallback(async () => {
    const response = await fetch(
      `${apiUrl()}/public/form-sessions/${sessionId}/messages`,
    )
    if (!response.ok) return
    const data = (await response.json()) as { messages: SessionMessage[] }
    setMessages(data.messages)
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
        await fetch(`${apiUrl()}/public/form-sessions/${sessionId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        })
        await loadMessages()
      }}
    />
  )
}
