'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

import { currencies } from '@/data/currencies';
import RiIcon from '@/components/ui/RiIcon';

export default function LoansPage() {
  const [loanAmount, setLoanAmount] = useState(10000);
  const [term, setTerm] = useState(12);
  const [interestRate, setInterestRate] = useState(5.5);
  const router = useRouter()
  const approveLoan = useMutation(api.loans.approveLoan);

  const loansQuery = useQuery(api.loans.getLoans);
  const accounts = useQuery(api.accounts.getAccounts);
  if (loansQuery === undefined || accounts === undefined) {
    return (
      <div className="w-full">
         
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            <div className="mb-8">
              <div className="h-9 w-56 rounded-lg bg-slate-100 mb-3" />
              <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="h-6 w-32 rounded bg-slate-100" />
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-2xl border border-slate-100 p-8">
                    <div className="flex justify-between items-start mb-6 gap-6">
                      <div className="min-w-0 flex-1">
                        <div className="h-6 w-48 max-w-full bg-slate-100 rounded mb-2" />
                        <div className="h-4 w-32 bg-slate-100 rounded" />
                      </div>
                      <div className="text-right shrink-0">
                        <div className="h-3 w-14 bg-slate-100 rounded mb-2 ml-auto" />
                        <div className="h-7 w-28 bg-slate-100 rounded ml-auto" />
                      </div>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full mb-6" />
                    <div className="h-12 w-full bg-slate-100 rounded-xl" />
                  </div>
                ))}
                <div className="h-12 w-full rounded-2xl bg-slate-100 border border-slate-100" />
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl border border-slate-100 p-8">
                <div className="h-6 w-40 rounded bg-slate-100 mb-6" />
                <div className="space-y-6">
                  <div>
                    <div className="h-4 w-32 rounded bg-slate-100 mb-3" />
                    <div className="h-14 w-full rounded-xl bg-slate-100" />
                    <div className="h-3 w-full rounded-full bg-slate-100 mt-4" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-14 w-full rounded-xl bg-slate-100" />
                    <div className="h-14 w-full rounded-xl bg-slate-100" />
                  </div>
                  <div className="h-40 w-full rounded-xl bg-slate-100" />
                  <div className="h-14 w-full rounded-xl bg-slate-100" />
                </div>
              </div>
            </div>
          </div>
       
      </div>
    );
  }

  const loans = loansQuery ?? [];
  const localAccount = accounts?.find((acc) => acc.type === "local" || acc.kind === "local") ?? accounts?.[0];
  const currencyCode = localAccount?.currency ?? 'USD';
  const currencySymbol = currencies.find(c => c.code === currencyCode)?.symbol ?? '$';

  const formatCurrency = (amount: number, currency: string = currencyCode) => {
    const symbol = currencies.find(c => c.code === currency)?.symbol ?? '$';
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const pendingLoans = loans.filter(l => l.status === 'pending').map(loan => ({
    id: loan._id,
    type: loan.purpose || 'Personal Loan',
    amount: loan.amount,
    date: new Date(loan.startDate).toLocaleDateString(),
    currency: loan.currency
  }));

  const activeLoans = loans.filter(l => l.status === 'active').map(loan => ({
    type: loan.purpose || 'Personal Loan',
    balance: loan.balance,
    original: loan.amount,
    nextPayment: new Date(loan.nextPaymentDate).toLocaleDateString(),
    amount: loan.monthlyPayment,
    rate: loan.rate,
    currency: loan.currency
  }));

  const calculateMonthlyPayment = () => {
    const r = interestRate / 100 / 12;
    const n = term;
    return (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  };

  const monthlyPayment = calculateMonthlyPayment();
  const totalPayment = monthlyPayment * term;
  const totalInterest = totalPayment - loanAmount;

  return (
    <div className="w-full">
       

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Loans & Credit</h1>
            <p className="text-slate-500">Manage your loans and calculate new opportunities.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Loans */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {pendingLoans.length > 0 && (
                <div className="space-y-6 mb-8">
                  <h2 className="text-xl font-bold text-slate-900">Pending Loans</h2>
                  {pendingLoans.map((loan) => (
                    <div key={loan.id} className="bg-white border border-slate-100 rounded-2xl border border-slate-100 p-8 relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{loan.type}</h3>
                          <p className="text-sm text-slate-500 mt-1">Date: {loan.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500 mb-1">Amount</p>
                          <p className="text-2xl font-bold text-slate-900">{formatCurrency(loan.amount, loan.currency)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await approveLoan({ loanId: loan.id });
                          } catch (err) {
                            console.error("Failed to approve loan:", err);
                            alert("Failed to approve loan. Please check console for details.");
                          }
                        }}
                        className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 font-bold rounded-xl transition-colors border border-amber-500/20 flex items-center justify-center gap-2"
                      >
                        <RiIcon className="ri-check-line" />
                        Approve (Admin Demo)
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <h2 className="text-xl font-bold text-slate-900">Active Loans</h2>
              {activeLoans.map((loan, index) => (
                <div key={index} className="bg-white border border-slate-100 rounded-2xl border border-slate-100 p-8 relative overflow-hidden group hover:border-primary/30 transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:opacity-10 transition-opacity" />

                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{loan.type}</h3>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        <RiIcon className="ri-percent-line text-primary" />
                        Rate: <span className="text-slate-900">{loan.rate}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500 mb-1">Remaining Balance</p>
                      <p className="text-2xl font-bold text-slate-900">{formatCurrency(loan.balance, loan.currency)}</p>
                    </div>
                  </div>

                  <div className="w-full bg-slate-50 rounded-full h-3 mb-6 border border-slate-100 p-0.5">
                    <div
                      className="bg-gradient-to-r from-primary to-orange-500 h-full rounded-full"
                      style={{ width: `${(1 - loan.balance / loan.original) * 100}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-sm p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 flex items-center gap-2">
                      <RiIcon className="ri-calendar-event-line" />
                      Next Payment: <span className="text-slate-900 font-medium">{loan.nextPayment}</span>
                    </span>
                    <span className="font-bold text-primary text-lg">{formatCurrency(loan.amount, loan.currency)}</span>
                  </div>
                </div>
              ))}

              <button
                onClick={() => router.push("/loans/apply")}
                className="w-full py-4 bg-white border border-slate-100 border border-dashed border-slate-200 rounded-2xl text-slate-500 hover:text-slate-900 hover:border-primary hover:bg-slate-50 transition-all cursor-pointer font-bold flex items-center justify-center gap-2">
                <RiIcon className="ri-add-circle-line text-xl" />
                Apply for a new loan
              </button>
            </motion.div>

            {/* Loan Calculator */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-slate-100 rounded-2xl border border-slate-100 p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <RiIcon className="ri-calculator-line text-primary" />
                Loan Calculator
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Loan Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">{currencySymbol}</span>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 pl-14 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none font-bold text-lg"
                    />
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full mt-4 accent-primary cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Term (Months)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={term}
                        onChange={(e) => setTerm(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-bold text-center"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">MO</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Interest Rate</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-bold text-center"
                        step="0.1"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">%</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-slate-500">Monthly Payment</span>
                    <span className="text-3xl font-bold text-primary">{formatCurrency(monthlyPayment)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Total Interest</span>
                    <span className="text-slate-900 font-medium">{formatCurrency(totalInterest)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Total Cost</span>
                    <span className="text-slate-900 font-medium">{formatCurrency(totalPayment)}</span>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/loans/apply")}
                  className="block w-full text-center py-4 bg-gradient-to-r from-primary to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                  Apply for this loan
                </button>
              </div>
            </motion.div>
          </div>
        </div>
     
    </div>
  );
}
