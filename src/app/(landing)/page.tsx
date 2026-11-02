import { JSX } from "react"
import { Navbar } from "@/src/components/landing/Navbar"
import { HeroSection } from "@/src/components/landing/HeroSection"
import { FeatureStrip } from "@/src/components/landing/FeatureStrip"
import { AboutSection } from "@/src/components/landing/AboutSection"
import { CapabilitiesSection } from "@/src/components/landing/CapabilitiesSection"
import { PartnersRow } from "@/src/components/landing/PartnersRow"
import { TestimonialSection } from "@/src/components/landing/TestimonialSection"
import { Footer } from "@/src/components/landing/Footer"

// Rendered on the server so the navbar date chip cannot cause a hydration mismatch.
function todayLabel(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date())
}

export default function LandingPage(): JSX.Element {
  return (
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
  )
}
