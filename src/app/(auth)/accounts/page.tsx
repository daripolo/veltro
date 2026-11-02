'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, type ComponentPropsWithoutRef, type ComponentType } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { CircleFlag } from 'react-circle-flags';
import { countries } from '@/data/countries';
import { currencies } from '@/data/currencies';
import { COUNTRIES } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import {
  CashOut,
  AddSquare,
  Bag3,
  Bus,
  Camera,
  Card,
  Dollar,
  FileText,
  Lightbulb,
  MenuDots,
  Mug,
  Refresh,
  TransferHorizontal,
} from '@solar-icons/react-perf/BoldDuotone';
import { cn } from '@/lib/utils';

type Region = keyof typeof COUNTRIES;

const REGIONS = COUNTRIES;

type SolarIconComponent = ComponentType<
  ComponentPropsWithoutRef<'svg'> & { size?: string | number; color?: string }
>;

const formatBalance = (amount: number, currency: string) => {
  if (currency === 'IDR') {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }
  const symbol = currencies.find((c) => c.code === currency)?.symbol || '$';
  return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function AccountsPage() {
  const ensureUserAccounts = useMutation(api.accounts.ensureUserAccounts);
  const identity = useQuery(api.user.user);
  const accounts = useQuery(api.accounts.getAccounts);
  const beneficiaries = useQuery(api.beneficiaries.getBeneficiaries);
  const user = useQuery(
    api.user.getUserByEmail,
    typeof identity?.email === 'string' ? { email: identity.email } : 'skip',
  );

  const router = useRouter()
  const userRegion = countries.find((country) => country.name == user?.country as string)?.code as string

  useEffect(() => {
    if (!identity) return;
    void ensureUserAccounts({ region: userRegion }).catch(() => { });
  }, [ensureUserAccounts, identity, userRegion]);

  // Logic to determine currencies based on user region
  const { local, international } = useMemo(() => {
    // Find the actual accounts from the query
    const localAccount = accounts?.find((acc) => acc.type === "local" || acc.kind === "local");
    const internationalAccount = accounts?.find((acc) => acc.type === "international" || acc.kind === "international");

    // Determine config based on the account's stored region, or fallback to userRegion/US
    const localRegionCode = localAccount?.region ?? userRegion;
    // For international, if no region is stored yet, we might fallback to US, or try to infer from currency if legacy
    // But since backend now sets region, we should trust it. Default to 'US' if missing.
    const internationalRegionCode = internationalAccount?.region ?? 'US';

    const localConfig = REGIONS[localRegionCode as Region] ?? REGIONS['US'];
    const internationalConfig = REGIONS[internationalRegionCode as Region] ?? REGIONS['US'];

    return {
      local: localConfig,
      international: internationalConfig
    };
  }, [userRegion, accounts]);

  const balances = useMemo(() => {
    const localAccount =
      accounts?.find((acc) => acc.type === "local" || acc.kind === "local") ?? accounts?.[0];
    const internationalAccount =
      accounts?.find((acc) => acc.type === "international" || acc.kind === "international") ??
      accounts?.[1];

    return {
      local: localAccount?.balance ?? 0,
      international: internationalAccount?.balance ?? 0,
    };
  }, [accounts]);

  const { localAccountId, internationalAccountId } = useMemo(() => {
    const localAccount = accounts?.find((acc) => acc.type === "local" || acc.kind === "local") ?? null;
    const internationalAccount =
      accounts?.find((acc) => acc.type === "international" || acc.kind === "international") ?? null;

    return {
      localAccountId: localAccount && "_id" in localAccount ? (localAccount._id ?? null) : null,
      internationalAccountId:
        internationalAccount && "_id" in internationalAccount ? (internationalAccount._id ?? null) : null,
    };
  }, [accounts]);

  const localTransactions = useQuery(
    api.transactions.getTransactionsByAccount,
    localAccountId ? { bankAccountId: localAccountId } : "skip",
  );

  const internationalTransactions = useQuery(
    api.transactions.getTransactionsByAccount,
    internationalAccountId ? { bankAccountId: internationalAccountId } : "skip",
  );

  const getCategoryIcon = (category: string): SolarIconComponent => {
    switch (category) {
      case "Shopping":
        return Bag3;
      case "Income":
        return Dollar;
      case "Entertainment":
        return Camera;
      case "Food":
        return Mug;
      case "Cash":
        return Card;
      case "Utilities":
        return Lightbulb;
      case "Transportation":
        return Bus;
      default:
        return TransferHorizontal;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Income":
        return "bg-green-500/10 text-green-600";
      case "Shopping":
        return "bg-amber-500/10 text-amber-600";
      case "Entertainment":
        return "bg-violet-500/10 text-violet-600";
      case "Food":
        return "bg-orange-500/10 text-orange-600";
      case "Utilities":
        return "bg-red-500/10 text-red-600";
      case "Transportation":
        return "bg-blue-500/10 text-blue-600";
      default:
        return "bg-slate-100 text-slate-500";
    }
  };

  const formatTransactionDate = (dateString: string) => {
    const parsed = Date.parse(dateString);
    if (!Number.isFinite(parsed)) return dateString;
    return new Date(parsed).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const recentTransactions = useMemo(() => {
    const accountCurrencyById = new Map();
    for (const acc of accounts ?? []) {
      if (!("_id" in acc) || !acc._id) continue;
      accountCurrencyById.set(
        acc._id,
        acc.currency ?? (acc.type === "international" ? "EUR" : "USD"),
      );
    }

    const combined = [...(localTransactions ?? []), ...(internationalTransactions ?? [])];
    combined.sort((a, b) => {
      const left = Date.parse(a.date);
      const right = Date.parse(b.date);
      const leftValue = Number.isFinite(left) ? left : 0;
      const rightValue = Number.isFinite(right) ? right : 0;
      return rightValue - leftValue;
    });

    return combined.slice(0, 4).map((tx) => ({
      id: tx._id,
      name: tx.description,
      date: formatTransactionDate(tx.date),
      amount: tx.amount,
      currency: accountCurrencyById.get(tx.bankAccountId) ?? "USD",
      Icon: getCategoryIcon(tx.category),
      color: getCategoryColor(tx.category),
    }));
  }, [accounts, internationalTransactions, localTransactions]);

  if (identity === undefined || accounts === undefined) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-40 rounded-lg bg-slate-200 mb-2" />
            <div className="h-4 w-72 rounded bg-slate-100" />
          </div>
          <div className="h-11 w-56 rounded-xl bg-slate-200" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between mb-8">
                <div className="w-16 h-16 rounded-full bg-slate-100" />
                <div className="w-10 h-10 rounded-full bg-slate-100" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-32 rounded bg-slate-100" />
                <div className="h-10 w-56 rounded bg-slate-200" />
                <div className="h-4 w-44 rounded bg-slate-100" />
              </div>
              <div className="mt-8 flex gap-3">
                <div className="h-12 flex-1 rounded-xl bg-slate-100" />
                <div className="h-12 flex-1 rounded-xl bg-slate-100" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <div className="h-7 w-36 rounded bg-slate-200" />
              <div className="h-5 w-20 rounded bg-slate-100" />
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100" />
                    <div>
                      <div className="h-4 w-40 rounded bg-slate-100 mb-2" />
                      <div className="h-3 w-28 rounded bg-slate-100" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 w-24 rounded bg-slate-100 mb-2" />
                    <div className="h-3 w-12 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <div className="p-6 rounded-3xl bg-slate-200">
              <div className="h-7 w-40 rounded bg-slate-100/70 mb-4" />
              <div className="h-4 w-64 rounded bg-slate-100/70 mb-8" />
              <div className="h-12 w-40 rounded-xl bg-white/60" />
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="h-5 w-28 rounded bg-slate-100 mb-4" />
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-full bg-slate-100" />
                    <div className="h-3 w-10 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1 leading-tight">Accounts</h1>
          <p className="text-slate-500 text-sm lg:text-base">Manage your local and international spending</p>
        </div>

        {/* Region Display */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Region:</span>
          <div className="text-slate-900 font-bold flex items-center gap-2 px-2">
            <CircleFlag countryCode={userRegion?.toLowerCase()} className='w-5 h-5' />
            <span>{REGIONS[userRegion as Region]?.name}</span>
          </div>
        </div>
      </motion.div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Local Account Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group relative p-6 rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden hover:border-primary/30 transition-all duration-500"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <span className="text-9xl grayscale font-black text-slate-900">{local?.flag}</span>
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-start justify-between mb-8">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                <CircleFlag countryCode={userRegion?.toLowerCase()} className='w-14 h-14' />
              </div>
              <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
                <MenuDots size={20} color="currentColor" className="text-slate-400" />
              </button>
            </div>

            <div>
              <p className="text-slate-400 font-medium mb-1">Local Account</p>
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
                {formatBalance(balances.local, local?.currency)}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-600 text-xs font-bold border border-green-500/20">
                  Active
                </span>
                <span className="text-sm text-slate-500">{local?.name}</span>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => router.push("/deposit")} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                <CashOut size={25} color="currentColor" /> Add Money
              </button>
              <button
                onClick={() => localAccountId && router.push(`/accounts/${localAccountId}`)}
                className="flex-1 py-3 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
              >
                Details
              </button>
            </div>
          </div>
        </motion.div>

        {/* International Account Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="group relative p-6 rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden hover:border-primary/30 transition-all duration-500"
        >
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <span className="text-9xl grayscale font-black text-slate-900">{international?.flag}</span>
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-start justify-between mb-8">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                <CircleFlag countryCode={international?.flag.toLowerCase()} className='w-14 h-14' />
              </div>
              <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
                <MenuDots size={20} color="currentColor" className="text-slate-400" />
              </button>
            </div>

            <div>
              <p className="text-slate-400 font-medium mb-1">International Account</p>
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
                {formatBalance(balances.international, international?.currency)}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 text-xs font-bold border border-blue-500/20">
                  Currency
                </span>
                <span className="text-sm text-slate-500">{international?.currency} • {international?.name}</span>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => router.push("/convert")} className="flex-1 py-3 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 flex items-center justify-center gap-2">
                <TransferHorizontal size={18} color="currentColor" /> Convert
              </button>
              <button
                onClick={() => internationalAccountId && router.push(`/accounts/${internationalAccountId}`)}
                className="flex-1 py-3 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
              >
                Details
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Actions & Transactions Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Transactions List */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Transactions</h3>
            <Link href="/transactions" className="text-primary text-sm font-bold hover:underline">View All</Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {localTransactions === undefined || internationalTransactions === undefined ? (
              <div className="p-8 text-center text-slate-400">
                <Refresh size={36} color="currentColor" className="text-3xl mb-3 block animate-spin" />
                <p className="text-sm">Loading transactions…</p>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FileText size={36} color="currentColor" className="text-3xl mb-3 block" />
                <p className="text-sm">No transactions yet.</p>
              </div>
            ) : recentTransactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className="flex items-center justify-between p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-xl", tx.color)}>
                    <tx.Icon size={20} color="currentColor" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{tx.name}</p>
                    <p className="text-sm text-slate-500">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-bold", tx.amount > 0 ? 'text-green-600' : 'text-slate-900')}>
                    {tx.amount > 0 ? '+' : ''}
                    {formatBalance(Math.abs(tx.amount), tx.currency)}
                  </p>
                  <p className="text-xs text-slate-500">{tx.currency}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Spend Anywhere */}
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-3xl bg-gradient-to-br from-primary to-orange-500 text-white relative overflow-hidden"
          >
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2">Spend anywhere</h3>
              <p className="text-white/80 font-medium mb-8 max-w-[80%]">Use your Veltro card abroad with the real exchange rate.</p>

              <button onClick={() => router.push("/cards")} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-lg">
                Get your card
              </button>
            </div>

            {/* Abstract Card Visual */}
            <div className="absolute -bottom-12 -right-12 w-48 h-32 bg-white/20 backdrop-blur-md rounded-2xl transform -rotate-12 border border-white/30" />
            <div className="absolute -bottom-8 -right-4 w-48 h-32 bg-black/80 backdrop-blur-md rounded-2xl transform -rotate-6 border border-white/10 flex items-end justify-end p-4">
              <Card size={48} color="currentColor" className="text-4xl text-white" />
            </div>
          </motion.div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Quick Send</h3>
            <div className="flex gap-2">
              {(beneficiaries || []).slice(0, 4).map((beneficiary) => (
                <button
                  key={beneficiary._id}
                  onClick={() => router.push("/transfers")}
                  className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
                >
                  <div className={cn("w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 font-bold group-hover:border-primary transition-all overflow-hidden")}>
                    {beneficiary.color ? (
                      <div className={cn("w-full h-full", beneficiary.color, "flex items-center justify-center")}>
                        {beneficiary.name[0]}
                      </div>
                    ) : (
                      beneficiary.name[0]
                    )}
                  </div>
                  <span className="text-xs text-slate-500 group-hover:text-slate-900 transition-colors truncate w-full text-center">{beneficiary.name.split(' ')[0]}</span>
                </button>
              ))}
              <button
                onClick={() => router.push("/transfers")}
                className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-primary group-hover:bg-slate-100 transition-all">
                  <AddSquare size={20} color="currentColor" className="text-xl" />
                </div>
                <span className="text-xs text-slate-500">Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}