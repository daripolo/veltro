'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

import { currencies } from '@/data/currencies';
import RiIcon from '@/components/ui/RiIcon';

export default function LoanApplicationPage() {
  const router = useRouter();
  const [amount, setAmount] = useState(8000);
  const [tenure, setTenure] = useState(30);
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyForLoan = useMutation(api.loans.applyForLoan);
  const accounts = useQuery(api.accounts.getAccounts);
  if (accounts === undefined) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-125 bg-primary/5 blur-[120px] rounded-full pointer-events-none"
        />
       
        
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="min-h-full flex flex-col md:flex-row gap-8 md:gap-12 animate-pulse">
              <div className="flex-1 flex flex-col h-full min-h-0">
                <div className="mb-6 flex items-center gap-4 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100" />
                  <div className="flex-1">
                    <div className="h-7 w-44 bg-slate-100 rounded mb-2" />
                    <div className="h-4 w-64 max-w-full bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="h-28 w-full bg-slate-100 rounded-3xl" />
                  <div className="h-16 w-full bg-slate-100 rounded-2xl" />
                  <div className="h-56 w-full bg-slate-100 rounded-3xl" />
                  <div className="h-14 w-full bg-slate-100 rounded-xl" />
                </div>
              </div>
              <div className="w-full md:w-105 bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 h-fit">
                <div className="h-6 w-40 bg-slate-100 rounded mb-6" />
                <div className="space-y-4">
                  <div className="h-16 w-full bg-slate-100 rounded-2xl" />
                  <div className="h-16 w-full bg-slate-100 rounded-2xl" />
                  <div className="h-40 w-full bg-slate-100 rounded-2xl" />
                  <div className="h-14 w-full bg-slate-100 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        
       
      </div>
    );
  }
  const localAccount = accounts?.find((acc) => acc.type === "local" || acc.kind === "local") ?? accounts?.[0];

  // Get currency symbol from currencies.ts
  const currencyCode = localAccount?.currency || 'USD';
  const currencySymbol = currencies.find(c => c.code === currencyCode)?.symbol || '$';

  const handleApply = async () => {
    setError(null);
    if (!purpose) {
      setError("Please enter a purpose for the loan");
      return;
    }

    setIsSubmitting(true);
    try {
      await applyForLoan({
        amount,
        term: tenure,
        purpose,
      });
      router.push('/loans');
    } catch (error) {
      console.error("Loan application failed:", error);
      setError("Failed to apply for loan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const minAmount = 2000;
  const maxAmount = 8000;
  const step = 2000;

  const tenureOptions = [
    { days: 30, rate: 0.303, label: '30 Days', monthlyRate: '30.3% Monthly', tag: 'Special Offer' },
    { days: 90, rate: 0.35, label: '90 Days', monthlyRate: '11.6% Monthly', tag: 'Popular' },
    { days: 180, rate: 0.45, label: '180 Days', monthlyRate: '7.5% Monthly' },
    { days: 365, rate: 0.60, label: '365 Days', monthlyRate: '5% Monthly', tag: 'Best Value' },
  ];

  const handleAmountChange = (newAmount: number) => {
    if (newAmount >= minAmount && newAmount <= maxAmount) {
      setAmount(newAmount);
    }
  };

  const selectedTenure = tenureOptions.find(t => t.days === tenure) || tenureOptions[0];
  const interest = Math.round(amount * selectedTenure.rate);
  const totalDue = amount + interest;

  const repaymentDate = new Date();
  repaymentDate.setDate(repaymentDate.getDate() + tenure);
  const formattedRepaymentDate = repaymentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background Glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-125 bg-primary/5 blur-[120px] rounded-full pointer-events-none"
      />

     

      
          <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="min-h-full flex flex-col md:flex-row gap-8 md:gap-12">
            {/* Left Column: Inputs */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex-1 flex flex-col h-full min-h-0"
            >
              {/* Page Header */}
              <div className="mb-6 flex items-center gap-4 shrink-0">
                <Link href="/loans" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
                  <RiIcon className="ri-arrow-left-line text-xl" />
                </Link>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Get Funds</h1>
                  <p className="text-sm text-slate-500">Complete your application instantly</p>
                </div>
              </div>

              {/* Scrollable Inputs Area - Mobile: normal div, Desktop: ScrollArea */}
              <div className="flex-1 pr-0">
                {/* Choose Amount */}
                <div className="text-center mb-10 md:mb-12 w-full">
                  <h2 className="text-slate-500 font-medium mb-6 text-sm md:text-base">Choose Amount</h2>

                  <div className="flex items-center justify-center gap-2 md:gap-8 mb-8 w-full">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAmountChange(amount - step)}
                      disabled={amount <= minAmount}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-50 flex items-center justify-center text-primary hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
                    >
                      <RiIcon className="ri-subtract-line text-xl md:text-2xl" />
                    </motion.button>

                    <div className="bg-slate-50 px-3 md:px-8 py-4 rounded-2xl border border-slate-200 min-w-35 md:min-w-50 flex items-center justify-center">
                      <motion.span
                        key={amount}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="text-2xl md:text-4xl font-bold block"
                      >
                        {currencySymbol}{amount.toLocaleString()}
                      </motion.span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAmountChange(amount + step)}
                      disabled={amount >= maxAmount}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-50 flex items-center justify-center text-primary hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
                    >
                      <RiIcon className="ri-add-line text-xl md:text-2xl" />
                    </motion.button>
                  </div>

                  <div className="flex justify-center flex-wrap gap-2 md:gap-3 mb-8 md:mb-8 w-full">
                    {[4000, 6000, 8000].map((val) => (
                      <button
                        key={val}
                        onClick={() => setAmount(val)}
                        className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold border transition-all ${amount === val
                            ? 'bg-primary text-white border-primary'
                            : 'bg-transparent text-slate-500 border-slate-200 hover:border-primary/50'
                          }`}
                      >
                        {currencySymbol}{val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loan Purpose */}
                <div className="mb-8 md:mb-8">
                  <h2 className="text-slate-500 font-medium mb-3 text-sm md:text-base">Purpose for the loan</h2>
                  <div className="relative">
                    <RiIcon className="ri-file-text-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg" />
                    <input
                      type="text"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="e.g., Business, Medical, Education"
                      className="w-full bg-white border border-slate-100 border border-slate-200 rounded-xl px-4 py-4 pl-12 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-base"
                    />
                  </div>
                </div>

                {/* Choose Tenure */}
                <div className="mb-8 md:mb-0">
                  <h2 className="text-slate-500 font-medium mb-3 text-sm md:text-base">Choose A Loan Tenure</h2>
                  <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 pb-2 md:pb-0">
                    {tenureOptions.map((option) => (
                      <motion.div
                        key={option.days}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTenure(option.days)}
                        className={`relative p-4 rounded-2xl border cursor-pointer transition-all flex-1 ${tenure === option.days
                            ? 'bg-primary/10 border-primary'
                            : 'bg-white border border-slate-100 border-slate-100 hover:border-slate-200'
                          }`}
                      >
                        {option.tag && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg whitespace-nowrap">
                            <span className='flex mt-1'>{option.tag}</span>
                          </div>
                        )}
                        <div className="text-center mt-1">
                          <p className={`text-base font-bold ${tenure === option.days ? 'text-primary' : 'text-slate-900'}`}>{option.label}</p>
                          <p className="text-[10px] text-slate-500">{option.monthlyRate}</p>
                        </div>
                        {tenure === option.days && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -bottom-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white shadow-lg"
                          >
                            <RiIcon className="ri-check-line text-sm font-bold" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
                {/* Removed ScrollBar as it is handled by CSS/div now */}
              </div>
            </motion.div>

            {/* Right Column: Breakdown & Action (Desktop) / Bottom Section (Mobile) */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="flex-1 flex flex-col justify-center max-w-full md:max-w-md mx-auto w-full"
            >
              <div className="bg-white/90 backdrop-blur-sm border border-slate-100 rounded-3xl p-4 sm:p-6 shadow-2xl">
                {/* Breakdown */}
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 border-dashed">
                    <span className="text-slate-500 text-sm">Tenure</span>
                    <span className="text-slate-900 font-medium text-sm">1 installment(s) for {tenure} days</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 border-dashed">
                    <span className="text-slate-500 text-sm">Received Amount</span>
                    <span className="text-slate-900 font-medium text-sm">{currencySymbol}{amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 border-dashed">
                    <span className="text-slate-500 text-sm">Interest</span>
                    <span className="text-slate-900 font-medium text-sm">{currencySymbol}{interest.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 border-dashed">
                    <span className="text-slate-500 text-sm">Total Amount Due</span>
                    <motion.span
                      key={totalDue}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      className="text-slate-900"
                    >
                      {currencySymbol}{totalDue.toLocaleString()}
                    </motion.span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500 text-sm">Disbursement Account</span>
                    <span className="text-slate-900 font-medium text-sm flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                      Local Account <RiIcon className="ri-arrow-right-s-line" />
                    </span>
                  </div>
                </div>

                {/* Repayment Schedule */}
                <div className="bg-slate-100 rounded-xl p-3 sm:p-4 border border-slate-100 flex items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Repayment Date</p>
                    <p className="text-slate-900">{formattedRepaymentDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-900">{currencySymbol}{totalDue.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">To be paid</p>
                  </div>
                </div>

                {/* Action Button */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
                  >
                    <RiIcon className="ri-error-warning-line text-lg shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApply}
                  disabled={isSubmitting}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-primary to-orange-700 text-white font-bold text-base sm:text-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RiIcon className="ri-loader-4-line animate-spin text-xl" />
                      Processing...
                    </>
                  ) : (
                    "Take This Loan"
                  )}
                </motion.button>

                <p className="text-center text-[10px] text-slate-500 mt-4">
                  Note: Overdue payments may incur penalty fees. <span className="text-primary cursor-pointer hover:underline">Click to know more</span>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      
     
    </div>
  );
}
