"use client"

import {
  ArrowRight01Icon,
  Chart03Icon,
  LifeBuoy,
  ListViewIcon,
  PaintBoardIcon,
  Send,
  SparklesIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import type * as React from "react"
import { useState } from "react"
import logo from "@/assets/logo.svg"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { SidebarContactModals } from "@/components/sidebar-contact-modals"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useSession } from "@/hooks/use-session"
import {
  ProfileSwitcher,
  useProfileSwitcher,
} from "./app-layout/profile-switcher"
import { Skeleton } from "./ui/skeleton"

const data = {
  navMain: [
    {
      title: "Links",
      url: "/bio",
      icon: <HugeiconsIcon icon={ListViewIcon} strokeWidth={2} />,
      exact: true,
    },
    {
      title: "Appearance",
      url: "/bio/appearance",
      icon: <HugeiconsIcon icon={PaintBoardIcon} strokeWidth={2} />,
    },
    {
      title: "Profile",
      url: "/bio/settings",
      icon: <HugeiconsIcon icon={UserIcon} strokeWidth={2} />,
      exact: true,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: <HugeiconsIcon icon={Chart03Icon} strokeWidth={2} />,
      items: [],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [openModal, setOpenModal] = useState<"support" | "feedback" | null>(
    null,
  )
  const session = useSession()
  const { isMobile, state } = useSidebar()
  const { profile, profiles } = useProfileSwitcher()

  const secondaryItems = [
    {
      title: "Support",
      icon: <HugeiconsIcon icon={LifeBuoy} strokeWidth={2} />,
      onClick: () => setOpenModal("support"),
    },
    {
      title: "Feedback",
      icon: <HugeiconsIcon icon={Send} strokeWidth={2} />,
      onClick: () => setOpenModal("feedback"),
    },
  ]

  const shouldShowUpgradeCta = session?.subscribed === false
  const showCompactUpgradeCta =
    shouldShowUpgradeCta && !isMobile && state === "collapsed"
  const showFullUpgradeCta = shouldShowUpgradeCta && !showCompactUpgradeCta

  return (
    <>
      <Sidebar variant="inset" {...props}>
        {session ? (
          session.accountType === "team" ? (
            <ProfileSwitcher profiles={profiles} profile={profile} />
          ) : (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/bio"
                    className="shrink-0 text-sm font-semibold tracking-tight whitespace-nowrap"
                  >
                    <img src={logo} alt="Inbound logo" className="w-32" />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )
        ) : (
          <Skeleton className="w-full h-10" />
        )}

        <SidebarContent>
          <NavMain items={data.navMain} />

          <div className="mt-auto space-y-2">
            {showFullUpgradeCta && (
              <SidebarGroup className="pt-0 pb-0">
                <SidebarGroupContent>
                  <div className="rounded-3xl border border-sidebar-border/80 bg-linear-to-br from-sidebar-accent/90 via-sidebar to-sidebar-accent/60 p-3 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary/12 text-sidebar-primary">
                        <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                          Publish your profile
                        </p>
                        <p className="mt-1 text-xs leading-4.5 text-sidebar-foreground/75">
                          Pick a plan to go live and start collecting leads.
                        </p>
                      </div>
                    </div>

                    <Button
                      asChild
                      size="sm"
                      className="mt-3 w-full rounded-2xl"
                    >
                      <Link to="/upgrade">
                        See plans
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          strokeWidth={2}
                        />
                      </Link>
                    </Button>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {showCompactUpgradeCta && (
              <SidebarGroup className="pt-0 pb-0">
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        tooltip="Choose a plan to publish your profile"
                      >
                        <Link
                          to="/upgrade"
                          aria-label="Choose a plan to publish your profile"
                        >
                          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
                          <span>Publish your profile</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            <NavSecondary items={secondaryItems} />
          </div>
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      <SidebarContactModals openModal={openModal} onOpenChange={setOpenModal} />
    </>
  )
}
