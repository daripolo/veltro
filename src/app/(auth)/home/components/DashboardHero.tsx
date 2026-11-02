"use client"
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Eye, EyeClosed } from '@solar-icons/react-perf/Linear';
import RiIcon from '@/components/ui/RiIcon';
import { CircleFlag, countries } from 'react-circle-flags';
import type { ReactNode } from 'react';
import { currencies } from '@/src/data/currencies';

function AccountFlag({ countryCode, fallback, className = '' }: { countryCode?: string; fallback: ReactNode; className?: string }) {
  const code = (countryCode || '').toLowerCase();
  if (code && countries[code]) {
    return <CircleFlag countryCode={code} height="28" className={`rounded-full object-cover ${className}`} />;
  }
  return <>{fallback}</>;
}

export default function DashboardHero() {
  const [showBalances, setShowBalances] = useState(true);
  const ensureUserAccounts = useMutation(api.accounts.ensureUserAccounts);
  const ensureDefaultCard = useMutation(api.creditCards.ensureDefaultCard);
  const identity = useQuery(api.user.user);
  const accounts = useQuery(api.accounts.getAccounts);

  useEffect(() => {
    if (!identity) return;
    void ensureUserAccounts({}).catch(() => {});
    void ensureDefaultCard().catch(() => {});
  }, [ensureDefaultCard, ensureUserAccounts, identity]);

  const displayAccounts = useMemo(() => (accounts ?? []).filter((acc) => acc.number), [accounts]);

  const formatBalance = (amount: number, currency: string) => {
    if (currency === 'IDR') {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    }
    const symbol = currencies.find((c) => c.code === currency)?.symbol || '$';
    return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getCardSuffix = (number: string) => number.slice(-4) || '••••';

  const getAccountLabel = (acc: { type?: string; kind?: string | null }) => {
    if (acc.kind === 'international' || acc.type === 'international') return 'International Account';
    if (acc.kind === 'local' || acc.type === 'local') return 'Local Account';
    return 'Account';
  };

  return (
    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:snap-none md:pb-0">
      {displayAccounts.map((acc, index) => {
        const currencyCode = acc.currency || 'USD';
        const currency = currencies.find((c) => c.code === currencyCode);
        const isPrimary = index === 0;

        return (
          <motion.div
            key={'_id' in acc && acc._id ? acc._id : `${acc.type}-${acc.number}`}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden min-w-[86%] snap-center sm:min-w-[70%] md:min-w-0 bg-white rounded-[1.75rem] p-6 sm:p-7 shadow-[0_8px_30px_rgba(2,6,23,0.06)] border border-slate-100"
          >
            <div className="relative flex justify-between items-start gap-3 mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 ring-4 ring-primary/10 flex items-center justify-center overflow-hidden">
                  <AccountFlag
                    countryCode={currency?.countryCode}
                    className="h-7 w-7"
                    fallback={<span className="text-lg font-extrabold text-primary">{currency?.flag || currencyCode.slice(0, 2)}</span>}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold text-slate-900 truncate">{currency?.name || currencyCode}</h3>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-[0.14em]">
                    {isPrimary ? 'Main Account' : getAccountLabel(acc)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-extrabold text-primary tracking-wider">
                  <AccountFlag
                    countryCode={currency?.countryCode}
                    className="h-4 w-4"
                    fallback={<span>{currency?.flag || ''}</span>}
                  />
                  {currencyCode}
                  <RiIcon className="ri-arrow-down-s-line text-sm" />
                </span>
                <button
                  onClick={() => setShowBalances((prev) => !prev)}
                  className="text-slate-300 hover:text-slate-500 transition-colors"
                  aria-label={showBalances ? 'Hide balances' : 'Show balances'}
                >
                  {showBalances ? <EyeClosed className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="relative space-y-6">
              <div>
                <p className="text-sm text-slate-400 font-medium mb-1">Your balance</p>
                <h2 className="text-5xl sm:text-6xl font-extrabold tracking-tighter text-slate-900">
                  {showBalances ? formatBalance(acc.balance ?? 0, currencyCode) : '••••••'}
                </h2>
              </div>

              <div className="flex items-stretch">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <RiIcon className="ri-bank-card-line text-lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.14em]">Account number</p>
                    <p className="text-sm font-bold text-slate-900 truncate">•••• {getCardSuffix(acc.number)}</p>
                  </div>
                </div>
                {acc.interestRate && (
                  <>
                    <div className="w-px bg-slate-100 mx-4 sm:mx-5 shrink-0" />
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <RiIcon className="ri-percent-line text-lg" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.14em]">Interest rate</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{acc.interestRate}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}

      {displayAccounts.length === 0 && (
        <div className="w-full bg-white rounded-[1.75rem] p-8 shadow-[0_8px_30px_rgba(2,6,23,0.06)] border border-slate-100 text-center text-sm text-slate-400">
          Loading your accounts...
        </div>
      )}
    </div>
  );
}
