import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { COUNTRIES } from "./constants";

const accountKindValidator = v.union(v.literal("local"), v.literal("international"));

const bankAccountValidator = v.object({
  _id: v.optional(v.id("bank_accounts")),
  _creationTime: v.optional(v.number()),
  userId: v.string(),
  name: v.string(),
  number: v.string(),
  type: accountKindValidator,
  kind: v.optional(accountKindValidator),
  currency: v.optional(v.string()),
  region: v.optional(v.string()),
  balance: v.number(),
  interestRate: v.string(),
  availableCredit: v.optional(v.number()),
  creditUsed: v.optional(v.number()),
  monthlyIncome: v.optional(v.number()),
  monthlyExpenses: v.optional(v.number()),
  savingsRate: v.optional(v.number()),
  creditScore: v.optional(v.number()),
});

function inferKindFromAccount(account: { name?: string; type?: string; kind?: string | null }) {
  if (account.kind === "local" || account.kind === "international") return account.kind;
  const haystack = `${account.type ?? ""} ${account.name ?? ""}`.toLowerCase();
  if (haystack.includes("international")) return "international";
  return "local";
}

const REGIONS = COUNTRIES;

const SOUTH_AMERICAN_CODES = ['BR', 'AR', 'CO', 'PE', 'CL', 'UY', 'PY', 'BO', 'EC', 'VE', 'GY', 'SR'];
const AFRICAN_CODES = ['NG', 'ZA', 'EG', 'KE', 'GH', 'MA', 'DZ', 'ET', 'TZ', 'UG', 'SD', 'SN', 'CI', 'AO', 'ZM', 'ZW', 'BW', 'NA', 'MZ', 'MG', 'CM', 'BJ', 'BF', 'ML', 'NE', 'TG', 'GA', 'CG', 'CD', 'RW', 'BI', 'SS', 'SO', 'ER', 'DJ', 'SL', 'LR', 'GN', 'GW', 'GM', 'CV', 'ST', 'GQ', 'CF', 'TD', 'LY', 'TN', 'MR', 'EH', 'KM', 'SC', 'MU'];
const EUROPEAN_CURRENCIES = ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'ISK', 'RSD', 'BAM', 'MKD', 'ALL', 'MDL', 'UAH', 'BYN', 'RUB'];

function getCurrenciesForRegion(regionNameOrCode: string = "US") {
  // 1. Resolve to Code
  let regionCode = regionNameOrCode;
  let localConfig = REGIONS[regionCode];
  
  if (!localConfig) {
      // Try finding by name
      const entry = Object.entries(REGIONS).find(([code, data]) => data.name === regionNameOrCode);
      if (entry) {
          regionCode = entry[0];
          localConfig = entry[1];
      } else {
          // Fallback to US
          regionCode = 'US';
          localConfig = REGIONS['US'];
      }
  }
  
  const localCurrency = localConfig.currency;
  
  let internationalCurrency = 'USD';
  let internationalRegion = 'US';
  
  // Logic Tree
  if (localCurrency === 'USD' || localCurrency === 'CAD') {
      // Pick a random option from valid region/currency pairs
      const options = [
          { currency: 'EUR', regions: ['DE', 'LU', 'FR', 'IT', 'ES', 'NL'] },
          { currency: 'GBP', regions: ['GB'] },
          { currency: 'CHF', regions: ['CH', 'LI'] }
      ];
      
      const selectedOption = options[Math.floor(Math.random() * options.length)];
      internationalCurrency = selectedOption.currency;
      internationalRegion = selectedOption.regions[Math.floor(Math.random() * selectedOption.regions.length)];
  } else if (SOUTH_AMERICAN_CODES.includes(regionCode) || AFRICAN_CODES.includes(regionCode)) {
      internationalCurrency = 'USD';
      internationalRegion = 'US';
  } else if (EUROPEAN_CURRENCIES.includes(localCurrency)) {
      internationalCurrency = 'USD';
      internationalRegion = 'US';
  } else {
      // Assume Middle East / Asia (or others not covered)
      // Exception: Israel
      if (regionCode === 'IL' && localCurrency === 'ILS') {
          internationalCurrency = 'USD';
          internationalRegion = 'US';
      } else {
          // Middle East / Asia -> EUR
          internationalCurrency = 'EUR';
          const pool = ['DE', 'CH', 'LU', 'LI'];
          internationalRegion = pool[Math.floor(Math.random() * pool.length)];
      }
  }

  const international = { currency: internationalCurrency, region: internationalRegion };
  const local = { currency: localCurrency, region: regionCode };

  return { local, international };
}

