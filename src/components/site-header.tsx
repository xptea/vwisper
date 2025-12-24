import { useLocation } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { Minus, Square, X } from "lucide-react"

const pageNames: Record<string, string> = {
  "/": "Usage Stats",
  "/history": "Transcription History",
  "/shortcuts": "Shortcuts",
  "/preferences": "Preferences",
  "/quick-start": "Quick Start",
  "/help": "Help",
}

export function SiteHeader() {
  const location = useLocation()
  const pageName = pageNames[location.pathname] || "VWisper"

  const minimize = () => getCurrentWindow().minimize()
  const toggleMaximize = async () => {
    const window = getCurrentWindow()
    if (await window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }
  }
  const close = () => getCurrentWindow().close()

  return (
    <header
      id="header"
      className="flex h-(--header-height) shrink-0 items-center border-b transition-[width,height] ease-linear select-none group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
      data-tauri-drag-region
    >
      <div className="fixed top-0 left-0 w-full h-2 z-50 bg-transparent" data-tauri-drag-region />
      <div className="flex w-full items-center justify-between px-4 lg:px-6" data-tauri-drag-region>
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">{pageName}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={minimize}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            <Minus className="h-4 w-4" />
            <span className="sr-only">Minimize</span>
          </button>
          <button
            onClick={toggleMaximize}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            <Square className="h-3.5 w-3.5" />
            <span className="sr-only">Maximize</span>
          </button>
          <button
            onClick={close}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>
    </header>
  )
}
