import { cn } from "@/lib/utils"
import type { LandingIcon } from "@/src/components/landing/landing-config"

/**
 * Numbered marker plus pill tag that introduces a marketing section, matching
 * the `01 — About` treatment in the reference layout.
 */
export function SectionMarker({
  index,
  label,
  icon: Icon,
  className,
}: {
  index: string
  label: string
  icon?: LandingIcon
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="font-mono text-xs tracking-[0.2em] text-ink-faint">{index}</span>
      <span className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-1.5 text-xs font-medium tracking-wide text-night">
        {Icon ? <Icon aria-hidden className="size-3.5 text-signal" /> : null}
        {label}
      </span>
    </div>
  )
}
