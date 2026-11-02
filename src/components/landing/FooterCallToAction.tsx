import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { JSX } from "react"
import { BrandMark } from "@/src/components/landing/landing-config"

export type FooterCallToActionProps = {
  eyebrow: string
  title: string
  body: string
  primary: { label: string; href: string }
  secondary: { label: string; href: string }
}

export function FooterCallToAction({
  eyebrow,
  title,
  body,
  primary,
  secondary,
}: FooterCallToActionProps): JSX.Element {
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-signal px-6 py-10 text-night sm:px-10 sm:py-14">
      <BrandMark
        aria-hidden
        strokeWidth={0.75}
        className="pointer-events-none absolute -right-12 -top-16 size-64 text-night/10"
      />
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">{eyebrow}</span>
      <h2 className="mt-4 max-w-2xl text-[clamp(1.75rem,4vw,3rem)] font-medium leading-[1.06] tracking-[-0.035em]">
        {title}
      </h2>
      <p className="mt-4 max-w-lg text-sm leading-6 text-night/85">{body}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href={primary.href}
          className="inline-flex items-center gap-2 rounded-full bg-night px-6 py-3 text-sm font-medium text-ink outline-none transition-colors hover:bg-night-soft focus-visible:ring-2 focus-visible:ring-night focus-visible:ring-offset-2 focus-visible:ring-offset-signal"
        >
          {primary.label}
          <ArrowUpRight aria-hidden className="size-4" />
        </Link>
        <Link
          href={secondary.href}
          className="inline-flex items-center rounded-full border border-night/30 px-6 py-3 text-sm font-medium outline-none transition-colors hover:border-night/60 focus-visible:ring-2 focus-visible:ring-night focus-visible:ring-offset-2 focus-visible:ring-offset-signal"
        >
          {secondary.label}
        </Link>
      </div>
    </div>
  )
}
