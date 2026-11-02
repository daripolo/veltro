import { testimonial } from "@/src/components/landing/landing-config"
import { LandingContainer } from "@/src/components/landing/ui/container"
import { Reveal } from "@/src/components/landing/ui/reveal"

export function TestimonialSection() {
  return (
    <section id="customers" className="scroll-mt-28 border-t border-night-line py-16 sm:py-24">
      <LandingContainer className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-center">
        <Reveal>
          <figure>
            <span aria-hidden className="block font-mono text-xs tracking-[0.24em] text-signal">
              &ldquo;
            </span>
            <blockquote className="mt-4 text-[clamp(1.4rem,3vw,2.25rem)] font-medium leading-[1.25] tracking-[-0.025em] text-ink">
              {testimonial.quote}
            </blockquote>
            <figcaption className="mt-7 flex items-center gap-3">
              <span
                aria-hidden
                className="grid size-11 shrink-0 place-items-center rounded-full bg-paper text-sm font-semibold text-night"
              >
                {testimonial.author.initials}
              </span>
              <span>
                <span className="block text-sm font-medium text-ink">{testimonial.author.name}</span>
                <span className="block text-xs text-ink-muted">{testimonial.author.role}</span>
              </span>
            </figcaption>
          </figure>
        </Reveal>

        <Reveal delay={0.08}>
          <ul className="grid grid-cols-2 gap-3">
            {testimonial.highlights.map((highlight) => {
              const Icon = highlight.icon

              return (
                <li
                  key={highlight.title}
                  className="rounded-2xl border border-night-line bg-night-raised p-4 transition-colors hover:border-signal/40"
                >
                  <Icon aria-hidden className="size-5 text-signal" />
                  <p className="mt-3 text-sm text-ink">{highlight.title}</p>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </LandingContainer>
    </section>
  )
}
