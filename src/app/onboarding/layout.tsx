import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Complete your profile",
  robots: {
    index: false,
    follow: false,
  },
}

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return children
}
