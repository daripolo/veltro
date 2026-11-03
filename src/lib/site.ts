/**
 * Canonical public site details. `SITE_URL` can be overridden per environment
 * (preview deployments, local development) without touching metadata code.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://veltroonline.online"
).replace(/\/+$/, "")

export const SITE_NAME = "Veltro"

export const SITE_TAGLINE = "Banking that moves at your speed."

export const SITE_DESCRIPTION =
  "Banking, transfers and investments — your money, protected and in one place."

export const SITE_TITLE = `${SITE_NAME} — Banking, transfers and investments`

export const SITE_KEYWORDS = [
  "Veltro",
  "online banking",
  "multi-currency account",
  "international transfers",
  "virtual cards",
  "savings",
  "investments",
  "personal finance",
]

export const SUPPORT_EMAIL = "support@veltroonline.online"
