import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

function generateCardNumber16() {
  const prefixes = ["446542", "480011", "414720"] as const;
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  const luhnCheckDigit = (numberWithoutCheckDigit: string) => {
    let sum = 0;
    let shouldDouble = true;

    for (let i = numberWithoutCheckDigit.length - 1; i >= 0; i--) {
      let digit = Number(numberWithoutCheckDigit[i]);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return (10 - (sum % 10)) % 10;
  };

  const randomDigitsCount = 15 - prefix.length;
  const randomDigits = Array.from({ length: randomDigitsCount }, () =>
    Math.floor(Math.random() * 10),
  ).join("");

  const partial = `${prefix}${randomDigits}`;
  const full = `${partial}${luhnCheckDigit(partial)}`;

  return `${full.slice(0, 4)} ${full.slice(4, 8)} ${full.slice(8, 12)} ${full.slice(12, 16)}`;
}

function generateCvv3() {
  return Math.floor(Math.random() * 900) + 100;
}

function dueDateInThreeYearsFromNow(now = new Date()) {
  const month = now.getMonth() + 1;
  const year2 = (now.getFullYear() + 3) % 100;
  return `${month}/${String(year2).padStart(2, "0")}`;
}

export const getCreditCards = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;
    return ctx.db
      .query("credit_cards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const ensureDefaultCard = mutation({
  args: {},
  returns: v.union(v.id("credit_cards"), v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const billingAddress =
      typeof user?.address === "string" && user.address.trim()
        ? user.address.trim()
        : "Online";

    const existing = (await ctx.db
      .query("credit_cards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()) as Doc<"credit_cards"> | null;

    if (existing) {
      const patch: { freeze?: boolean; billingAddress?: string; pin?: number; cvv?: number } = {};
      const existingWithNewFields = existing as unknown as {
        freeze?: boolean;
        billingAddress?: string;
        pin?: number;
        cvv?: number;
      };

      if (existingWithNewFields.freeze === undefined) patch.freeze = false;
      if (existingWithNewFields.billingAddress === undefined) {
        patch.billingAddress = billingAddress;
      }
      if (existingWithNewFields.pin === undefined) patch.pin = 1234;
      if (existingWithNewFields.cvv === undefined) patch.cvv = 123;

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch as any);
      }

      return existing._id;
    }

    const id = await ctx.db.insert("credit_cards", {
      userId,
      name: "Veltro Gold",
      number: generateCardNumber16(),
      balance: 0,
      limit: 5000,
      dueDate: dueDateInThreeYearsFromNow(),
      minPayment: 0,
      rewards: "2% Cashback",
      apr: "18.9%",
      freeze: false,
      billingAddress,
      pin: 1234,
      cvv: generateCvv3(),
    } as any);

    return id;
  },
});
export const createCard = mutation({
  args: {
    name: v.string(),
    number: v.string(),
    dueDate: v.string(),
    cvv: v.number(),
    pin: v.number(),
    billingAddress: v.string(),
  },
  returns: v.union(v.id("credit_cards"), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    const id = await ctx.db.insert("credit_cards", {
      userId,
      name: args.name,
      number: args.number,
      balance: 0,
      limit: 5000,
      dueDate: args.dueDate,
      minPayment: 0,
      rewards: "2% Cashback",
      apr: "18.9%",
      freeze: false,
      billingAddress: args.billingAddress,
      pin: args.pin,
      cvv: args.cvv,
    } as any);

    return id;
  },
});

export const setCardFreeze = mutation({
  args: { id: v.id("credit_cards"), freeze: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;

    const card = await ctx.db.get(args.id);
    if (!card) return null;
    if (card.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, { freeze: args.freeze } as any);
    return null;
  },
});

export const setCardPin = mutation({
  args: { id: v.id("credit_cards"), pin: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;

    const card = await ctx.db.get(args.id);
    if (!card) return null;
    if (card.userId !== userId) {
      throw new Error("Unauthorized");
    }

    if (args.pin < 1000 || args.pin > 9999) {
      throw new Error("PIN must be a 4-digit number");
    }

    await ctx.db.patch(args.id, { pin: args.pin } as any);
    return null;
  },
});

export const topUpCardFromLocal = mutation({
  args: { cardId: v.id("credit_cards"), amount: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new Error("Invalid amount");
    }

    const userId = identity.subject;

    const card = await ctx.db.get(args.cardId);
    if (!card) return null;
    if (card.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const localAccount = await ctx.db
      .query("bank_accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("type"), "local"))
      .first();

    if (!localAccount) {
      throw new Error("Local account not found");
    }

    if (localAccount.balance < args.amount) {
      throw new Error("Insufficient local account balance");
    }

    await ctx.db.patch(localAccount._id, { balance: localAccount.balance - args.amount });
    await ctx.db.patch(card._id, { balance: card.balance + args.amount } as any);

    const now = new Date().toISOString();
    await ctx.db.insert("transactions", {
      userId,
      bankAccountId: localAccount._id,
      description: `Card top up • ${card.name}`,
      amount: -args.amount,
      date: now,
      category: "Card",
      status: "completed",
      merchant: "Internal",
      location: "Veltro",
    });

    return null;
  },
});

export const internalCreateCreditCard = internalMutation({
  args: {
    userId: v.string(),
    name: v.string(),
    number: v.string(),
    dueDate: v.string(),
    cvv: v.number(),
    pin: v.number(),
    billingAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("credit_cards", {
      userId: args.userId,
      name: args.name,
      number: args.number,
      balance: 0,
      limit: 5000,
      dueDate: args.dueDate,
      minPayment: 0,
      rewards: "1% Cashback",
      apr: "19.99%",
      freeze: false,
      billingAddress: args.billingAddress,
      pin: args.pin,
      cvv: args.cvv,
    } as any);

    return id;
  },
});

export const createCreditCard = mutation({
  args: {
    name: v.string(),
    number: v.string(),
    dueDate: v.string(),
    cvv: v.number(),
    pin: v.number(),
    billingAddress: v.string(),
  },
  returns: v.id("credit_cards"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;

    // Validate inputs
    if (!args.number.match(/^\d{4} \d{4} \d{4} \d{4}$/) && !args.number.match(/^\*\*\*\*\d{4}$/)) {
      // Allow masked or full format for demo, but typically we'd validate stricter
    }

    const id = await ctx.db.insert("credit_cards", {
      userId,
      name: args.name,
      number: args.number,
      balance: 0,
      limit: 5000, // Default limit
      dueDate: args.dueDate,
      minPayment: 0,
      rewards: "1% Cashback",
      apr: "19.99%",
      freeze: false,
      billingAddress: args.billingAddress,
      pin: args.pin,
      cvv: args.cvv,
    } as any);

    return id;
  },
});



export const deleteCreditCard = mutation({
  args: { id: v.id("credit_cards") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;

    const card = await ctx.db.get(args.id);
    if (!card) return null;
    if (card.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});
