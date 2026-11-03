"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandMark, network, type NetworkLogo } from "@/src/components/landing/landing-config"
import { Carousel } from "@/src/components/landing/ui/carousel"
import { LandingContainer } from "@/src/components/landing/ui/container"
import { Reveal } from "@/src/components/landing/ui/reveal"
import { SectionMarker } from "@/src/components/landing/ui/section-marker"

const CIRCLE = "grid size-24 shrink-0 snap-center place-items-center rounded-full sm:size-28"

function Logo({ logo }: { logo: NetworkLogo }) {
  if (logo.kind === "highlight") {
    return (
      <Link
        href={logo.href}
        aria-label={logo.label}
        className={cn(
          CIRCLE,
          "relative bg-signal text-night outline-none transition-colors hover:bg-signal-bright focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-night",
        )}
      >
        <BrandMark aria-hidden strokeWidth={1.5} className="size-12" />
        <span
          aria-hidden
          className="absolute -bottom-1 right-1 grid size-9 place-items-center rounded-full bg-night text-ink"
        >
          <ArrowUpRight className="size-4" />
        </span>
      </Link>
    )
  }

  if (logo.kind === "icon") {
    const Icon = logo.icon

    return (
      <span className={cn(CIRCLE, "border border-night-line text-ink-muted")}>
        <Icon aria-hidden className="size-10" />
        <span className="sr-only">{logo.ariaLabel}</span>
      </span>
    )
  }

  return (
    <span className={cn(CIRCLE, "border border-night-line text-xs font-semibold tracking-[0.18em] text-ink-muted")}>
      {logo.label}
    </span>
  )
}

export function PartnersRow() {
  return (
    <section id="network" className="scroll-mt-28 border-t border-night-line py-16 sm:py-24">
      <LandingContainer>
        <Reveal>
          <SectionMarker index={network.index} label={network.pill} />
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end">
          <Reveal delay={0.05}>
            <h2 className="max-w-2xl text-[clamp(1.8rem,4.2vw,3rem)] font-medium leading-[1.06] tracking-[-0.035em] text-ink">
              {network.headline}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-md text-sm leading-7 text-ink-muted lg:justify-self-end">{network.description}</p>
          </Reveal>
        </div>
      </LandingContainer>

      <Reveal delay={0.1}>
        <Carousel
          label="Payment networks and partners"
          arrows="sides"
          className="mt-12"
          sideArrowLeftClassName="left-3 sm:left-6 lg:left-10"
          sideArrowRightClassName="right-3 sm:right-6 lg:right-10"
          trackClassName="mx-auto w-full max-w-[112rem] items-center gap-4 px-5 py-2 sm:gap-5 sm:px-20 lg:justify-center lg:overflow-visible lg:px-12"
        >
          {network.logos.map((logo, index) => (
            <Logo key={index} logo={logo} />
          ))}
        </Carousel>
      </Reveal>
    </section>
  )
}
