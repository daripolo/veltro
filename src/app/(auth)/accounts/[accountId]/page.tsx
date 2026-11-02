'use client';

import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { CircleFlag } from 'react-circle-flags';
import type { Id } from '@convex/_generated/dataModel';
import { useState } from 'react';
import { currencies } from '@/data/currencies';
import { cn } from '@/lib/utils';
import RiIcon from '@/components/ui/RiIcon';

const formatBalance = (amount: number, currency: string) => {
  if (currency === 'IDR') {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }
  const symbol = currencies.find((c) => c.code === currency)?.symbol || '$';
  return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

function AccountCardMock({ number, holder, expiry, index }: { number: string; holder: string; expiry: string; index: number }) {
  return (
    <div
      className={cn(
        'min-w-[300px] h-[180px] rounded-2xl p-5 text-white relative overflow-hidden shadow-lg',
        index % 2 === 0
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
          : 'bg-gradient-to-br from-primary to-orange-500',
      )}
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="flex justify-between items-start relative">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-primary font-black text-xs">F</div>
          <span className="text-xs font-black uppercase tracking-widest">Veltro</span>
        </div>
        <RiIcon className="ri-wifi-line text-white/60 rotate-90 text-sm" />
      </div>
      <p className="mt-8 text-sm tracking-[0.2em] text-white/90 font-medium">{number}</p>
      <div className="mt-4 flex justify-between items-end relative">
        <div>
          <p className="text-[9px] text-white/50 uppercase tracking-wider mb-1">Card Holder</p>
          <p className="text-xs font-bold text-white">{holder}</p>
        </div>
        <div>
          <p className="text-[9px] text-white/50 uppercase tracking-wider mb-1">Expires</p>
          <p className="text-xs font-bold text-white">{expiry}</p>
        </div>
      </div>
    </div>
  );
}

export default function AccountDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.accountId as Id<"bank_accounts">;
  const [activeTab, setActiveTab] = useState<'transactions' | 'details' | 'pending'>('details');

  const account = useQuery(api.accounts.getAccount, { accountId });
  const allAccounts = useQuery(api.accounts.getAccounts);
  const transactions = useQuery(api.transactions.getTransactionsByAccount, { bankAccountId: accountId });
  const creditCards = useQuery(api.creditCards.getCreditCards);

  if (account === undefined || allAccounts === undefined) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 animate-pulse">
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <div className="h-7 w-40 rounded-lg bg-slate-200 mb-6" />
            <div className="flex gap-2 mb-6">
              <div className="h-9 flex-1 rounded-lg bg-slate-100" />
              <div className="h-9 flex-1 rounded-lg bg-slate-100" />
            </div>
            <div className="h-10 rounded-xl bg-slate-100" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100" />
                  <div>
                    <div className="h-4 w-28 rounded bg-slate-100 mb-2" />
                    <div className="h-3 w-20 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="h-6 w-6 rounded bg-slate-100" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-slate-100" />
                <div className="h-5 w-32 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-slate-100 lg:hidden" />
            <div className="h-8 w-56 rounded-lg bg-slate-200" />
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex gap-8">
              <div className="h-4 w-24 rounded bg-slate-100" />
              <div className="h-4 w-16 rounded bg-slate-100" />
              <div className="h-4 w-20 rounded bg-slate-100" />
            </div>
            <div className="h-8 w-44 rounded bg-slate-100" />
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-24 rounded bg-slate-100 mb-2" />
                  <div className="h-6 w-40 rounded bg-slate-200" />
                </div>
              ))}
            </div>
            <div>
              <div className="h-6 w-56 rounded bg-slate-200 mb-6" />
              <div className="flex gap-6 overflow-x-auto pb-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="min-w-[300px] h-[180px] rounded-2xl bg-slate-100" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (account === null) {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center justify-center p-16">
        <div className="text-center">
          <RiIcon className="ri-error-warning-line text-4xl text-red-500 mb-4 mx-auto" />
          <p className="font-bold text-slate-900 mb-1">Account not found</p>
          <p className="text-sm text-slate-500 mb-4">This account does not exist or you don't have access.</p>
          <button
            onClick={() => router.push('/accounts')}
            className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-bold text-sm"
          >
            Back to Accounts
          </button>
        </div>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Shopping": return "ri-shopping-bag-line";
      case "Income": return "ri-money-dollar-circle-line";
      case "Entertainment": return "ri-movie-line";
      case "Food": return "ri-restaurant-line";
      case "Cash": return "ri-bank-card-line";
      case "Utilities": return "ri-lightbulb-line";
      case "Transportation": return "ri-car-line";
      default: return "ri-exchange-line";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Income": return "bg-green-500/10 text-green-600";
      case "Shopping": return "bg-amber-500/10 text-amber-600";
      case "Entertainment": return "bg-violet-500/10 text-violet-600";
      case "Food": return "bg-orange-500/10 text-orange-600";
      case "Utilities": return "bg-red-500/10 text-red-600";
      case "Transportation": return "bg-blue-500/10 text-blue-600";
      default: return "bg-slate-100 text-slate-500";
    }
  };

  const formatTransactionDate = (dateString: string) => {
    const parsed = Date.parse(dateString);
    if (!Number.isFinite(parsed)) return dateString;
    return new Date(parsed).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const accountCurrency = account.currency ?? 'USD';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      {/* Left Sidebar - Account List */}
      <div className="space-y-4">
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Your Accounts</h2>

          <div className="flex gap-2 mb-4">
            <button className="flex-1 py-2 bg-primary text-white font-bold rounded-lg text-sm">Balance</button>
            <button className="flex-1 py-2 bg-slate-50 text-slate-500 hover:text-slate-900 font-bold rounded-lg text-sm border border-slate-100 transition-colors">
              Transaction status
            </button>
          </div>

          <div className="relative">
            <RiIcon className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-primary/50 transition-colors"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <RiIcon className="ri-filter-3-line" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {allAccounts.map((acc) => {
            if (!('_id' in acc) || !acc._id) return null;
            return (
              <div
                key={acc._id}
                onClick={() => acc._id && router.push(`/accounts/${acc._id}`)}
                className={cn(
                  "p-5 rounded-2xl border transition-all cursor-pointer group bg-white shadow-sm",
                  acc._id === accountId
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-primary">
                      <RiIcon className="ri-wallet-3-line text-lg" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-primary transition-colors">{acc.name}</h3>
                      <p className="text-xs text-slate-400">{acc.number}</p>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-700">
                    <RiIcon className="ri-more-2-fill" />
                  </button>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Available Balance</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-slate-900">
                      {formatBalance(acc.balance, acc.currency ?? 'USD')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content - Account Details */}
      <div className="min-w-0 rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        {/* Main Header */}
        <div className="p-6 md:p-8 pb-0">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/accounts')}
              className="lg:hidden w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
            >
              <RiIcon className="ri-arrow-left-line text-slate-600" />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{account.name}</h1>
            <div className="hidden md:flex items-center gap-2 ml-auto">
              {account.region && (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700">
                  <CircleFlag countryCode={account.region.toLowerCase()} className='w-4 h-4' />
                  {account.region}
                </span>
              )}
              <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-bold">
                {accountCurrency}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100">
            <div className="flex gap-6 md:gap-8">
              <button
                onClick={() => setActiveTab('transactions')}
                className={cn(
                  "pb-4 font-bold text-sm transition-colors relative",
                  activeTab === 'transactions' ? "text-primary" : "text-slate-400 hover:text-slate-900"
                )}
              >
                Transactions
                {activeTab === 'transactions' && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={cn(
                  "pb-4 font-bold text-sm transition-colors relative",
                  activeTab === 'details' ? "text-primary" : "text-slate-400 hover:text-slate-900"
                )}
              >
                Details
                {activeTab === 'details' && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={cn(
                  "pb-4 font-bold text-sm transition-colors relative",
                  activeTab === 'pending' ? "text-primary" : "text-slate-400 hover:text-slate-900"
                )}
              >
                Pending
                {activeTab === 'pending' && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>

            <div className="hidden md:flex items-center gap-4 pb-2">
              <div className="relative">
                <RiIcon className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search"
                  className="bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden pl-8 w-40"
                />
              </div>
              <div className="h-4 w-px bg-slate-100"></div>
              <button className="flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm font-medium">
                <RiIcon className="ri-filter-3-line" />
                Filter
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'details' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Account number</p>
                  <p className="text-slate-900 font-medium text-lg">{account.number}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Account name</p>
                  <p className="text-slate-900 font-medium text-lg">{account.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Account product</p>
                  <p className="text-slate-900 font-medium text-lg">{account.type === 'local' ? 'Standard Checking' : 'Global Savings'}</p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm mb-1">Region</p>
                  <div className="flex items-center gap-2">
                    {account.region && (
                      <CircleFlag countryCode={account.region.toLowerCase()} className='w-5 h-5' />
                    )}
                    <p className="text-slate-900 font-medium text-lg">{account.region ?? 'Global'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Currency</p>
                  <p className="text-slate-900 font-medium text-lg">{accountCurrency}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Branch</p>
                  <p className="text-slate-900 font-medium text-lg">Main Branch (001)</p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm mb-1">Credit interest rate</p>
                  <p className="text-slate-900 font-medium text-lg">{account.interestRate}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Debit interest rate</p>
                  <p className="text-slate-900 font-medium text-lg">7.1648%</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Overdraft limit</p>
                  <p className="text-slate-900 font-medium text-lg">
                    {typeof account.availableCredit === 'number'
                      ? formatBalance(account.availableCredit, accountCurrency)
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Associated Cards */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6">Associated Cards</h3>
                <div className="flex gap-6 overflow-x-auto pb-4">
                  {creditCards === undefined
                    ? Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="min-w-[300px] h-[180px] rounded-2xl bg-slate-100 animate-pulse" />
                    ))
                    : creditCards.map((card, i) => (
                      <AccountCardMock
                        key={card._id}
                        number={card.number}
                        holder={card.name}
                        expiry={card.dueDate}
                        index={i}
                      />
                    ))}

                  {/* Add New Card Placeholder */}
                  <button onClick={() => router.push("/cards")} className="min-w-[220px] h-[180px] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <RiIcon className="ri-add-line text-xl" />
                    </div>
                    <span className="text-sm text-slate-400 group-hover:text-slate-900">Add Card</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              {transactions === undefined ? (
                <div className="divide-y divide-slate-50 animate-pulse">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100" />
                        <div>
                          <div className="h-4 w-48 rounded bg-slate-100 mb-2" />
                          <div className="h-3 w-28 rounded bg-slate-100" />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 w-24 rounded bg-slate-100 mb-2" />
                        <div className="h-3 w-16 rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <RiIcon className="ri-file-list-3-line text-3xl text-slate-300" />
                  </div>
                  <p className="text-lg font-bold text-slate-900 mb-1">No transactions yet</p>
                  <p className="text-sm text-slate-400">Transactions specific to this account will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {transactions.map((tx, i) => (
                    <motion.div
                      key={tx._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors cursor-pointer group rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-xl", getCategoryColor(tx.category))}>
                          <RiIcon className={getCategoryIcon(tx.category)} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{tx.description}</p>
                          <p className="text-sm text-slate-500">{formatTransactionDate(tx.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-bold", tx.amount > 0 ? 'text-green-600' : 'text-slate-900')}>
                          {tx.amount > 0 ? '+' : ''}
                          {formatBalance(Math.abs(tx.amount), accountCurrency)}
                        </p>
                        <p className="text-xs text-slate-400">{tx.category}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-slate-400"
            >
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                <RiIcon className="ri-time-line text-4xl text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Pending Transactions</h3>
              <p className="text-sm max-w-xs text-center">There are no pending transactions for this account at the moment.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}