function generateAccountNumber(userId: string, salt: number) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i) + salt) >>> 0;
  }
  // Generate 8 random-ish digits from the hash
  const suffix = String(hash % 100000000).padStart(8, "0");
  return `51${suffix}`;
}

function defaultAccountFor(userId: string, kind: "local" | "international", overrides: { currency?: string, region?: string } = {}) {
  const accountNumber = generateAccountNumber(userId, kind === "local" ? 17 : 29);
  return {
    userId,
    kind,
    type: kind,
    name: kind === "local" ? "Local Account" : "International Account",
    number: accountNumber,
    currency: overrides.currency ?? (kind === "local" ? "USD" : "EUR"),
    region: overrides.region,
    balance: 0,
    interestRate: kind === "local" ? "1.2%" : "0.4%",
  };
}

export const getAccount = query({
  args: { accountId: v.id("bank_accounts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId) return null;

    return account;
  },
});

export const getAccounts = query({
  args: {},
  returns: v.array(bankAccountValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    const accounts = (await ctx.db
      .query("bank_accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()) as Doc<"bank_accounts">[];

    const local = accounts.find((a) => inferKindFromAccount(a) === "local");
    const international = accounts.find((a) => inferKindFromAccount(a) === "international");

    return [
      local ?? defaultAccountFor(userId, "local"),
      international ?? defaultAccountFor(userId, "international"),
    ];
  },
});

export const ensureUserAccounts = mutation({
  args: { region: v.optional(v.string()) },
  returns: v.union(
    v.object({
      localId: v.id("bank_accounts"),
      internationalId: v.id("bank_accounts"),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    // Use passed region or fall back to user profile country, or default to US
    let region = args.region;
    if (!region) {
      const user = await ctx.db
        .query("user")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      region = user?.country ?? "US";
    }

    const { local: localConfig, international: internationalConfig } = getCurrenciesForRegion(region);

    const existing = (await ctx.db
      .query("bank_accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()) as Doc<"bank_accounts">[];

    let local = existing.find((a) => inferKindFromAccount(a) === "local");
    let international = existing.find((a) => inferKindFromAccount(a) === "international");

    if (local === undefined) {
      const id = await ctx.db.insert("bank_accounts", defaultAccountFor(userId, "local", localConfig));
      const created = (await ctx.db.get(id)) as Doc<"bank_accounts"> | null;
      if (!created) {
        throw new Error("Failed to create local account");
      }
      local = created;
    }

    if (international === undefined) {
      const id = await ctx.db.insert("bank_accounts", defaultAccountFor(userId, "international", internationalConfig));
      const created = (await ctx.db.get(id)) as Doc<"bank_accounts"> | null;
      if (!created) {
        throw new Error("Failed to create international account");
      }
      international = created;
    }

    if (!local || !international) {
      throw new Error("Failed to ensure user accounts");
    }

    // Patch if needed (e.g. currency mismatch or missing fields)
    if (local.kind !== "local" || local.type !== "local" || !local.currency || !local.region) {
      await ctx.db.patch(local._id, { 
        kind: "local", 
        type: "local", 
        currency: local.currency ?? localConfig.currency,
        region: local.region ?? localConfig.region 
      });
    }

    if (international.kind !== "international" || international.type !== "international" || !international.currency || !international.region) {
      await ctx.db.patch(international._id, { 
        kind: "international", 
        type: "international", 
        currency: international.currency ?? internationalConfig.currency,
        region: international.region ?? internationalConfig.region
      });
    }

    return {
      localId: local._id as Id<"bank_accounts">,
      internationalId: international._id as Id<"bank_accounts">,
    };
  },
});

export const convertCurrency = mutation({
  args: {
    fromCurrency: v.string(),
    toCurrency: v.string(),
    amount: v.number(),
    finalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = identity.subject;

    const accounts = await ctx.db
      .query("bank_accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const fromAccount = accounts.find((a) => a.currency === args.fromCurrency);
    const toAccount = accounts.find((a) => a.currency === args.toCurrency);

    if (!fromAccount || !toAccount) {
      throw new Error("One or both accounts not found");
    }

    if (fromAccount.balance < args.amount) {
      throw new Error("Insufficient balance");
    }

    await ctx.db.patch(fromAccount._id, {
      balance: fromAccount.balance - args.amount,
    });

    await ctx.db.patch(toAccount._id, {
      balance: toAccount.balance + args.finalAmount,
    });

    return { success: true };
  },
});

export const getUserLocalCurrency = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("bank_accounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const local = accounts.find((a) => inferKindFromAccount(a) === "local");
    return local?.currency || "USD";
  },
});
