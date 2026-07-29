import { Tick02Icon, ViewIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { UserPagePreview } from "@/components/bio/user-page-preview"
import { Chat } from "@/components/chat"
import { useSiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { queryKeys, useThread } from "@/hooks/queries"
import { apiClient } from "@/lib/api"

export const Route = createFileRoute("/_authenticated/design/theme/$threadId")({
  component: RouteComponent,
  ssr: false,
})

function RouteComponent() {
  useSiteHeader({ title: "Theme Designer" })

  const { threadId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data } = useThread(threadId)
  const thread = data?.thread
  const messages = data?.messages ?? []

  const sendMessage = useMutation({
    mutationFn: (message: string) =>
      apiClient.sendThreadMessage(threadId, message),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.thread(threadId) }),
  })

  const onDoneClicked = async () => {
    await navigate({ to: "/bio" })
  }

  return (
    <div className="flex flex-1">
      <div className="hidden sm:block grow overflow-auto">
        {thread && thread.type === "themeDesigner" && thread.profileId && (
          <UserPagePreview profileId={thread.profileId} />
        )}
      </div>

      <div className="w-full sm:w-96 border-l flex">
        <Chat
          viewType="sidebar"
          messages={messages}
          sendMessage={async (message) => {
            await sendMessage.mutateAsync(message)
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
                  {thread &&
                    thread.type === "themeDesigner" &&
                    thread.profileId && (
                      <UserPagePreview profileId={thread.profileId} />
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
