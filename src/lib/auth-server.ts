import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

/**
 * Public vars are what the browser and the server normally use. The
 * non-public fallbacks let server-only builds (CI, preview deployments) run
 * with the Convex-provided names instead.
 */
const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;
const convexSiteUrl =
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? process.env.CONVEX_SITE_URL;

if (!convexUrl || !convexSiteUrl) {
  throw new Error(
    "Missing Convex environment variables. Set NEXT_PUBLIC_CONVEX_URL and " +
      "NEXT_PUBLIC_CONVEX_SITE_URL (or CONVEX_URL and CONVEX_SITE_URL for " +
      "server-only builds).",
  );
}

export const {
  handler,
  preloadAuthQuery,
  isAuthenticated,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthNextJs({
  convexUrl,
  convexSiteUrl,
});
