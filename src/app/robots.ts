import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

/**
 * Public marketing pages are crawlable; the authenticated app and the
 * account-flow screens are not useful in search results and stay private.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/auth/",
          "/onboarding",
          "/verify-email",
          "/reset-password",
          "/home",
          "/accounts",
          "/cards",
          "/transfers",
          "/deposit",
          "/convert",
          "/loans",
          "/investments",
          "/transactions",
          "/notifications",
          "/profile",
          "/settings",
          "/support",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
