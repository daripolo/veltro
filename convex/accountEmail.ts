import type { MutationCtx, QueryCtx } from "./_generated/server";

type EmailCtx = QueryCtx | MutationCtx;

/**
 * Bank accounts are written by authenticated users and by internal
 * deposit/webhook flows. The app's user record is authoritative for the
 * account holder; the auth identity is only used when it belongs to the same
 * user and no profile row exists yet.
 */
export async function resolveUserEmail(
  ctx: EmailCtx,
  userId: string,
): Promise<string | null> {
  const user = await ctx.db
    .query("user")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();

  if (typeof user?.email === "string" && user.email.trim()) {
    return user.email.trim();
  }

  const identity = await ctx.auth.getUserIdentity();
  if (
    identity?.subject === userId &&
    typeof identity.email === "string" &&
    identity.email.trim()
  ) {
    return identity.email.trim();
  }

  return null;
}
