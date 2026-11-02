import type { ComponentProps, ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export type CircleButtonSize = "sm" | "md" | "lg"
export type CircleButtonTone = "outline" | "solid" | "paper" | "night"

const SIZES: Record<CircleButtonSize, string> = {
  sm: "size-9 [&_svg]:size-4",
  md: "size-11 [&_svg]:size-5",
  lg: "size-14 [&_svg]:size-6",
}

const TONES: Record<CircleButtonTone, string> = {
  outline: "border border-night-line text-ink hover:border-signal hover:text-signal",
  solid: "bg-signal text-white hover:bg-signal-bright",
  paper: "bg-paper text-night hover:bg-paper-deep",
  night: "bg-night text-ink hover:bg-night-soft",
}

export function circleButtonClasses({
  size = "md",
  tone = "outline",
  className,
}: {
  size?: CircleButtonSize
  tone?: CircleButtonTone
  className?: string
}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-200",
    "outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-night",
    "disabled:pointer-events-none disabled:opacity-40",
    SIZES[size],
    TONES[tone],
    className,
  )
}

export type CircleButtonProps = {
  /** Accessible name — these controls are icon-only. */
  label: string
  size?: CircleButtonSize
  tone?: CircleButtonTone
} & Omit<ComponentProps<"button">, "children" | "aria-label"> & { children?: ReactNode }

export function CircleButton({ label, size, tone, className, children, ...props }: CircleButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={circleButtonClasses({ size, tone, className })}
      {...props}
    >
      {children}
    </button>
  )
}

export type CircleLinkProps = {
  label: string
  href: string
  size?: CircleButtonSize
  tone?: CircleButtonTone
  className?: string
  children?: ReactNode
}

export function CircleLink({ label, href, size, tone, className, children }: CircleLinkProps) {
  return (
    <Link href={href} aria-label={label} className={circleButtonClasses({ size, tone, className })}>
      {children}
    </Link>
  )
}
