import { ArrowUpRight, Lock, VenetianMask } from "lucide-react"
import { capabilities, BrandMark } from "@/src/components/landing/landing-config"
import { CircleLink } from "@/src/components/landing/ui/circle-button"
import { LandingContainer } from "@/src/components/landing/ui/container"
import { Reveal } from "@/src/components/landing/ui/reveal"
import { SectionMarker } from "@/src/components/landing/ui/section-marker"

const CARD_FRAME = "relative overflow-hidden rounded-[28px] bg-paper p-6 text-night"

function MonitoringVisual() {
  return (
    <div className={`${CARD_FRAME} flex flex-col justify-between`}>
      <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full border border-night/10" />
      <div aria-hidden className="absolute -right-10 -top-10 size-40 rounded-full border border-night/10" />
      <BrandMark aria-hidden strokeWidth={1} className="size-24 text-signal" />
      <div aria-hidden className="flex flex-wrap items-center gap-2">
        {["Balances", "Devices", "Cards"].map((label, index) => (
          <span
            key={label}
            className="rounded-full bg-night/5 px-3 py-1.5 text-xs font-medium text-night/85"
            style={{ transform: `rotate(${index === 1 ? -4 : index === 2 ? 3 : -1}deg)` }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

function DetectionVisual() {
  const signals = ["Phishing pages", "Impersonation", "Odd transfers", "New devices"]

  return (
    <div className={`${CARD_FRAME} flex flex-col items-center justify-center gap-5`}>
      <div aria-hidden className="absolute inset-6 rounded-[22px] border border-dashed border-night/15" />
      <span
        aria-hidden
        className="absolute left-1/2 top-3 -translate-x-1/2 text-[10px] uppercase tracking-[0.22em] text-night/60"
      >
        {signals[0]}
      </span>
      <span
        aria-hidden
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.22em] text-night/60"
        style={{ writingMode: "vertical-rl" }}
      >
        {signals[1]}
      </span>
      <span
        aria-hidden
        className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.22em] text-night/60"
      >
        {signals[2]}
      </span>
      <span
        aria-hidden
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.22em] text-night/60"
        style={{ writingMode: "vertical-rl", rotate: "180deg" }}
      >
        {signals[3]}
      </span>
      <span aria-hidden className="grid size-24 place-items-center rounded-full bg-night/5">
        <VenetianMask aria-hidden className="size-10 text-night/60" strokeWidth={1.25} />
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/40 bg-paper px-3 py-1.5 text-xs font-medium text-signal">
        <Lock aria-hidden className="size-3.5" />
        Transfer held for review
      </span>
    </div>
  )
}

function TriageVisual() {
  const queue = [
    { label: "Card frozen", rotate: "-6deg", offset: "0px", tone: "bg-paper-deep" },
    { label: "Transfer reviewed", rotate: "-1.5deg", offset: "6px", tone: "bg-night/5" },
    { label: "Login verified", rotate: "4deg", offset: "-4px", tone: "bg-night/10" },
  ]

  return (
    <div className={CARD_FRAME}>
      <div aria-hidden className="absolute inset-x-5 top-6 space-y-3">
        {queue.map((row) => (
          <div
            key={row.label}
            className={`flex items-center justify-between gap-2 rounded-2xl ${row.tone} px-3.5 py-2.5`}
            style={{ transform: `rotate(${row.rotate}) translateX(${row.offset})` }}
          >
            <span className="text-[11px] font-medium text-night/75">{row.label}</span>
            <span className="text-[9px] uppercase tracking-[0.16em] text-night/60">auto</span>
          </div>
        ))}
      </div>
      <BrandMark aria-hidden strokeWidth={1.25} className="absolute bottom-6 left-6 size-10 text-signal" />
    </div>
  )
}

const VISUALS = [MonitoringVisual, DetectionVisual, TriageVisual]

export function CapabilitiesSection() {
  return (
    <section id="security" className="scroll-mt-28 border-t border-night-line py-16 sm:py-24">
      <LandingContainer>
        <Reveal>
          <SectionMarker index={capabilities.index} label={capabilities.pill} />
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-end">
          <Reveal delay={0.05}>
            <h2 className="max-w-2xl text-[clamp(2rem,4.6vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.035em] text-ink">
              {capabilities.headline}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-md text-sm leading-7 text-ink-muted lg:justify-self-end">
              {capabilities.description}
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-col gap-6 rounded-[28px] bg-signal px-6 py-8 text-night sm:px-10 sm:py-10 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <span className="inline-flex w-fit items-center rounded-full border border-night/25 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]">
              {capabilities.highlight.label}
            </span>
            <p className="max-w-2xl text-lg font-medium leading-snug tracking-[-0.01em] sm:text-xl lg:text-2xl">
              {capabilities.highlight.body}
            </p>
            <CircleLink
              href={capabilities.highlight.href}
              label={capabilities.highlight.ctaLabel}
              tone="night"
              size="lg"
              className="self-start lg:self-auto"
            >
              <ArrowUpRight aria-hidden />
            </CircleLink>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {capabilities.cards.map((card, index) => {
            const Visual = VISUALS[index] ?? MonitoringVisual

            return (
              <Reveal key={card.title} delay={0.05 * index}>
                <figure className="flex h-full flex-col gap-5">
                  <div className="aspect-[4/5] w-full">
                    <div className="size-full [&>*]:size-full">
                      <Visual />
                    </div>
                  </div>
                  <figcaption>
                    <h3 className="text-base font-semibold tracking-[-0.01em] text-ink">{card.title}</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-ink-muted">{card.body}</p>
                  </figcaption>
                </figure>
              </Reveal>
            )
          })}
        </div>
      </LandingContainer>
    </section>
  )
}
