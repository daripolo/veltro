"use client"

import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  brand,
  heroSlides,
  heroStats,
  type HeroStat,
} from "@/src/components/landing/landing-config"
import { CircleButton, CircleLink } from "@/src/components/landing/ui/circle-button"
import { LandingContainer } from "@/src/components/landing/ui/container"
import { Statement } from "@/src/components/landing/ui/statement"

function Stat({ stat, align = "left" }: { stat: HeroStat; align?: "left" | "right" }) {
  return (
    <div className={cn("w-full border-t border-night-line pt-3", align === "right" && "text-right")}>
      <dt className="text-2xl font-semibold tracking-tight text-ink">{stat.value}</dt>
      <dd className="mt-1 text-xs leading-5 text-ink-muted">{stat.label}</dd>
    </div>
  )
}

export function HeroSection() {
  const [index, setIndex] = useState(0)
  const reduceMotion = useReducedMotion()
  const slide = heroSlides[index]
  const total = heroSlides.length

  const go = (delta: number) => setIndex((current) => (current + delta + total) % total)

  return (
    <section className="relative overflow-hidden pb-20 pt-28 sm:pt-36 lg:pb-28 lg:pt-44">
      {/* Warm glow and hairline rings behind the headline. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
        <div className="relative h-[520px] w-[520px] sm:h-[720px] sm:w-[720px]">
          <div className="absolute inset-0 rounded-full bg-signal/25 blur-[120px]" />
          <div className="absolute inset-6 rounded-full border border-white/5" />
          <div className="absolute inset-24 rounded-full border border-white/5" />
        </div>
      </div>

      <LandingContainer>
        <div className="grid grid-cols-1 gap-12 xl:grid-cols-[10rem_minmax(0,1fr)_10rem] xl:items-center xl:px-16">
          {/* Flanking statistics, wide screens only. */}
          <dl className="hidden flex-col gap-12 xl:flex">
            {heroStats.left.map((stat) => (
              <Stat key={stat.label} stat={stat} />
            ))}
          </dl>

          <div className="mx-auto w-full max-w-3xl text-center">
            <div aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={index}
                  initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="mx-auto max-w-md text-sm leading-6 text-ink-muted">{slide.eyebrow}</p>
                  <h1 className="mt-6 text-balance text-[clamp(2.35rem,7vw,5rem)] font-medium leading-[1.02] tracking-[-0.04em] text-ink">
                    <Statement parts={slide.parts} />
                  </h1>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-9 flex justify-center">
              <CircleLink href={brand.signUpHref} label="Open an account" size="lg" tone="paper">
                <ArrowUpRight aria-hidden />
              </CircleLink>
            </div>
          </div>

          <dl className="hidden flex-col items-end gap-12 xl:flex">
            {heroStats.right.map((stat) => (
              <Stat key={stat.label} stat={stat} align="right" />
            ))}
          </dl>
        </div>

        <CircleButton
          label="Previous message"
          onClick={() => go(-1)}
          size="lg"
          className="absolute left-2 top-1/2 hidden -translate-y-1/2 sm:left-4 lg:left-6 xl:left-8 xl:inline-flex"
        >
          <ArrowLeft aria-hidden />
        </CircleButton>
        <CircleButton
          label="Next message"
          onClick={() => go(1)}
          size="lg"
          className="absolute right-2 top-1/2 hidden -translate-y-1/2 sm:right-4 lg:right-6 xl:right-8 xl:inline-flex"
        >
          <ArrowRight aria-hidden />
        </CircleButton>

        {/* Compact statistics and controls below the headline on narrow screens. */}
        <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 xl:hidden">
          {[...heroStats.left, ...heroStats.right].map((stat) => (
            <Stat key={stat.label} stat={stat} />
          ))}
        </dl>

        <div className="mt-10 flex items-center justify-between gap-4 xl:hidden">
          <CircleButton label="Previous message" onClick={() => go(-1)} size="md">
            <ArrowLeft aria-hidden />
          </CircleButton>
          <span className="flex items-center gap-1">
            {heroSlides.map((item, position) => (
              <button
                key={item.eyebrow}
                type="button"
                onClick={() => setIndex(position)}
                aria-label={`Show message ${position + 1} of ${total}`}
                aria-current={position === index ? "true" : undefined}
                className="group grid size-6 place-items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-signal"
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full transition-colors",
                    position === index ? "bg-signal" : "bg-white/25 group-hover:bg-white/50",
                  )}
                />
              </button>
            ))}
          </span>
          <CircleButton label="Next message" onClick={() => go(1)} size="md">
            <ArrowRight aria-hidden />
          </CircleButton>
        </div>
      </LandingContainer>
    </section>
  )
}
