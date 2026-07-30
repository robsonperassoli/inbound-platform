import { move } from "@dnd-kit/helpers"
import { DragDropProvider } from "@dnd-kit/react"
import { Tick01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { AddLinkModal } from "@/components/add-link-modal"
import { ScrollableContainer } from "@/components/app-layout/scrollable-container"
import { PublishBanner } from "@/components/bio/publish-banner"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { CreateFormPrompt } from "@/components/forms/create-form-prompt"
import { AddSocialLinkModal } from "@/components/links/add-social-link-modal"
import { CreateLinkButton } from "@/components/links/create-link-button"
import { EditLinkModal } from "@/components/links/edit-link-modal"
import { EmptyLinksList } from "@/components/links/empty-links-list"
import {
  LinkListItem,
  SortableLinkListItem,
} from "@/components/links/link-list-item"
import { LinkListItemActions } from "@/components/links/link-list-item-actions"
import {
  SocialLinkItem,
  SortableSocialLinkItem,
} from "@/components/links/social-link-item"
import { useSiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  useDeleteLink,
  useReorderLinks,
  useUpdateLink,
} from "@/hooks/queries/links"
import { useSelectedProfile } from "@/hooks/use-selected-profile"
import type { Link } from "@/lib/types"

export const Route = createFileRoute("/_authenticated/bio/")({
  component: RouteComponent,
})

function RouteComponent() {
  const profileData = useSelectedProfile()
  const navigate = useNavigate()
  const links = profileData?.links
  const profile = profileData?.profile
  const updateLink = useUpdateLink()
  const removeLink = useDeleteLink()
  const reorderLinksMutation = useReorderLinks()
  const [openModal, setOpenModal] = useState<
    "add-link" | "add-social" | "add-form-link" | "edit-link" | null
  >(null)
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null)
  const [linkToDelete, setLinkToDelete] = useState<Link | null>(null)
  const [sortMode, setSortMode] = useState<"social" | "buttons" | null>(null)

  const headerActions = useMemo(
    () => [
      <CreateLinkButton
        key="add-link"
        onAddLink={() => setOpenModal("add-link")}
        onAddSocial={() => setOpenModal("add-social")}
        onAddAiLeadCapture={() => setOpenModal("add-form-link")}
      />,
    ],
    [],
  )

  useSiteHeader({
    title: "Links",
    titleMode: "append",
    actions: headerActions,
  })

  const buttonLinks = useMemo(
    () => (links ? links.filter((l) => l.type !== "social") : []),
    [links],
  )

  const socialLinks = useMemo(
    () => (links ? links.filter((l) => l.type === "social") : []),
    [links],
  )

  const nextButtonOrder = useMemo(
    () => (buttonLinks.at(-1)?.order ?? 0) + 1,
    [buttonLinks],
  )

  if (!profile) {
    return null
  }

  const handleConfirmDelete = () => {
    if (!linkToDelete) return

    const link = linkToDelete
    void removeLink
      .mutateAsync({ id: link.id, profileId: profile.id })
      .finally(() => {
        setLinkToDelete(null)
      })
  }

  const onLinkEdit = (link: Link) => {
    setSelectedLinkId(link.id)
    setOpenModal("edit-link")
  }

  const toggleActive = (link: Link) => {
    updateLink.mutate({
      id: link.id,
      profileId: profile.id,
      active: !link.active,
    })
  }

  return (
    <ScrollableContainer className="p-px md:p-px space-y-5">
      <PublishBanner />

      {links === undefined && (
        <Card className="border-border/60 bg-muted/20">
          <CardContent className="py-10 text-sm text-muted-foreground">
            Loading links...
          </CardContent>
        </Card>
      )}

      {links?.length === 0 && (
        <EmptyLinksList onAddlinkClick={() => setOpenModal("add-link")} />
      )}

      {buttonLinks.length > 0 && (
        <Card className="gap-0! py-0! overflow-hidden border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <CardContent className="p-0">
            <DragDropProvider
              onDragEnd={(e) => {
                const orderedIds = move(buttonLinks, e).map(({ id }) => id)
                reorderLinksMutation.mutate({
                  profileId: profile.id,
                  orderedIds,
                })
              }}
            >
              <ul>
                {buttonLinks.map((link, index) =>
                  sortMode === "buttons" ? (
                    <SortableLinkListItem
                      key={link.id}
                      link={link}
                      index={index}
                    />
                  ) : (
                    <LinkListItem
                      key={link.id}
                      link={link}
                      actions={
                        <LinkListItemActions
                          viewMode="normal"
                          link={link}
                          onEdit={() => onLinkEdit(link)}
                          onDelete={() => setLinkToDelete(link)}
                          onReorder={() => setSortMode("buttons")}
                          onToggleActive={() => toggleActive(link)}
                          onEditForm={
                            link.formId
                              ? () =>
                                  navigate({
                                    to: "/forms/$id/settings",
                                    params: { id: link.formId! },
                                  })
                              : undefined
                          }
                        />
                      }
                    />
                  ),
                )}
              </ul>
            </DragDropProvider>
          </CardContent>
        </Card>
      )}

      {socialLinks.length > 0 && (
        <Card className="gap-0! py-0! overflow-hidden border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <CardContent className="p-0">
            <DragDropProvider
              onDragEnd={(e) => {
                const orderedIds = move(socialLinks, e).map(({ id }) => id)
                reorderLinksMutation.mutate({
                  profileId: profile.id,
                  orderedIds,
                })
              }}
            >
              <ul className="p-2 flex gap-x-2">
                {socialLinks.map((link, index) =>
                  sortMode === "social" ? (
                    <SortableSocialLinkItem
                      key={link.id}
                      link={link}
                      index={index}
                    />
                  ) : (
                    <SocialLinkItem
                      key={link.id}
                      link={link}
                      actions={
                        <LinkListItemActions
                          viewMode="compact"
                          link={link}
                          onEdit={() => onLinkEdit(link)}
                          onDelete={() => setLinkToDelete(link)}
                          onReorder={() => setSortMode("social")}
                          onToggleActive={() => toggleActive(link)}
                          onEditForm={
                            link.formId
                              ? () =>
                                  navigate({
                                    to: "/forms/$id/settings",
                                    params: { id: link.formId! },
                                  })
                              : undefined
                          }
                        />
                      }
                    />
                  ),
                )}
              </ul>
            </DragDropProvider>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {links ? `${links.length} total links` : ""}
        </div>
        {sortMode !== null && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSortMode(null)}
          >
            <HugeiconsIcon icon={Tick01Icon} /> Done
          </Button>
        )}
      </div>

      <AddLinkModal
        open={openModal === "add-link"}
        onClose={() => setOpenModal(null)}
        order={nextButtonOrder}
        profileId={profile.id}
      />

      <AddSocialLinkModal
        open={openModal === "add-social"}
        onClose={() => setOpenModal(null)}
        order={nextButtonOrder}
        profileId={profile.id}
      />

      <CreateFormPrompt
        open={openModal === "add-form-link"}
        onClose={() => setOpenModal(null)}
      />

      {selectedLinkId && (
        <EditLinkModal
          linkId={selectedLinkId}
          onClose={() => {
            setOpenModal(null)
            setSelectedLinkId(null)
          }}
          open={openModal === "edit-link"}
        />
      )}

      <ConfirmationDialog
        open={linkToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setLinkToDelete(null)
        }}
        title="Delete link"
        description={
          linkToDelete
            ? `Remove "${linkToDelete.title}" from your links? This action cannot be undone.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete"
        confirmVariant="destructive"
        confirming={removeLink.isPending}
        onConfirm={handleConfirmDelete}
      />
    </ScrollableContainer>
  )
}
