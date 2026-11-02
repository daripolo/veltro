import Link from "next/link"
import { JSX } from "react"

export type FooterBottomBarLink = {
  label: string
  href: string
}

export type FooterBottomBarProps = {
  copyright: string
  note: string
  links: FooterBottomBarLink[]
}

export function FooterBottomBar({ copyright, note, links }: FooterBottomBarProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4 border-t border-night-line py-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-ink-faint">
        {copyright} <span>{note}</span>
      </p>
      <div className="flex flex-wrap gap-5">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="rounded-sm text-xs text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-signal"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
