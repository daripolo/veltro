import { JSX } from "react"
import { brand, BrandMark, footer } from "@/src/components/landing/landing-config"
import { FooterBottomBar } from "@/src/components/landing/FooterBottomBar"
import { FooterCallToAction } from "@/src/components/landing/FooterCallToAction"
import { FooterLinkGroups } from "@/src/components/landing/FooterLinkGroups"
import { LandingContainer } from "@/src/components/landing/ui/container"

export function Footer(): JSX.Element {
  return (
    <footer id="company" className="scroll-mt-28 border-t border-night-line bg-night-raised/40">
      <LandingContainer className="py-16 sm:py-20">
        <FooterCallToAction
          eyebrow={footer.cta.eyebrow}
          title={footer.cta.title}
          body={footer.cta.body}
          primary={footer.cta.primary}
          secondary={footer.cta.secondary}
        />

        <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-4">
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="grid size-8 place-items-center rounded-[10px] bg-signal text-white"
              >
                <BrandMark className="size-4" strokeWidth={2.25} />
              </span>
              <span className="text-base font-semibold tracking-tight text-ink">{brand.name}</span>
            </span>
            <p className="max-w-xs text-sm leading-6 text-ink-muted">{footer.blurb}</p>
          </div>

          <FooterLinkGroups groups={footer.groups} />
        </div>

        <div className="mt-14">
          <FooterBottomBar
            copyright={footer.legal.copyright}
            note={footer.legal.note}
            links={footer.legal.links}
          />
        </div>
      </LandingContainer>
    </footer>
  )
}
