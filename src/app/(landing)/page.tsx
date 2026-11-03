import { JSX } from "react"
import { Navbar } from "@/src/components/landing/Navbar"
import { HeroSection } from "@/src/components/landing/HeroSection"
import { FeatureStrip } from "@/src/components/landing/FeatureStrip"
import { AboutSection } from "@/src/components/landing/AboutSection"
import { CapabilitiesSection } from "@/src/components/landing/CapabilitiesSection"
import { PartnersRow } from "@/src/components/landing/PartnersRow"
import { TestimonialSection } from "@/src/components/landing/TestimonialSection"
import { Footer } from "@/src/components/landing/Footer"
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
} from "@/lib/site"

// Rendered on the server so the navbar date chip cannot cause a hydration mismatch.
function todayLabel(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date())
}

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      description: SITE_DESCRIPTION,
      email: SUPPORT_EMAIL,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SUPPORT_EMAIL,
        availableLanguage: ["English"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
  ],
}

export default function LandingPage(): JSX.Element {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="landing-shell relative min-h-dvh overflow-x-clip bg-night text-ink antialiased">
        <Navbar todayLabel={todayLabel()} />
        <HeroSection />
        <FeatureStrip />
        <AboutSection />
        <CapabilitiesSection />
        <PartnersRow />
        <TestimonialSection />
        <Footer />
      </div>
    </>
  )
}
