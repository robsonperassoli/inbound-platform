import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, useLocation } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

type NavMainSubItem = {
  title: string
  url: string
}

type NavMainItemData = {
  title: string
  url: string
  icon: React.ReactNode
  items?: NavMainSubItem[]
  exact?: boolean
}

function isPathActive(pathname: string, url: string, exact = false) {
  if (exact) {
    return pathname === url
  }

  return pathname === url || pathname.startsWith(`${url}/`)
}

function NavMainItem({
  item,
  pathname,
}: {
  item: NavMainItemData
  pathname: string
}) {
  const { isMobile, setOpenMobile } = useSidebar()
  const hasSubItems = Boolean(item.items?.length)
  const isItemActive = isPathActive(pathname, item.url, item.exact)
  const isSubItemActive =
    item.items?.some((subItem) => isPathActive(pathname, subItem.url, true)) ??
    false
  const [isOpen, setIsOpen] = useState(isItemActive || isSubItemActive)

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  useEffect(() => {
    if (isItemActive || isSubItemActive) {
      setIsOpen(true)
    }
  }, [isItemActive, isSubItemActive])

  return (
    <Collapsible asChild open={isOpen} onOpenChange={setIsOpen}>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          tooltip={item.title}
          isActive={isItemActive || isSubItemActive}
        >
          <Link to={item.url} onClick={closeMobileSidebar}>
            {item.icon}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
        {hasSubItems ? (
          <>
            <CollapsibleTrigger asChild>
              <SidebarMenuAction className="data-[state=open]:rotate-90">
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                <span className="sr-only">Toggle</span>
              </SidebarMenuAction>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isPathActive(pathname, subItem.url, true)}
                    >
                      <Link to={subItem.url} onClick={closeMobileSidebar}>
                        <span>{subItem.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </>
        ) : null}
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function NavMain({ items }: { items: NavMainItemData[] }) {
  const { pathname } = useLocation()

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <NavMainItem key={item.title} item={item} pathname={pathname} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
