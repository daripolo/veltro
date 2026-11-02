import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export const getTransfers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("transfers"),
      _creationTime: v.number(),
      userId: v.string(),
      type: v.string(),
      from: v.string(),
      fromAccountId: v.optional(v.id("bank_accounts")),
      to: v.string(),
      amount: v.number(),
      note: v.optional(v.string()),
      status: v.string(),
      timestamp: v.string(),
      fee: v.number(),
      exchangeRate: v.optional(v.number()),
      provider: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;
    const transfers = (await ctx.db
      .query("transfers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect()) as Doc<"transfers">[];
    return transfers;
  },
});

export const getIncomingRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || typeof identity.email !== "string") return [];

    const email = identity.email;
    const transfers = (await ctx.db
      .query("transfers")
      .withIndex("by_to", (q) => q.eq("to", email))
      .order("desc")
      .collect()) as Doc<"transfers">[];

    return transfers.filter((t) => t.type === "request" && t.status === "pending");
  },
});

export const createTransfer = mutation({
  args: {
    recipient: v.string(),
    amount: v.number(),
    note: v.string(),
    type: v.string(),
    fromAccountId: v.id("bank_accounts"),
  },
  returns: v.any(), // Changed from v.id("transfers") to allow returning object
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = identity.subject;

    const note = args.note.trim();
    if (note.length === 0) {
      throw new Error("Note is required");
    }
    if (note.length > 18) {
      throw new Error("Note must be 18 characters or less");
    }
    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const fromAccount = (await ctx.db.get(args.fromAccountId)) as Doc<"bank_accounts"> | null;
    if (!fromAccount || fromAccount.userId !== userId) {
      throw new Error("Invalid from account");
    }
    // Allow both local and international accounts for transfers
    // if (fromAccount.type !== "local" && fromAccount.kind !== "local") {
    //   throw new Error("Transfers can only be made from a local account");
    // }

    const isRequest = args.type === "request";
    const senderLabel = identity.name || identity.email || fromAccount.name;
    const transferStatus = isRequest ? "pending" : "completed";

    const transferId = await ctx.db.insert("transfers", {
      userId,
      type: args.type,
      from: isRequest ? senderLabel : fromAccount.name,
      fromAccountId: args.fromAccountId,
      to: args.recipient,
      amount: args.amount,
      note,
      status: transferStatus,
      timestamp: new Date().toISOString(),
      fee: 0,
    });

    if (isRequest) {
      const recipientUser = await ctx.db
        .query("user")
        .withIndex("by_email", (q) => q.eq("email", args.recipient))
        .first();

      if (recipientUser?.userId) {
        const currency = fromAccount.currency || "USD";
        await ctx.db.insert("notifications", {
          userId: recipientUser.userId,
          title: "Payment Request",
          message: `${senderLabel} requested ${args.amount} ${currency}`,
          time: "Just now",
          type: "info",
          read: false,
          icon: "ri-hand-coin-line",
        });
      }

      return transferId;
    }

    if (args.type === 'email') {
        const recipientUser = await ctx.db
            .query("user")
            .withIndex("by_email", (q) => q.eq("email", args.recipient))
            .first();

        if (!recipientUser || !recipientUser.userId) {
             throw new Error("Recipient user not found");
        }

        const recipientAccounts = await ctx.db
            .query("bank_accounts")
            .withIndex("by_user", (q) => q.eq("userId", recipientUser.userId!))
            .collect();

        const recipientAccount = recipientAccounts.find(
            (a) => a.currency === (fromAccount.currency || 'USD')
        );

        if (!recipientAccount) {
             throw new Error("Recipient does not have an account with matching currency");
        }

        if (fromAccount.balance < args.amount) {
            throw new Error("Insufficient balance");
        }

        // Deduct from sender
        await ctx.db.patch(fromAccount._id, {
            balance: fromAccount.balance - args.amount,
        });

        // Add to recipient
        await ctx.db.patch(recipientAccount._id, {
            balance: recipientAccount.balance + args.amount,
        });

        // Return details needed for frontend to create transactions/notifications
        return {
            transferId,
            recipientUserId: recipientUser.userId,
            recipientAccountId: recipientAccount._id,
            fromAccountId: fromAccount._id,
            senderName: identity.name || identity.email || "Sender",
            senderEmail: identity.email,
            currency: fromAccount.currency || 'USD'
        };
    }

    return transferId;
  },
});

export const createLocalTransfer = mutation({
  args: {
    recipient: v.string(),
    amount: v.number(),
    note: v.string(),
    type: v.string(),
    fromAccountId: v.id("bank_accounts"),
  },
  returns: v.any(), // Changed from v.id("transfers") to allow returning object
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = identity.subject;

    const note = args.note.trim();
    if (note.length === 0) {
      throw new Error("Note is required");
    }
    if (note.length > 18) {
      throw new Error("Note must be 18 characters or less");
    }
    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const fromAccount = (await ctx.db.get(args.fromAccountId)) as Doc<"bank_accounts"> | null;
    if (!fromAccount || fromAccount.userId !== userId) {
      throw new Error("Invalid from account");
    }
    // Allow both local and international accounts for transfers
    // if (fromAccount.type !== "local" && fromAccount.kind !== "local") {
    //   throw new Error("Transfers can only be made from a local account");
    // }

    const transferId = await ctx.db.insert("transfers", {
      userId,
      type: args.type,
      from: fromAccount.name,
      fromAccountId: args.fromAccountId,
      to: args.recipient,
      amount: args.amount,
      note,
      status: "pending",
      timestamp: new Date().toISOString(),
      fee: 0,
    });

    if (args.type === 'email') {
        const recipientUser = await ctx.db
            .query("user")
            .withIndex("by_email", (q) => q.eq("email", args.recipient))
            .first();

        if (!recipientUser || !recipientUser.userId) {
             throw new Error("Recipient user not found");
        }

        const recipientAccounts = await ctx.db
            .query("bank_accounts")
            .withIndex("by_user", (q) => q.eq("userId", recipientUser.userId!))
            .collect();

        const recipientAccount = recipientAccounts.find(
            (a) => a.currency === (fromAccount.currency || 'USD')
        );

        if (!recipientAccount) {
             throw new Error("Recipient does not have an account with matching currency");
        }

        if (fromAccount.balance < args.amount) {
            throw new Error("Insufficient balance");
        }

        // Deduct from sender
        await ctx.db.patch(fromAccount._id, {
            balance: fromAccount.balance - args.amount,
        });

        // Add to recipient
        await ctx.db.patch(recipientAccount._id, {
            balance: recipientAccount.balance + args.amount,
        });

        // Return details needed for frontend to create transactions/notifications
        return {
            transferId,
            recipientUserId: recipientUser.userId,
            recipientAccountId: recipientAccount._id,
            fromAccountId: fromAccount._id,
            senderName: identity.name || identity.email || "Sender",
            senderEmail: identity.email,
            currency: fromAccount.currency || 'USD'
        };
    }

    return transferId;
  },
});
