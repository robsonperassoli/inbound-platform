import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { ChatMessageContent } from "@/components/chat-message-content"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { apiClient } from "@/lib/api"
import { cn } from "@/lib/utils"

export const Route = createFileRoute(
  "/_authenticated/forms/$id/submissions/$submissionId/transcript",
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id, submissionId } = Route.useParams()
  const navigate = useNavigate()
  const transcriptQuery = useQuery({
    queryKey: ["transcript", id, submissionId],
    queryFn: () => apiClient.getSubmissionTranscript(id, submissionId),
  })

  const messages = transcriptQuery.data?.messages

  const reversedMessages = useMemo(
    () => (messages ? messages.toReversed() : []),
    [messages],
  )

  return (
    <Sheet
      modal={false}
      open
      onOpenChange={() =>
        navigate({
          to: "/forms/$id/submissions",
          params: { id },
          replace: true,
        })
      }
    >
      <SheetContent>
        <div className="flex flex-col-reverse gap-y-4 overflow-auto p-4">
          {transcriptQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading transcript...</p>
          ) : reversedMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          ) : (
            reversedMessages.map((message) => {
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
                        : "w-full max-w-prose",
                    )}
                  >
                    {message.content}
                  </ChatMessageContent>
                </div>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
