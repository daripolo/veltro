import Link from "next/link"
import type { ReactNode } from "react"
import { brand, BrandMark, testimonial } from "@/src/components/landing/landing-config"

export function BrandLockup() {
  return (
    <Link
      href={brand.homeHref}
      aria-label={`${brand.name} home`}
      className="inline-flex w-fit items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
    >
      <span
        aria-hidden
        className="grid size-9 place-items-center rounded-[11px] bg-signal text-night"
      >
        <BrandMark className="size-5" strokeWidth={2.25} />
      </span>
      <span className="text-lg font-semibold tracking-tight">{brand.name}</span>
    </Link>
  )
}

/**
 * Dark brand panel + cream form column, shared by every auth screen. Pages can
 * supply their own heading through `title`, or render one themselves.
 */
export function AuthShell({
  children,
  eyebrow,
  title,
  subtitle,
}: {
  children: ReactNode
  eyebrow?: string
  title?: string
  subtitle?: ReactNode
}) {
  return (
    <div className="auth-shell min-h-dvh bg-night text-ink">
      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Brand panel — dark, editorial, hidden on small screens. */}
        <aside className="relative hidden flex-col justify-between overflow-hidden px-10 py-12 lg:flex xl:px-16 xl:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-40 top-1/4 size-[36rem] rounded-full bg-signal/20 blur-[150px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_85%,rgba(234,88,12,0.10),transparent_60%)]"
          />

          <div className="relative z-10">
            <BrandLockup />
          </div>

          <div className="relative z-10 max-w-md">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-signal">
              Online banking
            </p>
            <h1 className="mt-5 text-[clamp(2.4rem,4vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.04em] text-ink">
              Banking that moves at your speed.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-ink-muted">
              Balances, cards and transfers in one place — monitored in real time, with alerts
              you actually understand.
            </p>
          </div>

          <figure className="relative z-10 max-w-sm border-t border-night-line pt-6">
            <blockquote className="text-sm leading-6 text-ink-muted">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-full bg-paper text-xs font-semibold text-night"
              >
                {testimonial.author.initials}
              </span>
              <span>
                <span className="block text-sm font-medium text-ink">{testimonial.author.name}</span>
                <span className="block text-xs text-ink-faint">{testimonial.author.role}</span>
              </span>
            </figcaption>
          </figure>
        </aside>

        {/* Form column — cream, matching the authenticated app. */}
        <div className="flex min-h-dvh flex-col bg-paper text-night lg:rounded-l-[2.5rem]">
          <div className="flex items-center justify-between px-5 pb-2 pt-[calc(env(safe-area-inset-top)+1.25rem)] lg:hidden">
            <BrandLockup />
            <Link
              href={brand.homeHref}
              className="rounded-full border border-night/15 px-3 py-1.5 text-xs font-medium text-night/60 outline-none transition-colors hover:border-night/30 hover:text-night focus-visible:ring-2 focus-visible:ring-signal"
            >
              Back to site
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
            <div className="w-full max-w-[420px]">
              {title ? (
                <header className="mb-7">
                  {eyebrow ? (
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-night/60">
                      {eyebrow}
                    </p>
                  ) : null}
                  <h1 className="mt-3 text-[clamp(1.9rem,3.2vw,2.5rem)] font-medium leading-[1.05] tracking-[-0.035em] text-night">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="mt-3 text-sm leading-6 text-night/60">{subtitle}</p>
                  ) : null}
                  <div className="mt-7 h-px w-full bg-night/10" />
                </header>
              ) : null}
              {children}
            </div>
          </div>

          <p className="px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] text-center text-[11px] text-night/60 lg:px-12 lg:text-left">
            © {new Date().getFullYear()} {brand.name}. Monitored banking, cards and transfers.
          </p>
        </div>
      </div>
    </div>
  )
}
