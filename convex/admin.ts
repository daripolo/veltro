import { ConvexError, v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return admins.length > 0 && admins.includes(email.toLowerCase());
}

async function requireAdmin(ctx: {
  auth: { getUserIdentity: () => Promise<unknown> };
}) {
  const identity = (await ctx.auth.getUserIdentity()) as {
    email?: string | null;
  } | null;
  if (!identity || !isAdminEmail(identity.email)) {
    throw new ConvexError("Forbidden");
  }
  return identity;
}

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = (await ctx.auth.getUserIdentity()) as {
      email?: string | null;
    } | null;
    return isAdminEmail(identity?.email);
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("user").order("desc").collect();
    return users;
  },
});

export const getUserDetails = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!user) throw new ConvexError("User not found");

    const accounts = (await ctx.db
      .query("bank_accounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()) as Doc<"bank_accounts">[];

    const transactions = (await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10)) as Doc<"transactions">[];

    return { user, accounts, transactions };
  },
});

export const adminCreateTransfer = mutation({
  args: {
    targetUserId: v.string(),
    type: v.string(),
    recipient: v.string(),
    amount: v.number(),
    note: v.string(),
    fromAccountId: v.id("bank_accounts"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const targetUser = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .first();
    if (!targetUser) throw new ConvexError("Target user not found");

    const note = args.note.trim();
    if (note.length > 18) {
      throw new ConvexError("Note must be 18 characters or less");
    }
    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new ConvexError("Amount must be greater than 0");
    }
    if (args.type === "request") {
      throw new ConvexError("Admin cannot create requests");
    }

    const fromAccount = (await ctx.db.get(
      args.fromAccountId,
    )) as Doc<"bank_accounts"> | null;
    if (!fromAccount || fromAccount.userId !== args.targetUserId) {
      throw new ConvexError("Invalid from account");
    }

    const currency = fromAccount.currency || "USD";

    let recipientUserId: string | undefined;
    let recipientAccountId: Id<"bank_accounts"> | undefined;

    if (args.type === "local" || args.type === "currency") {
      if (fromAccount.balance < args.amount) {
        throw new ConvexError("Insufficient balance");
      }
    }

    if (args.type === "email") {
      const recipientUser = await ctx.db
        .query("user")
        .withIndex("by_email", (q) => q.eq("email", args.recipient))
        .first();

      if (!recipientUser || !recipientUser.userId) {
        throw new ConvexError("Recipient user not found");
      }

      const recipientAccounts = await ctx.db
        .query("bank_accounts")
        .withIndex("by_user", (q) => q.eq("userId", recipientUser.userId!))
        .collect();

      const recipientAccount = recipientAccounts.find(
        (a) => a.currency === currency,
      );
      if (!recipientAccount) {
        throw new ConvexError(
          "Recipient does not have an account with matching currency",
        );
      }

      if (fromAccount.balance < args.amount) {
        throw new ConvexError("Insufficient balance");
      }

      recipientUserId = recipientUser.userId;
      recipientAccountId = recipientAccount._id;
    }

    const transferId = await ctx.db.insert("transfers", {
      userId: args.targetUserId,
      type: args.type,
      from: fromAccount.name,
      fromAccountId: args.fromAccountId,
      to: args.recipient,
      amount: args.amount,
      note,
      status: "completed",
      timestamp: new Date().toISOString(),
      fee: 0,
    });

    if (args.type === "local" || args.type === "currency") {
      await ctx.db.patch(fromAccount._id, {
        balance: fromAccount.balance - args.amount,
      });
    }

    if (args.type === "email" && recipientAccountId) {
      const recipientAccount = await ctx.db.get(recipientAccountId);
      await ctx.db.patch(fromAccount._id, {
        balance: fromAccount.balance - args.amount,
      });
      await ctx.db.patch(recipientAccountId, {
        balance: (recipientAccount?.balance ?? 0) + args.amount,
      });
    }

    return {
      transferId,
      recipientUserId,
      recipientAccountId,
      fromAccountId: fromAccount._id,
      senderName: targetUser.firstName || targetUser.email || "Sender",
      senderEmail: targetUser.email,
      currency,
    };
  },
});

export const adminCreateTransaction = mutation({
  args: {
    targetUserId: v.string(),
    bankAccountId: v.id("bank_accounts"),
    amount: v.number(),
    description: v.string(),
    date: v.string(),
    category: v.string(),
    status: v.string(),
    merchant: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const targetUser = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .first();
    if (!targetUser) throw new ConvexError("Target user not found");

    if (!Number.isFinite(args.amount) || args.amount === 0) {
      throw new ConvexError("Amount must be greater than 0");
    }

    const account = (await ctx.db.get(
      args.bankAccountId,
    )) as Doc<"bank_accounts"> | null;
    if (!account || account.userId !== args.targetUserId) {
      throw new ConvexError("Invalid account");
    }

    if (args.amount < 0 && (account.balance ?? 0) + args.amount < 0) {
      throw new ConvexError("Insufficient balance");
    }

    const newBalance = Number(
      ((account.balance ?? 0) + args.amount).toFixed(2),
    );
    await ctx.db.patch(account._id, { balance: newBalance });

    const transactionId = await ctx.db.insert("transactions", {
      userId: args.targetUserId,
      bankAccountId: account._id,
      description: args.description,
      amount: args.amount,
      date: args.date,
      category: args.category,
      status: args.status,
      merchant: args.merchant,
      location: args.location,
    });

    await ctx.db.insert("notifications", {
      userId: args.targetUserId,
      title: args.amount > 0 ? "Money Received" : "Money Sent",
      message: `${args.merchant || args.description} — ${args.amount > 0 ? "+" : "-"}${account.currency || "USD"} ${Math.abs(args.amount).toFixed(2)}`,
      time: "Just now",
      type: "success",
      read: false,
      icon: args.amount > 0 ? "ri-arrow-left-down-line" : "ri-send-plane-fill",
    });

    return { transactionId, newBalance };
  },
});
