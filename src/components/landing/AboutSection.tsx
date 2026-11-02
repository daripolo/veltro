import { about, BrandMark } from "@/src/components/landing/landing-config"
import { Reveal } from "@/src/components/landing/ui/reveal"
import { SectionMarker } from "@/src/components/landing/ui/section-marker"
import { LandingContainer } from "@/src/components/landing/ui/container"
import { Statement } from "@/src/components/landing/ui/statement"

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-28 py-16 sm:py-24">
      <LandingContainer>
        <Reveal>
          <SectionMarker index={about.index} label={about.pill} icon={BrandMark} />
        </Reveal>

        <Reveal delay={0.05} className="mt-8 max-w-5xl">
          <p className="text-[clamp(1.6rem,3.9vw,3rem)] font-medium leading-[1.15] tracking-[-0.03em] text-ink">
            <Statement parts={about.statement} />
            <span className="text-ink-faint">.</span>
          </p>
          <p className="mt-4 text-[clamp(1.25rem,2.6vw,2rem)] font-medium leading-snug tracking-[-0.02em] text-ink-muted">
            <Statement parts={about.secondary} />
          </p>
        </Reveal>
      </LandingContainer>
    </section>
  )
}
