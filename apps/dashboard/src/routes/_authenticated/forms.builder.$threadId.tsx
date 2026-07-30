import { Tick02Icon, ViewIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import z from "zod"
import { Chat } from "@/components/chat"
import { EmptyFormPreview, FormPreview } from "@/components/form-preview"
import { useSiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { queryKeys } from "@/hooks/queries/keys"
import { useSendThreadMessage, useThread } from "@/hooks/queries/threads"

export const Route = createFileRoute("/_authenticated/forms/builder/$threadId")(
  {
    validateSearch: z.object({ returnTo: z.enum(["bio"]) }),
    component: RouteComponent,
    ssr: false,
  },
)

function RouteComponent() {
  useSiteHeader({ title: "Form Builder" })

  const { threadId } = Route.useParams()
  const { returnTo } = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data } = useThread(threadId)
  const thread = data?.thread
  const messages = data?.messages ?? []
  const isAgentBusy = messages.some(
    (m) => m.status === "pending" || m.status === "streaming",
  )

  // Catch the final updateForm / createForm link that may land just as the agent completes.
  useEffect(() => {
    if (isAgentBusy) return
    if (thread?.formId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.form(thread.formId),
      })
    }
    if (thread?.profileId) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.profile(thread.profileId),
      })
    }
  }, [isAgentBusy, thread?.formId, thread?.profileId, queryClient])

  const sendMessage = useSendThreadMessage()

  const onDoneClicked = async () => {
    if (returnTo === "bio") {
      await navigate({ to: "/bio" })
    }
  }

  return (
    <div className="flex flex-1">
      <div className="hidden sm:block grow overflow-auto p-4">
        {thread?.formId ? (
          <FormPreview
            formId={thread.formId}
            live={isAgentBusy}
            onDoneClicked={onDoneClicked}
          />
        ) : (
          <EmptyFormPreview />
        )}
      </div>

      <div className="w-full sm:w-96 border-l flex">
        <Chat
          viewType="sidebar"
          messages={messages}
          sendMessage={async (message) => {
            await sendMessage.mutateAsync({ threadId, message })
          }}
          chatActions={
            <div className="p-2 border-b w-full flex justify-between sm:hidden">
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" className="shadow" variant="outline">
                    <HugeiconsIcon icon={ViewIcon} /> Preview
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="start"
                  className="p-0 w-sm max-w-full overflow-hidden max-h-[70vh]"
                >
                  {thread?.formId ? (
                    <FormPreview
                      formId={thread.formId}
                      live={isAgentBusy}
                      onDoneClicked={onDoneClicked}
                    />
                  ) : (
                    <EmptyFormPreview />
                  )}
                </PopoverContent>
              </Popover>
              <Button size="sm" onClick={onDoneClicked}>
                <HugeiconsIcon icon={Tick02Icon} /> Done
              </Button>
            </div>
          }
        />
      </div>
    </div>
  )
}
