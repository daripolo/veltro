import { internalMutation } from "./_generated/server";

/**
 * Copies `user.email` onto existing bank accounts that predate the `email`
 * field. Paginates internally so the query stays bounded per page.
 */
export const backfillBankAccountEmails = internalMutation({
  args: {},
  handler: async (ctx) => {
    let cursor: string | null = null;
    let scanned = 0;
    let patched = 0;
    let unresolved = 0;

    do {
      const page = await ctx.db.query("bank_accounts").paginate({
        numItems: 100,
        cursor,
      });

      for (const account of page.page) {
        if (typeof account.email === "string" && account.email.trim()) continue;

        const user = await ctx.db
          .query("user")
          .withIndex("by_userId", (q) => q.eq("userId", account.userId))
          .first();

        const email = typeof user?.email === "string" ? user.email.trim() : "";
        if (!email) {
          unresolved += 1;
          continue;
        }

        await ctx.db.patch(account._id, { email });
        patched += 1;
      }

      scanned += page.page.length;
      cursor = page.isDone ? null : page.continueCursor;
    } while (cursor);

    return { scanned, patched, unresolved };
  },
});
