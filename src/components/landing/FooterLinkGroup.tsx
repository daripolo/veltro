import Link from "next/link"
import { JSX } from "react"

export type FooterLinkItem = {
  label: string
  href: string
}

export type FooterLinkGroupProps = {
  title: string
  links: FooterLinkItem[]
}

export function FooterLinkGroup({ title, links }: FooterLinkGroupProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">{title}</h3>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <Link
              href={link.href}
              className="inline-flex rounded-sm text-sm text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-signal"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
