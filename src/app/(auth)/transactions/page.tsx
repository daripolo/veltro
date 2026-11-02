'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { ScrollArea, ScrollBar } from '@/src/components/ui/scroll-area';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

import { currencies } from '@/data/currencies';
import RiIcon from '@/components/ui/RiIcon';

export default function TransactionsPage() {
  const ensureUserAccounts = useMutation(api.accounts.ensureUserAccounts);
  const identity = useQuery(api.user.user);
  const accounts = useQuery(api.accounts.getAccounts);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    if (!identity) return;
    void ensureUserAccounts({}).catch(() => { });
  }, [ensureUserAccounts, identity]);

  const localAccount = accounts?.find((acc) => acc.type === 'local' || acc.kind === 'local');
  const currencySymbol = currencies.find((c: { code: string }) => c.code === (localAccount?.currency || 'USD'))?.symbol || '$';

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Shopping': return 'ri-shopping-bag-line';
      case 'Income': return 'ri-money-dollar-circle-line';
      case 'Entertainment': return 'ri-movie-line';
      case 'Food': return 'ri-restaurant-line';
      case 'Cash': return 'ri-bank-card-line';
      case 'Utilities': return 'ri-lightbulb-line';
      case 'Transportation': return 'ri-car-line';
      default: return 'ri-exchange-line';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Income': return 'bg-primary/10 text-primary';
      case 'Shopping': return 'bg-primary/10 text-primary';
      case 'Entertainment': return 'bg-slate-100 text-slate-900';
      case 'Food': return 'bg-primary/5 text-primary';
      case 'Utilities': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const { localAccountId, internationalAccountId } = useMemo(() => {
    const localAccount = accounts?.find((acc) => acc.type === 'local' || acc.kind === 'local') ?? null;
    const internationalAccount =
      accounts?.find((acc) => acc.type === 'international' || acc.kind === 'international') ?? null;

    return {
      localAccountId: localAccount && '_id' in localAccount ? (localAccount._id ?? null) : null,
      internationalAccountId:
        internationalAccount && '_id' in internationalAccount ? (internationalAccount._id ?? null) : null,
    };
  }, [accounts]);

  const localTransactions = useQuery(
    api.transactions.getTransactionsByAccount,
    localAccountId ? { bankAccountId: localAccountId } : 'skip',
  );

  const internationalTransactions = useQuery(
    api.transactions.getTransactionsByAccount,
    internationalAccountId ? { bankAccountId: internationalAccountId } : 'skip',
  );

  const accountCurrencyById = useMemo(() => {
    const map = new Map<string, string>();
    if (accounts) {
      for (const acc of accounts) {
        if (acc && '_id' in acc && acc._id && acc.currency) {
          map.set(acc._id, acc.currency);
        }
      }
    }
    return map;
  }, [accounts]);

  const allTransactions = useMemo(() => {
    const combined = [...(localTransactions ?? []), ...(internationalTransactions ?? [])];
    combined.sort((a, b) => {
      const left = Date.parse(a.date);
      const right = Date.parse(b.date);
      const leftValue = Number.isFinite(left) ? left : 0;
      const rightValue = Number.isFinite(right) ? right : 0;
      return rightValue - leftValue;
    });
    return combined;
  }, [internationalTransactions, localTransactions]);

  const filteredTransactions = useMemo(() => {
    const list = allTransactions.filter((transaction) => {
      const matchesFilter = filter === 'all' || transaction.category.toLowerCase() === filter.toLowerCase();
      const matchesSearch =
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.merchant.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    if (sortBy === 'date') return list;
    return list;
  }, [allTransactions, filter, searchTerm, sortBy]);

  const categories = ['all', 'Income', 'Shopping', 'Food', 'Entertainment', 'Utilities', 'Transportation'];

  return (
    <div className="w-full">



        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Transactions</h1>
            <p className="text-slate-500">View and manage your transaction history</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="relative">
              <RiIcon className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-white border border-slate-100 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
            <button className="px-4 py-2.5 bg-white border border-slate-100 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              <RiIcon className="ri-download-line" />
              <span>Export CSV</span>
            </button>
          </motion.div>
        </div>

        {/* Filters */}
        <ScrollArea className="mb-8 pb-2 whitespace-nowrap">
          <div className="flex space-x-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all whitespace-nowrap ${filter === category
                    ? 'bg-primary text-black'
                    : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-100'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Transactions List */}
        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          {accounts === undefined || localTransactions === undefined || internationalTransactions === undefined ? (
            <div className="p-6 animate-pulse">
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-slate-100 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="h-4 w-52 max-w-full bg-slate-100 rounded mb-2" />
                        <div className="h-3 w-72 max-w-full bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="h-4 w-24 bg-slate-100 rounded" />
                      <div className="h-5 w-18 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <RiIcon className="ri-file-search-line text-4xl mb-4 block" />
              <p>No transactions found matching your criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getCategoryColor(transaction.category)}`}>
                      <RiIcon className={`${getCategoryIcon(transaction.category)} text-lg`} />
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-900 group-hover:text-primary transition-colors">{transaction.description}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>{transaction.merchant}</span>
                        <span>•</span>
                        <span>{transaction.location}</span>
                        <span>•</span>
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`font-mono font-medium ${transaction.amount > 0 ? 'text-green-500' : 'text-slate-900'}`}>
                      {transaction.amount > 0 ? '+' : ''}
                      {currencies.find(c => c.code === (accountCurrencyById.get(transaction.bankAccountId) || 'USD'))?.symbol || '$'}
                      {Math.abs(transaction.amount).toFixed(2)}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${transaction.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                        transaction.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-red-500/10 text-red-500'
                      }`}>
                      {transaction.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
