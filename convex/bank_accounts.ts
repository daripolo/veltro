import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { resolveUserEmail } from "./accountEmail";

export const getMyBankAccounts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const accounts = await ctx.db
      .query("bank_accounts")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const email = await resolveUserEmail(ctx, identity.subject);
    return accounts.map((account) => ({
      ...account,
      email: account.email ?? email ?? undefined,
    }));
  },
});

export const addBankAccount = mutation({
  args: {
    bankId: v.id("banks"),
    accountHolderName: v.string(),
    accountNumber: v.string(),
    routingNumber: v.optional(v.string()),
    type: v.union(v.literal("local"), v.literal("international")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const email = await resolveUserEmail(ctx, identity.subject);

    await ctx.db.insert("bank_accounts", {
      userId: identity.subject,
      name: args.accountHolderName,
      number: args.accountNumber,
      routingNumber: args.routingNumber,
      type: args.type,
      kind: args.type,
      balance: 0,
      email: email ?? undefined,
      interestRate: "0%",
      currency: "USD",
    });
  },
});
