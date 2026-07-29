import {
  createContext,
  Fragment,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ShareButton } from "./share-button"

type SiteHeaderTitleMode = "append" | "replace"

type SiteHeaderConfig = {
  title?: ReactNode
  titleMode?: SiteHeaderTitleMode
  actions?: ReactNode[]
}

type SiteHeaderEntry = SiteHeaderConfig & {
  key: symbol
  order: number
}

type SiteHeaderContextValue = {
  actions: Array<{ key: string; node: ReactNode }>
  register: (config: SiteHeaderConfig) => () => void
  title: ReactNode | null
}

const SiteHeaderContext = createContext<SiteHeaderContextValue | null>(null)

function resolveTitle(entries: SiteHeaderEntry[]) {
  const segments: Array<{ key: number; node: ReactNode }> = []

  for (const entry of entries) {
    if (entry.title === undefined) {
      continue
    }

    if (entry.titleMode === "append") {
      segments.push({ key: entry.order, node: entry.title })
      continue
    }

    segments.length = 0
    segments.push({ key: entry.order, node: entry.title })
  }

  if (segments.length === 0) {
    return null
  }

  if (segments.length === 1) {
    return segments[0].node
  }

  return segments.map((segment, index) => (
    <Fragment key={segment.key}>
      {index > 0 && <span className="mx-2 text-muted-foreground">/</span>}
      {segment.node}
    </Fragment>
  ))
}

export function SiteHeaderProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<SiteHeaderEntry[]>([])
  const entryOrderRef = useRef(0)

  const register = useCallback((config: SiteHeaderConfig) => {
    const key = Symbol("site-header-entry")
    const entry: SiteHeaderEntry = {
      ...config,
      key,
      order: entryOrderRef.current++,
    }

    setEntries((previousEntries) => [...previousEntries, entry])

    return () => {
      setEntries((previousEntries) =>
        previousEntries.filter((currentEntry) => currentEntry.key !== key),
      )
    }
  }, [])

  const resolvedEntries = useMemo(
    () => [...entries].sort((a, b) => a.order - b.order),
    [entries],
  )

  const value = useMemo<SiteHeaderContextValue>(
    () => ({
      register,
      title: resolveTitle(resolvedEntries),
      actions: resolvedEntries.flatMap((entry) =>
        (entry.actions ?? []).map((action, actionIndex) => ({
          key: `${entry.order}-${actionIndex}`,
          node: action,
        })),
      ),
    }),
    [register, resolvedEntries],
  )

  return (
    <SiteHeaderContext.Provider value={value}>
      {children}
    </SiteHeaderContext.Provider>
  )
}

export function useSiteHeader(config: SiteHeaderConfig) {
  const context = useContext(SiteHeaderContext)

  if (!context) {
    throw new Error("useSiteHeader must be used within SiteHeaderProvider")
  }

  const { register } = context

  useEffect(
    () =>
      register({
        title: config.title,
        titleMode: config.titleMode,
        actions: config.actions,
      }),
    [register, config.actions, config.title, config.titleMode],
  )
}

export function SiteHeader() {
  const context = useContext(SiteHeaderContext)

  if (!context) {
    throw new Error("SiteHeader must be used within SiteHeaderProvider")
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
        />
        <h1 className="text-base font-medium">
          {context.title ?? "Dashboard"}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <ShareButton />
          {context.actions.map((action) => (
            <Fragment key={action.key}>{action.node}</Fragment>
          ))}
        </div>
      </div>
    </header>
  )
}
