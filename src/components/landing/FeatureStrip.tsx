import Link from "next/link"
import { ArrowUpRight, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { featureStrip, type FeatureStripItem } from "@/src/components/landing/landing-config"
import { Carousel } from "@/src/components/landing/ui/carousel"
import { CircleLink } from "@/src/components/landing/ui/circle-button"
import { LandingContainer } from "@/src/components/landing/ui/container"

const CARD_BASE =
  "flex w-[85%] shrink-0 snap-start flex-col justify-between rounded-[26px] p-6 sm:w-[70%] md:w-auto md:shrink"

function Dots({ active = 0 }: { active?: number }) {
  return (
    <span aria-hidden className="flex items-center gap-2">
      {[0, 1, 2].map((position) => (
        <span
          key={position}
          className={cn("size-2.5 rounded-full", position === active ? "bg-signal" : "bg-white/15")}
        />
      ))}
    </span>
  )
}

function StripCard({ item }: { item: FeatureStripItem }) {
  if (item.kind === "action") {
    return (
      <article className={cn(CARD_BASE, "gap-8 bg-signal text-night")}>
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex size-11 items-center justify-center rounded-full border border-night/25 text-sm font-semibold">
            {item.index}
          </span>
          <CircleLink href={item.href} label={item.ctaLabel} tone="night" size="md">
            <ArrowUpRight aria-hidden />
          </CircleLink>
        </div>
        <p className="text-lg font-medium leading-snug tracking-[-0.01em] sm:text-xl">{item.body}</p>
      </article>
    )
  }

  if (item.kind === "people") {
    return (
      <article className={cn(CARD_BASE, "gap-8 border border-night-line bg-night-raised")}>
        <div className="flex items-center justify-between gap-4">
          <Dots active={2} />
          <Users aria-hidden className="size-4 text-ink-faint" />
        </div>
        <div>
          <p className="text-lg font-medium tracking-[-0.01em] text-ink">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-ink-muted">{item.body}</p>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-ink-faint">{item.meta}</p>
        </div>
      </article>
    )
  }

  return (
    <article className={cn(CARD_BASE, "gap-8 border border-night-line bg-night-raised")}>
      <div className="flex items-center justify-between gap-4">
        <Dots active={0} />
        <span className="text-xs uppercase tracking-[0.18em] text-ink-faint">{item.meta}</span>
      </div>
      <div>
        <p className="text-lg font-medium tracking-[-0.01em] text-ink">{item.title}</p>
        <p className="mt-2 text-sm leading-6 text-ink-muted">{item.body}</p>
      </div>
    </article>
  )
}

export function FeatureStrip() {
  return (
    <section id="products" className="scroll-mt-28 border-y border-night-line bg-night-raised/40 py-12 sm:py-16">
      <LandingContainer>
        <h2 className="sr-only">What you get with your account</h2>
        <Carousel
          label="Account highlights"
          controlsClassName="md:hidden"
          trackClassName="md:grid md:grid-cols-3 md:items-stretch md:gap-4 md:overflow-visible md:snap-none"
        >
          {featureStrip.map((item, index) => (
            <StripCard key={index} item={item} />
          ))}
        </Carousel>

        <p className="mt-6 hidden text-center text-sm text-ink-muted md:block">
          <Link
            href="#security"
            className="inline-flex items-center gap-1.5 rounded-full outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-signal"
          >
            See how monitoring works
            <ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </p>
      </LandingContainer>
    </section>
  )
}
