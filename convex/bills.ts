import { query } from "./_generated/server";

export const getBills = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;
    return ctx.db
      .query("bills")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});
