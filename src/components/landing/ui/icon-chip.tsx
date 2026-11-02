import { cn } from "@/lib/utils"
import type { LandingIcon } from "@/src/components/landing/landing-config"

export type IconChipTone = "solid" | "outline" | "paper"
export type IconChipSize = "sm" | "md" | "lg"

const SIZES: Record<IconChipSize, string> = {
  sm: "size-7 rounded-[9px] [&_svg]:size-4",
  md: "size-9 rounded-[11px] [&_svg]:size-5",
  lg: "size-12 rounded-2xl [&_svg]:size-6",
}

const TONES: Record<IconChipTone, string> = {
  solid: "bg-signal text-white",
  paper: "bg-paper text-night",
  outline: "border border-night-line text-signal",
}

/**
 * Small rounded square that sits inline inside display statements, mirroring
 * the reference's icon chips. Decorative by default — screen readers read the
 * surrounding sentence as plain text.
 */
export function IconChip({
  icon: Icon,
  tone = "solid",
  size = "md",
  className,
}: {
  icon: LandingIcon
  tone?: IconChipTone
  size?: IconChipSize
  className?: string
}) {
  return (
    <span
      className={cn(
        "mx-[0.35em] inline-flex shrink-0 -translate-y-[0.06em] items-center justify-center align-middle",
        SIZES[size],
        TONES[tone],
        className,
      )}
    >
      <Icon aria-hidden className="text-current" />
    </span>
  )
}
