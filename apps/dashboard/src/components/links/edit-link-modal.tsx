import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { EditLinkForm } from "./edit-link-form"
import { useProfileWithLinks, useUpdateLink } from "@/hooks/queries"
import { useSelectedProfileId } from "@/stores/profiles"

export function EditLinkModal({
  open,
  onClose,
  linkId,
}: {
  open: boolean
  onClose: () => void
  linkId: string
}) {
  const profileId = useSelectedProfileId()
  const { data } = useProfileWithLinks(profileId)
  const updateLink = useUpdateLink()
  const link = data?.links.find((item) => item.id === linkId)

  const handleSubmit = async (values: {
    title: string
    url: string | null
  }) => {
    if (!profileId) return
    await updateLink.mutateAsync({
      id: linkId,
      profileId,
      title: values.title,
      url: values.url,
    })
    onClose()
  }

  if (!link) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Link</DialogTitle>
        </DialogHeader>

        <EditLinkForm
          defaultValues={{
            title: link.title,
            url: link.url ?? null,
          }}
          onSubmit={handleSubmit}
          onCancel={onClose}
          editUrl={link.type !== "form"}
        />
      </DialogContent>
    </Dialog>
  )
}
