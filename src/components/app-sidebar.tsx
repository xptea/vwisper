import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  IconChartBar,
  IconHelp,
  IconPlayerPlay,
  IconSettings,
  IconKeyboard,
  IconHistory,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { UpdateCard } from "@/components/update-card"
import { useTheme } from "next-themes"
import lightModeLogo from "@/assets/lightmode.png"
import darkModeLogo from "@/assets/darkmode.png"

const data = {
  gettingStarted: [
    {
      title: "Quick Start",
      url: "/quick-start",
      icon: IconPlayerPlay,
    },
    {
      title: "Shortcuts",
      url: "/shortcuts",
      icon: IconKeyboard,
    },
    {
      title: "Preferences",
      url: "/preferences",
      icon: IconSettings,
    },
  ],
  analytics: [
    {
      title: "Usage Stats",
      url: "/",
      icon: IconChartBar,
    },
    {
      title: "Transcription History",
      url: "/history",
      icon: IconHistory,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const { resolvedTheme } = useTheme()
  const logo = resolvedTheme === "dark" ? darkModeLogo : lightModeLogo

  const isActive = (url: string) => {
    if (url === "/") {
      return location.pathname === "/"
    }
    return location.pathname.startsWith(url)
  }

  return (
    <Sidebar collapsible="offcanvas" {...props} data-tauri-drag-region>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 p-2">
              <img src={logo} alt="VWisper" className="size-8 rounded" />
              <span className="text-xl font-bold">VWisper</span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Getting Started Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Getting Started</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.gettingStarted.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <Link to={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.analytics.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <Link to={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Update Card - Own section at bottom */}
        <SidebarGroup className="mt-auto p-2">
          <UpdateCard />
        </SidebarGroup>

        {/* Help - Standalone at bottom */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Help"
                  asChild
                  isActive={isActive("/help")}
                >
                  <Link to="/help">
                    <IconHelp />
                    <span>Help</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

