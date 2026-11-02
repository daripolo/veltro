
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

function issuanceFeeForCurrency(currency: string) {
  switch (currency.trim().toUpperCase()) {
    case "USD":
      return 50;
    case "EUR":
      return 45;
    case "GBP":
      return 40;
    case "CAD":
      return 65;
    case "AUD":
      return 70;
    case "CHF":
      return 45;
    case "JPY":
      return 7500;
    case "CNY":
      return 360;
    case "INR":
      return 4200;
    case "NGN":
      return 15000;
    case "BRL":
      return 250;
    case "RUB":
      return 4500;
    case "KRW":
      return 65000;
    case "ZAR":
      return 900;
    case "SEK":
    case "NOK":
      return 550;
    case "DKK":
      return 350;
    case "SGD":
      return 70;
    case "HKD":
      return 390;
    case "NZD":
      return 75;
    case "MXN":
      return 850;
    case "ARS":
      return 50000;
    case "TRY":
      return 1500;
    case "AED":
      return 180;
    case "SAR":
      return 190;
    default:
      return 50;
  }
}


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

export const requestCard = mutation({
  args: {
    bankAccountId: v.optional(v.id("bank_accounts")),
  },
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = identity.subject;

    const id = await ctx.db.insert("card_requests", {
      userId,
      status: "pending",
    });

    return id;
  },
});

export const submitRequestDetails = mutation({
  args: {
    requestId: v.id("card_requests"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.userId !== identity.subject) throw new Error("Unauthorized");
  },
});

export const approveRequest = mutation({
  args: { requestId: v.id("card_requests") },
  handler: async (ctx, args) => {
    // In a real app, check for admin role here
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.status !== "pending") throw new Error("Request not pending");

    await ctx.db.patch(args.requestId, { status: "approved" });

    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", request.userId))
      .first();

    const currency =
      (typeof user?.currency === "string" && user.currency.trim()) ||
      "USD";

    const fee = issuanceFeeForCurrency(currency);

    const localAccount = (await ctx.db
      .query("bank_accounts")
      .withIndex("by_user", (q) => q.eq("userId", request.userId))
      .filter((q) => q.eq(q.field("type"), "local"))
      .first()) as Doc<"bank_accounts"> | null;

    if (!localAccount) throw new Error("No local account found");
    if (localAccount.userId !== request.userId) throw new Error("Unauthorized");
    if (localAccount.type !== "local" && localAccount.kind !== "local") {
      throw new Error("Issuance fee must be paid from a local account");
    }
    if (localAccount.balance < fee) throw new Error("Insufficient funds for issuance fee");

    await ctx.db.patch(localAccount._id, { balance: localAccount.balance - fee });

    await ctx.db.insert("transactions", {
      userId: request.userId,
      bankAccountId: localAccount._id,
      description: "Card Issuance Fee",
      amount: -fee,
      date: new Date().toISOString(),
      category: "Fees",
      status: "completed",
      merchant: "Veltro",
      location: "Online",
    });

    await ctx.scheduler.runAfter(0, internal.creditCards.internalCreateCreditCard, {
      userId: request.userId,
      name: "Veltro Card",
      number: generateCardNumber16(),
      dueDate: dueDateInThreeYearsFromNow(),
      cvv: generateCvv3(),
      pin: 1234,
      billingAddress: typeof user?.address === "string" && user.address.trim() ? user.address.trim() : "Online",
    });

    await ctx.scheduler.runAfter(0, internal.notifications.internalCreateNotification, {
      userId: request.userId,
      title: "Card request approved",
      message: "Your card request has been approved.",
      time: new Date().toISOString(),
      type: "success",
      icon: "ri-bank-card-line",
    });
  },
});

