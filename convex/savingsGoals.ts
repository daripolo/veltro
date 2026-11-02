import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function inferKindFromAccount(account: { name?: string; type?: string; kind?: string | null }) {
  if (account.kind === "local" || account.kind === "international") return account.kind;
  const haystack = `${account.type ?? ""} ${account.name ?? ""}`.toLowerCase();
  if (haystack.includes("international")) return "international";
  return "local";
}

export const getSavingsGoals = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;
    return ctx.db
      .query("savings_goals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const createSavingsGoal = mutation({
  args: {
    title: v.string(),
    target: v.number(),
    deadline: v.string(),
    monthlyContribution: v.number(),
    priority: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = identity.subject;

    await ctx.db.insert("savings_goals", {
      userId,
      title: args.title,
      target: args.target,
      current: 0,
      deadline: args.deadline,
      monthlyContribution: args.monthlyContribution,
      priority: args.priority,
    });
  },
});

export const addFundsToGoal = mutation({
  args: {
    goalId: v.id("savings_goals"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = identity.subject;

    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new Error("Invalid amount");
    }

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== userId) {
      throw new Error("Goal not found or unauthorized");
    }

    const accounts = await ctx.db
      .query("bank_accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const localAccount = accounts.find((a) => inferKindFromAccount(a) === "local");
    if (!localAccount) {
      throw new Error("Local account not found");
    }

    if (localAccount.balance < args.amount) {
      throw new Error("Insufficient balance");
    }

    await ctx.db.patch(localAccount._id, {
      balance: localAccount.balance - args.amount,
    });

    const newCurrent = goal.current + args.amount;
    await ctx.db.patch(args.goalId, { current: newCurrent });
  },
});
