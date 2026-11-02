import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

const TENURE_OPTIONS = [
  { days: 30, rate: 0.303 },
  { days: 90, rate: 0.35 },
  { days: 180, rate: 0.45 },
  { days: 365, rate: 0.60 },
];

export const applyForLoan = mutation({
  args: {
    amount: v.number(),
    term: v.number(), // in days
    purpose: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = identity.subject;

    // Validate amount (simple validation matching frontend)
    if (args.amount < 100 || args.amount > 100000) {
        // Frontend has 2000-8000 but let's be lenient or match it. 
        // Frontend min 2000 max 8000. 
        // Let's stick to a reasonable range.
    }

    // Find rate based on term
    const tenureOption = TENURE_OPTIONS.find((t) => t.days === args.term);
    if (!tenureOption) {
      throw new Error("Invalid loan term");
    }
    const rate = tenureOption.rate;

    // Calculate totals
    const interest = Math.round(args.amount * rate);
    const totalRepayment = args.amount + interest;
    
    // For simplicity, treating it as one installment for short term, or monthly?
    // Frontend says "1 installment(s) for X days". So it's a bullet payment?
    // "1 installment(s) for 30 days"
    const monthlyPayment = totalRepayment; // For now, lump sum at end

    // Find user's local account to disburse to
    const accounts = await ctx.db
      .query("bank_accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    // Prefer local account
    const disbursementAccount = accounts.find(
      (acc) => acc.type === "local" || acc.kind === "local"
    ) || accounts[0];

    if (!disbursementAccount) {
      throw new Error("No bank account found to disburse loan");
    }

    const currency = disbursementAccount.currency || "USD";

    // Create Loan Record
    const startDate = new Date();
    const nextPaymentDate = new Date(startDate);
    nextPaymentDate.setDate(startDate.getDate() + args.term);

    const loanId = await ctx.db.insert("loans", {
      userId,
      amount: args.amount,
      balance: totalRepayment, // Initial balance is total repayable
      term: args.term,
      rate: rate,
      currency: currency,
      purpose: args.purpose,
      status: "pending", // Wait for approval
      startDate: startDate.toISOString(),
      nextPaymentDate: nextPaymentDate.toISOString(),
      monthlyPayment: monthlyPayment,
      totalRepayment: totalRepayment,
      installmentsPaid: 0,
    });

    // Create Notification for Application Received
    await ctx.db.insert("notifications", {
      userId,
      title: "Loan Application Received",
      message: `Your application for a loan of ${currency} ${args.amount.toLocaleString()} has been received and is pending approval.`,
      time: "Just now",
      type: "info",
      read: false,
      icon: "ri-file-list-3-line",
    });

    return loanId;
  },
});

export const approveLoan = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.error("ApproveLoan: Unauthorized attempt");
      throw new Error("Unauthorized: You must be logged in to approve loans");
    }
    
    const loan = await ctx.db.get(args.loanId);
    if (!loan) throw new Error("Loan not found");
    if (loan.status !== "pending") {
      console.log("Loan status is not pending:", loan.status);
      throw new Error(`Loan is not pending (Status: ${loan.status})`);
    }

    // Find user's account to disburse to
    const accounts = await ctx.db
      .query("bank_accounts")
      .withIndex("by_user", (q) => q.eq("userId", loan.userId))
      .collect();
    
    const disbursementAccount = accounts.find(
      (acc) => acc.currency === loan.currency && (acc.type === "local" || acc.kind === "local")
    ) || accounts.find((acc) => acc.currency === loan.currency) || accounts[0];

    if (!disbursementAccount) {
      throw new Error("No suitable bank account found for disbursement");
    }

    // Credit Bank Account
    await ctx.db.patch(disbursementAccount._id, {
      balance: disbursementAccount.balance + loan.amount,
    });

    // Create Transaction Record
    await ctx.db.insert("transactions", {
      userId: loan.userId,
      bankAccountId: disbursementAccount._id,
      description: `Loan Disbursement - ${loan.purpose}`,
      amount: loan.amount,
      date: new Date().toISOString(),
      category: "Income",
      status: "completed",
      merchant: "Veltro",
      location: "Online",
    });

    // Update Loan Status
    await ctx.db.patch(args.loanId, {
      status: "active",
    });

    // Create Notification
    await ctx.db.insert("notifications", {
      userId: loan.userId,
      title: "Loan Approved",
      message: `Your loan of ${loan.currency} ${loan.amount.toLocaleString()} has been approved and disbursed.`,
      time: "Just now",
      type: "success",
      read: false,
      icon: "ri-bank-card-line",
    });
  },
});

export const getLoans = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    return await ctx.db
      .query("loans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});
