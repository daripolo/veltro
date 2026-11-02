"use client"

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { CircleButton } from "@/components/landing/ui/circle-button"

type Arrows = "bottom" | "sides" | "none"

type CarouselState = {
  index: number
  count: number
  canPrev: boolean
  canNext: boolean
  scrollable: boolean
}

const EMPTY_STATE: CarouselState = {
  index: 0,
  count: 0,
  canPrev: false,
  canNext: false,
  scrollable: false,
}

/**
 * Horizontal, keyboard-operable scroller used by the landing highlights and
 * the partner row. Native scroll-snap does the work; arrows, dots and optional
 * autoplay are enhancements that disappear when everything already fits.
 */
export function Carousel({
  label,
  children,
  className,
  trackClassName,
  controlsClassName,
  arrows = "bottom",
  dots = true,
  autoAdvanceMs,
  sideArrowLeftClassName = "left-0 -translate-x-1/2",
  sideArrowRightClassName = "right-0 translate-x-1/2",
}: {
  label: string
  children: ReactNode
  className?: string
  trackClassName?: string
  controlsClassName?: string
  arrows?: Arrows
  dots?: boolean
  autoAdvanceMs?: number
  sideArrowLeftClassName?: string
  sideArrowRightClassName?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const [state, setState] = useState<CarouselState>(EMPTY_STATE)
  const stateRef = useRef(state)
  const reduceMotion = useReducedMotion()

  const items = useCallback((): HTMLElement[] => {
    const track = trackRef.current
    if (!track) return []
    return Array.from(track.children).filter((child): child is HTMLElement => child instanceof HTMLElement)
  }, [])

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const nodes = items()
    if (nodes.length === 0) {
      setState(EMPTY_STATE)
      return
    }

    const first = nodes[0].offsetLeft
    const scrollLeft = track.scrollLeft
    let index = 0
    let closest = Number.POSITIVE_INFINITY
    nodes.forEach((node, position) => {
      const distance = Math.abs(node.offsetLeft - first - scrollLeft)
      if (distance < closest) {
        closest = distance
        index = position
      }
    })

    const maxScroll = track.scrollWidth - track.clientWidth
    setState({
      index,
      count: nodes.length,
      canPrev: scrollLeft > 4,
      canNext: scrollLeft < maxScroll - 4,
      scrollable: maxScroll > 4,
    })
  }, [items])

  const scrollToIndex = useCallback(
    (target: number) => {
      const track = trackRef.current
      const nodes = items()
      if (!track || nodes.length === 0) return
      const clamped = Math.min(Math.max(target, 0), nodes.length - 1)
      const first = nodes[0].offsetLeft
      track.scrollTo({
        left: nodes[clamped].offsetLeft - first,
        behavior: reduceMotion ? "auto" : "smooth",
      })
    },
    [items, reduceMotion],
  )

  const step = useCallback((delta: number) => scrollToIndex(stateRef.current.index + delta), [scrollToIndex])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    measure()
    track.addEventListener("scroll", measure, { passive: true })

    const observer = new ResizeObserver(measure)
    observer.observe(track)
    Array.from(track.children).forEach((child) => observer.observe(child))

    return () => {
      track.removeEventListener("scroll", measure)
      observer.disconnect()
    }
  }, [measure])

  useEffect(() => {
    if (!autoAdvanceMs || reduceMotion || state.count <= 1) return

    const timer = window.setInterval(() => {
      if (pausedRef.current) return
      const nodes = items()
      if (nodes.length === 0) return
      scrollToIndex((stateRef.current.index + 1) % nodes.length)
    }, autoAdvanceMs)

    return () => window.clearInterval(timer)
  }, [autoAdvanceMs, items, reduceMotion, scrollToIndex, state.count])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault()
      step(1)
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      step(-1)
    }
  }

  const pause = () => {
    pausedRef.current = true
  }
  const resume = () => {
    pausedRef.current = false
  }

  const showArrows = arrows !== "none" && state.scrollable
  const showDots = dots && state.scrollable && state.count > 1
  const sideArrowClasses = "absolute top-1/2 z-10 hidden -translate-y-1/2 bg-night sm:inline-flex"

  return (
    <div className={cn("relative", className)}>
      <div
        ref={trackRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={resume}
        className={cn(
          "flex snap-x snap-mandatory overflow-x-auto scroll-smooth outline-none",
          "focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-4 focus-visible:ring-offset-night",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          trackClassName,
        )}
      >
        {children}
      </div>

      {showArrows && arrows === "sides" ? (
        <>
          <CircleButton
            label={`Previous: ${label}`}
            onClick={() => step(-1)}
            disabled={!state.canPrev}
            className={cn(sideArrowClasses, sideArrowLeftClassName)}
          >
            <ArrowLeft aria-hidden />
          </CircleButton>
          <CircleButton
            label={`Next: ${label}`}
            onClick={() => step(1)}
            disabled={!state.canNext}
            className={cn(sideArrowClasses, sideArrowRightClassName)}
          >
            <ArrowRight aria-hidden />
          </CircleButton>
        </>
      ) : null}

      {showArrows && arrows === "bottom" ? (
        <div className={cn("mt-6 flex items-center justify-center gap-4", controlsClassName)}>
          <CircleButton label={`Previous: ${label}`} onClick={() => step(-1)} disabled={!state.canPrev} size="md">
            <ArrowLeft aria-hidden />
          </CircleButton>
          {showDots ? <Dots count={state.count} index={state.index} onSelect={scrollToIndex} /> : null}
          <CircleButton label={`Next: ${label}`} onClick={() => step(1)} disabled={!state.canNext} size="md">
            <ArrowRight aria-hidden />
          </CircleButton>
        </div>
      ) : null}

      {showDots && arrows !== "bottom" ? (
        <div className={cn("mt-6 flex justify-center", controlsClassName)}>
          <Dots count={state.count} index={state.index} onSelect={scrollToIndex} />
        </div>
      ) : null}
    </div>
  )
}

function Dots({
  count,
  index,
  onSelect,
}: {
  count: number
  index: number
  onSelect: (index: number) => void
}) {
  return (
    <span className="flex items-center gap-2">
      {Array.from({ length: count }, (_, position) => (
        <button
          key={position}
          type="button"
          onClick={() => onSelect(position)}
          aria-label={`Go to item ${position + 1} of ${count}`}
          aria-current={position === index}
          className={cn(
            "size-1.5 rounded-full transition-colors",
            position === index ? "bg-signal" : "bg-white/25 hover:bg-white/50",
          )}
        />
      ))}
    </span>
  )
}
