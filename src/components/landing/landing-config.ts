import type { ComponentType } from "react"
import {
  Asterisk,
  Banknote,
  CreditCard,
  FingerprintPattern,
  Globe,
  Landmark,
  PiggyBank,
  Radar,
  Send,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react"
import { ApplePayIcon } from "@/src/components/icons/ApplePayIcon"
import { GooglePayIcon } from "@/src/components/icons/GooglePayIcon"
import { PayPalIcon } from "@/src/components/icons/PayPalIcon"
import { WiseIcon } from "@/src/components/icons/WiseIcon"

/**
 * Icon shape shared by lucide icons and the hand-written partner marks in
 * `src/components/icons`, so section components can render either one.
 */
export type LandingIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>

/** Brand mark used for inline chips, pills and footer ornament. */
export const BrandMark = Asterisk

/**
 * Single source of truth for the public brand. Swap `name` here when the
 * canonical product name changes — no section hard-codes it. The asterisk is a
 * deliberate placeholder mark until a Veltro logo asset exists.
 */
export const brand = {
  name: "Veltro",
  homeHref: "/",
  signInHref: "/auth/signin",
  signUpHref: "/auth/signup",
} as const

export const navLinks = [
  { label: "Products", href: "#products" },
  { label: "Security", href: "#security" },
  { label: "Network", href: "#network" },
  { label: "Company", href: "#company" },
] as const

/** Text and inline icon chips that make up a display statement. */
export type StatementPart =
  | { type: "text"; value: string }
  | { type: "icon"; icon: LandingIcon }

export type HeroSlide = {
  eyebrow: string
  parts: StatementPart[]
}

export const heroSlides: HeroSlide[] = [
  {
    eyebrow: "Every balance, card and transfer watched in real time, with alerts you actually understand.",
    parts: [
      { type: "text", value: "Next level of " },
      { type: "icon", icon: Landmark },
      { type: "text", value: "banking and " },
      { type: "icon", icon: CreditCard },
      { type: "text", value: "everyday money" },
    ],
  },
  {
    eyebrow: "Hold, send and receive more than forty currencies from the account you already use.",
    parts: [
      { type: "text", value: "Move money " },
      { type: "icon", icon: Globe },
      { type: "text", value: "across borders and " },
      { type: "icon", icon: Zap },
      { type: "text", value: "settle in seconds" },
    ],
  },
  {
    eyebrow: "Goals, budget alerts and card controls live in one calm dashboard, not five apps.",
    parts: [
      { type: "text", value: "Grow savings " },
      { type: "icon", icon: PiggyBank },
      { type: "text", value: "with clear rates and " },
      { type: "icon", icon: Radar },
      { type: "text", value: "alerts you control" },
    ],
  },
]

export type HeroStat = { value: string; label: string }

export const heroStats: { left: HeroStat[]; right: HeroStat[] } = {
  left: [
    { value: "500k+", label: "Customers banking with us" },
    { value: "2.4m", label: "Transfers processed every month" },
  ],
  right: [
    { value: "200k", label: "Partner ATMs worldwide" },
    { value: "98%", label: "Transfers settle in under 10 seconds" },
  ],
}

export type FeatureStripItem =
  | { kind: "status"; title: string; body: string; meta: string }
  | { kind: "action"; index: string; body: string; ctaLabel: string; href: string }
  | { kind: "people"; title: string; body: string; meta: string }

export const featureStrip: FeatureStripItem[] = [
  {
    kind: "status",
    title: "One ledger for everything",
    body: "Balances, cards, budgets and upcoming bills update the moment money moves.",
    meta: "Live updates",
  },
  {
    kind: "action",
    index: "2",
    body: "Open an account in a few minutes and get a card you can freeze from your phone.",
    ctaLabel: "Open an account",
    href: brand.signUpHref,
  },
  {
    kind: "people",
    title: "500k+ customers",
    body: "People who moved their daily banking to an account that is actually monitored.",
    meta: "Trusted in 40+ countries",
  },
]

export const about = {
  index: "01",
  pill: "About",
  statement: [
    { type: "text", value: "Our team " },
    { type: "icon", icon: BrandMark },
    { type: "text", value: "has spent five years building " },
    { type: "icon", icon: ShieldCheck },
    { type: "text", value: "monitored, low-fee banking for " },
    { type: "icon", icon: Banknote },
    { type: "text", value: "people who would rather not worry about it" },
  ] satisfies StatementPart[],
  secondary: [
    { type: "text", value: "A team of 20+ " },
    { type: "icon", icon: FingerprintPattern },
    { type: "text", value: "people, working across three time zones" },
  ] satisfies StatementPart[],
}

export type CapabilityCard = { title: string; body: string }

export const capabilities = {
  index: "02",
  pill: "Security",
  headline: "Protection that keeps working while you sleep",
  description:
    "Monitoring runs on every account, card and signed-in device. Anything unusual is surfaced with a plain-language reason and a next step.",
  highlight: {
    label: "Freeze it",
    body: "Freeze a card, review a transfer or confirm a login from one screen — before you have to call anyone.",
    ctaLabel: "See how we protect you",
    href: "#network",
  },
  cards: [
    {
      title: "Constant monitoring",
      body: "Balances, cards and sessions watched around the clock, with a running history you can read.",
    },
    {
      title: "AI-based detection",
      body: "Phishing pages, impersonation attempts and odd transfer patterns are flagged before they clear.",
    },
    {
      title: "Automatic triage",
      body: "Routine alerts are resolved for you. Anything unusual reaches a human analyst quickly.",
    },
  ] satisfies CapabilityCard[],
}

export type NetworkLogo =
  | { kind: "icon"; ariaLabel: string; icon: LandingIcon }
  | { kind: "text"; label: string }
  | { kind: "highlight"; label: string; href: string }

export const network = {
  index: "03",
  pill: "Our network",
  headline: "Connected to the rails you already use",
  description:
    "Cards run on the networks already in your wallet, and transfers clear through the same systems your salary lands on today.",
  logos: [
    { kind: "icon", ariaLabel: "Apple Pay", icon: ApplePayIcon },
    { kind: "text", label: "SWIFT" },
    { kind: "icon", ariaLabel: "Google Pay", icon: GooglePayIcon },
    { kind: "highlight", label: "Open an account", href: brand.signUpHref },
    { kind: "icon", ariaLabel: "PayPal", icon: PayPalIcon },
    { kind: "icon", ariaLabel: "Wise", icon: WiseIcon },
    { kind: "text", label: "SEPA" },
  ] satisfies NetworkLogo[],
}

export const testimonial = {
  quote:
    "Veltro replaced three apps for me. Transfers land in seconds, and when something looks off I get a real answer from a real person.",
  author: {
    initials: "AN",
    name: "Amara Nwosu",
    role: "Small business owner, Lagos",
  },
  highlights: [
    { icon: Wallet, title: "Unified dashboard" },
    { icon: PiggyBank, title: "Budget controls" },
    { icon: Send, title: "Global transfers" },
    { icon: CreditCard, title: "Card controls" },
  ] satisfies { icon: LandingIcon; title: string }[],
}

export type FooterLink = { label: string; href: string }
export type FooterGroup = { title: string; links: FooterLink[] }

export const footer = {
  cta: {
    eyebrow: "Get started",
    title: "Ready to bank on your own terms?",
    body: "Open an account in minutes, or talk to us first. No branch visit, no paperwork to post.",
    primary: { label: "Open an account", href: brand.signUpHref },
    secondary: { label: "Talk to us", href: brand.signInHref },
  },
  blurb: "Monitored banking, cards and transfers in one place.",
  groups: [
    {
      title: "Products",
      links: [
        { label: "Accounts", href: brand.signInHref },
        { label: "Cards", href: brand.signInHref },
        { label: "Transfers", href: brand.signInHref },
        { label: "Savings & goals", href: brand.signInHref },
      ],
    },
    {
      title: "Security",
      links: [
        { label: "How we protect you", href: "#security" },
        { label: "Fraud alerts", href: "#security" },
        { label: "Card controls", href: "#security" },
        { label: "Device management", href: "#security" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About us", href: "#about" },
        { label: "Network", href: "#network" },
        { label: "Customers", href: "#customers" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help centre", href: "#customers" },
        { label: "Contact support", href: "#customers" },
        { label: "System status", href: "#network" },
      ],
    },
  ] satisfies FooterGroup[],
  legal: {
    copyright: `© ${new Date().getFullYear()} ${brand.name}`,
    note: "All rights reserved.",
    links: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ] satisfies FooterLink[],
  },
}
