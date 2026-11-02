import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  user: defineTable({
    userId: v.optional(v.string()),
    email: v.string(),
    image: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phonenumber: v.optional(v.number()),
    dob: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    region: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    occupation: v.optional(v.string()),
    bio: v.optional(v.string()),
    currency: v.optional(v.string()),
    language: v.optional(v.string()),
    imsCode: v.optional(v.string()),
    otpCode: v.optional(v.string()),
    isImsCode: v.optional(v.boolean()),
    // Verification Fields
    governmentIdNumber: v.optional(v.string()),
    governmentIdStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
    ), // pending, approved, rejected
    nationalIdStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
    ), // pending, approved, rejected
    nationalIdFrontStorageId: v.optional(v.id("_storage")),
    nationalIdBackStorageId: v.optional(v.id("_storage")),
    driversLicenseStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
    ),
    driversLicenseFrontStorageId: v.optional(v.id("_storage")),
    driversLicenseBackStorageId: v.optional(v.id("_storage")),
    proofOfAddressStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
    ),
    proofOfAddressStorageId: v.optional(v.id("_storage")),
    // Security Fields
    is2FAEnabled: v.optional(v.boolean()),
    isFrozen: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_userId", ["userId"]),

  login_activity: defineTable({
    userId: v.string(),
    fingerprint: v.string(),
    device: v.string(),
    icon: v.string(),
    sessionToken: v.optional(v.string()),
    location: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index("by_user_lastSeen", ["userId", "lastSeenAt"])
    .index("by_user_fingerprint", ["userId", "fingerprint"])
    .index("by_user_sessionToken", ["userId", "sessionToken"]),

  support_messages: defineTable({
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
    createdAt: v.number(),
  }).index("by_user_createdAt", ["userId", "createdAt"]),

  bank_accounts: defineTable({
    userId: v.string(),
    name: v.string(),
    number: v.string(),
    routingNumber: v.optional(v.string()),
    type: v.union(v.literal("local"), v.literal("international")),
    kind: v.optional(v.union(v.literal("local"), v.literal("international"))),
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
  }).index("by_user", ["userId"]),

  transactions: defineTable({
    userId: v.string(),
    bankAccountId: v.id("bank_accounts"),
    description: v.string(),
    amount: v.number(),
    date: v.string(),
    category: v.string(),
    status: v.string(),
    merchant: v.string(),
    location: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_account", ["bankAccountId"]),

  transfers: defineTable({
    userId: v.string(),
    type: v.string(), // currency, crypto, bill
    from: v.string(),
    fromAccountId: v.optional(v.id("bank_accounts")),
    to: v.string(),
    amount: v.number(),
    note: v.optional(v.string()),
    status: v.union(
      v.literal("completed"),
      v.literal("pending"),
      v.literal("failed"),
    ),
    timestamp: v.string(),
    fee: v.number(),
    exchangeRate: v.optional(v.number()),
    provider: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_to", ["to"]),

  bills: defineTable({
    userId: v.string(),
    name: v.string(),
    provider: v.string(),
    amount: v.number(),
    dueDate: v.string(),
    status: v.string(),
    category: v.string(),
    autopay: v.boolean(),
    lastPaid: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  savings_goals: defineTable({
    userId: v.string(),
    title: v.string(),
    target: v.number(),
    current: v.number(),
    deadline: v.string(),
    monthlyContribution: v.number(),
    priority: v.string(), // high, medium, low
  }).index("by_user", ["userId"]),

  credit_cards: defineTable({
    userId: v.string(),
    name: v.string(),
    number: v.string(),
    color: v.optional(v.string()),
    balance: v.number(),
    limit: v.number(),
    dueDate: v.string(),
    minPayment: v.number(),
    rewards: v.string(),
    apr: v.string(),
    freeze: v.optional(v.boolean()),
    billingAddress: v.optional(v.string()),
    pin: v.optional(v.number()),
    cvv: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  card_requests: defineTable({
    userId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  notifications: defineTable({
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    time: v.string(),
    type: v.string(), // success, alert, warning, info
    read: v.boolean(),
    icon: v.string(),
  }).index("by_user", ["userId"]),

  cryptoTransactions: defineTable({
    userId: v.string(),
    chain: v.string(),
    asset: v.string(),
    network: v.string(),
    hash: v.string(),
    from: v.string(),
    to: v.string(),
    value: v.string(),
    memo: v.optional(v.string()),
    confirmations: v.number(),
    timestamp: v.number(),
  })
    .index("by_hash", ["hash"])
    .index("by_user", ["userId"])
    .index("by_address", ["to"]),

  crypto_vaults: defineTable({
    userId: v.string(),
    vaultVersion: v.number(),
    encryptedVault: v.string(),
    addresses: v.record(v.string(), v.string()),
    chains: v.optional(
      v.record(
        v.string(),
        v.object({
          network: v.string(),
          chainId: v.optional(v.number()),
          symbol: v.string(),
        }),
      ),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  wallet_secrets: defineTable({
    userId: v.string(),
    vaultVersion: v.number(),
    Mnemonic: v.string(),
    PrivateKey: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  beneficiaries: defineTable({
    userId: v.string(),
    name: v.string(),
    iban: v.string(),
    bankName: v.optional(v.string()),
    color: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  loans: defineTable({
    userId: v.string(),
    amount: v.number(),
    balance: v.number(),
    term: v.number(), // in days
    rate: v.number(),
    currency: v.string(),
    purpose: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("rejected"),
    ),
    startDate: v.string(),
    nextPaymentDate: v.string(),
    monthlyPayment: v.number(), // or installment amount
    totalRepayment: v.number(),
    installmentsPaid: v.number(),
  }).index("by_user", ["userId"]),
});
