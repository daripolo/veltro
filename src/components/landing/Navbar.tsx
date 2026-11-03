"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Menu, X } from "lucide-react"
import { brand, BrandMark, navLinks } from "@/src/components/landing/landing-config"
import { LandingContainer } from "@/src/components/landing/ui/container"

export function Navbar({ todayLabel }: { todayLabel: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  // Keep the page behind the mobile menu from scrolling while it is open.
  useEffect(() => {
    if (!open) return

    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <LandingContainer>
        <nav
          aria-label="Main"
          className="flex items-center justify-between gap-2 rounded-[22px] border border-night-line bg-night-raised/85 px-2.5 py-2 backdrop-blur-xl sm:px-3"
        >
          <Link
            href={brand.homeHref}
            aria-label={`${brand.name} home`}
            className="flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-2 outline-none focus-visible:ring-2 focus-visible:ring-signal"
          >
            <span
              aria-hidden
              className="grid size-7 place-items-center rounded-[9px] bg-signal text-white sm:size-8"
            >
              <BrandMark className="size-4" strokeWidth={2.25} />
            </span>
            <span className="text-base font-semibold tracking-tight text-ink">{brand.name}</span>
          </Link>

          <ul className="hidden items-center gap-0.5 md:flex">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="inline-flex rounded-full px-2.5 py-2 text-sm text-ink-muted outline-none transition-colors hover:bg-white/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-signal lg:px-3.5"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-night-line px-4 py-2 text-xs text-ink-muted lg:inline-flex">
              {todayLabel}
            </span>
            <Link
              href={brand.signInHref}
              className="hidden shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-signal sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href={brand.signUpHref}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-paper px-3.5 py-2 text-sm font-medium text-night outline-none transition-colors hover:bg-paper-deep focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-night sm:px-4"
            >
              <span className="hidden min-[380px]:inline">Open account</span>
              <span className="min-[380px]:hidden">Open</span>
              <ArrowUpRight aria-hidden className="size-4 shrink-0" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="landing-mobile-nav"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-night-line text-ink outline-none transition-colors hover:border-signal hover:text-signal focus-visible:ring-2 focus-visible:ring-signal md:hidden"
            >
              {open ? <X aria-hidden className="size-4" /> : <Menu aria-hidden className="size-4" />}
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            </button>
          </div>
        </nav>

        {open ? (
          <div
            id="landing-mobile-nav"
            className="mt-2 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain rounded-3xl border border-night-line bg-night-raised/95 p-3 backdrop-blur-xl md:hidden"
          >
            <ul className="grid gap-1">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl px-4 py-3 text-sm text-ink-muted outline-none transition-colors hover:bg-white/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-signal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-2 grid gap-2 border-t border-night-line pt-3">
              <Link
                href={brand.signInHref}
                onClick={() => setOpen(false)}
                className="rounded-full px-4 py-3 text-center text-sm text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-signal"
              >
                Log in
              </Link>
              <p className="px-4 text-center text-xs text-ink-faint">{todayLabel}</p>
            </div>
          </div>
        ) : null}
      </LandingContainer>
    </header>
  )
}
