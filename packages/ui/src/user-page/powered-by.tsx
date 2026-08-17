import { cn } from "../lib/utils"

export const INBOUND_HOME_URL = "https://inbound.click"

export function PoweredBy({ className }: { className?: string }) {
  return (
    <a
      href={INBOUND_HOME_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group inline-flex items-center gap-2 text-sm font-medium",
        className,
      )}
    >
      <InboundMark className="h-3.5 w-3.5 shrink-0" />
      <span className="opacity-55 transition-opacity group-hover:opacity-90">
        Powered by inbound.click
      </span>
    </a>
  )
}

function InboundMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <rect x="0" y="1.5" width="24" height="5" rx="2.5" fill="#EE775F" />
      <rect x="3.5" y="9.5" width="20.5" height="5" rx="2.5" fill="#F8C751" />
      <rect x="8.5" y="17.5" width="15.5" height="5" rx="2.5" fill="#69D0B2" />
    </svg>
  )
}
