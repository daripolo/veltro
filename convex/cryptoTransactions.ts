import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const ingest = mutation({
  args: {
    userId: v.string(),
    chain: v.string(),
    network: v.string(),
    asset: v.string(),
    hash: v.string(),
    from: v.string(),
    to: v.string(),
    value: v.string(),
    memo: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cryptoTransactions")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .first();

    if (existing) return { inserted: false };

    await ctx.db.insert("cryptoTransactions", {
      ...args,
      confirmations: 0,
    });

    return { inserted: true };
  },
});

export const updateConfirmations = mutation({
  args: {
    hash: v.string(),
    confirmations: v.number(),
  },
  handler: async (ctx, { hash, confirmations }) => {
    const tx = await ctx.db
      .query("cryptoTransactions")
      .withIndex("by_hash", (q) => q.eq("hash", hash))
      .first();

    if (!tx) return;

    await ctx.db.patch(tx._id, { confirmations });
  },
});

export const listForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("cryptoTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

function last4FromUserId(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i) + 17) >>> 0;
  }
  return String(hash % 10000).padStart(4, "0");
}

function isLocalAccount(account: { kind?: string | null; type?: string | null; name?: string | null }) {
  if (account.kind === "local" || account.type === "local") return true;
  const haystack = `${account.type ?? ""} ${account.name ?? ""}`.toLowerCase();
  return !haystack.includes("international");
}

export const ingestAndCreditLocal = mutation({
  args: {
    secret: v.string(),
    userId: v.string(),
    chain: v.string(),
    network: v.string(),
    asset: v.string(),
    hash: v.string(),
    from: v.string(),
    to: v.string(),
    value: v.string(),
    memo: v.optional(v.string()),
    timestamp: v.number(),
    fiatAmount: v.number(),
    fiatCurrency: v.string(),
    confirmations: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!process.env.WEBHOOK_SHARED_SECRET) {
      throw new Error("Missing WEBHOOK_SHARED_SECRET");
    }
    if (args.secret !== process.env.WEBHOOK_SHARED_SECRET) {
      return { inserted: false as const };
    }

    const existing = await ctx.db
      .query("cryptoTransactions")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .first();

    if (existing) return { inserted: false as const };

    const confirmations = args.confirmations ?? 0;

    await ctx.db.insert("cryptoTransactions", {
      userId: args.userId,
      chain: args.chain,
      asset: args.asset,
      network: args.network,
      hash: args.hash,
      from: args.from,
      to: args.to,
      value: args.value,
      memo: args.memo,
      confirmations,
      timestamp: args.timestamp,
    });

    const accounts = await ctx.db
      .query("bank_accounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let local = accounts.find((a) => isLocalAccount(a));
    if (!local) {
      const id = await ctx.db.insert("bank_accounts", {
        userId: args.userId,
        kind: "local",
        type: "local",
        name: "Local Account",
        number: `****${last4FromUserId(args.userId)}`,
        balance: 0,
        interestRate: "1.2%",
      });
      const created = await ctx.db.get(id);
      if (created) local = created;
    }

    if (!local) return { inserted: true as const, credited: false as const };

    const nextBalance = Number((local.balance + args.fiatAmount).toFixed(2));
    await ctx.db.patch(local._id, { balance: nextBalance });

    await ctx.db.insert("transactions", {
      userId: args.userId,
      bankAccountId: local._id,
      description: `Crypto deposit (${args.asset})`,
      amount: Number(args.fiatAmount.toFixed(2)),
      date: new Date(args.timestamp).toISOString(),
      category: "Crypto",
      status: "completed",
      merchant: args.asset,
      location: `${args.chain}:${args.network}:${args.fiatCurrency}`,
    });

    return { inserted: true as const, credited: true as const, bankAccountId: local._id };
  },
});
