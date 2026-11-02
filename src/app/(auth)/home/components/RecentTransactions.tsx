"use client"
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'convex/react';
import Link from 'next/link';
import {
  ArrowRightDownBold,
  ArrowRightUpBold
} from '@solar-icons/react-perf';
import { api } from '@/convex/_generated/api';
import { currencies } from '@/src/data/currencies';

export default function RecentTransactions() {
  const accounts = useQuery(api.accounts.getAccounts);

  const { localAccountId, internationalAccountId } = useMemo(() => {
    const localAccount = accounts?.find((acc) => acc.type === 'local' || acc.kind === 'local');
    const internationalAccount = accounts?.find((acc) => acc.type === 'international' || acc.kind === 'international');
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
        if ('_id' in acc && acc._id && acc.currency) map.set(acc._id, acc.currency);
      }
    }
    return map;
  }, [accounts]);

  const isLoading =
    accounts === undefined ||
    (localAccountId && localTransactions === undefined) ||
    (internationalAccountId && internationalTransactions === undefined);

  const recentTransactions = useMemo(() => {
    const combined = [...(localTransactions ?? []), ...(internationalTransactions ?? [])];
    combined.sort((a, b) => {
      const left = Date.parse(a.date);
      const right = Date.parse(b.date);
      return (Number.isFinite(right) ? right : 0) - (Number.isFinite(left) ? left : 0);
    });
    return combined.slice(0, 8);
  }, [internationalTransactions, localTransactions]);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
        <Link
          href="/transactions"
          className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
        Latest Activity
      </div>

      <div className="space-y-4">
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100" />
                  <div className="space-y-2">
                    <div className="h-3 w-32 bg-slate-100 rounded" />
                    <div className="h-2.5 w-20 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {!isLoading &&
          recentTransactions.map((tx, index) => {
            const isOutgoing = tx.amount < 0;
            const absAmount = Math.abs(tx.amount);
            const currencyCode = accountCurrencyById.get(tx.bankAccountId) || 'USD';
            const symbol = currencies.find((c) => c.code === currencyCode)?.symbol || '$';

            return (
              <motion.div
                key={tx._id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isOutgoing ? 'bg-red-50' : 'bg-green-50'}`}>
                    {isOutgoing ? (
                      <ArrowRightUpBold className="w-5 h-5 text-red-500" />
                    ) : (
                      <ArrowRightDownBold className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-sm font-bold text-slate-900 leading-none truncate">{tx.description}</div>
                    <div className="text-xs text-slate-400 font-medium">
                      {new Date(tx.date).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-bold leading-none shrink-0 ${isOutgoing ? 'text-red-500' : 'text-green-600'}`}>
                  {isOutgoing ? '-' : '+'}{symbol} {absAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </motion.div>
            );
          })}

        {!isLoading && recentTransactions.length === 0 && (
          <div className="py-10 text-center text-slate-400 text-xs font-medium">
            No transactions yet. Your activity will appear here.
          </div>
        )}
      </div>
    </div>
  );
}