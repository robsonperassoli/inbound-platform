import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader, SiteHeaderProvider } from "./site-header"
import { Toaster } from "./ui/sonner"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteHeaderProvider>
      <SidebarProvider
        style={
          {
            // "--sidebar-width": "calc(var(--spacing) * 64)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
        className="h-screen flex overflow-hidden"
      >
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          <SiteHeader />

          {/* overflow-auto */}
          {/*<div className="flex flex-1 overflow-auto">{children}</div>*/}

          {/* fixed viewport for internal scroll */}
          <div className="flex flex-1 min-h-0">{children}</div>
          <Toaster />
        </SidebarInset>
      </SidebarProvider>
    </SiteHeaderProvider>
  )
}
