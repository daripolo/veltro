"use client"
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import Dialog from '@/components/ui/Dialog';
import { api } from '@/convex/_generated/api';
import { motion } from 'framer-motion';
import type { Id } from '@/convex/_generated/dataModel';
import { currencies } from '@/src/data/currencies';
import RiIcon from '@/components/ui/RiIcon';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: Id<"savings_goals"> | null;
  goalTitle: string;
}

export default function AddFundsModal({ isOpen, onClose, goalId, goalTitle }: AddFundsModalProps) {
  const accounts = useQuery(api.accounts.getAccounts);
  const addFunds = useMutation(api.savingsGoals.addFundsToGoal);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const displayCurrency =
    accounts?.find((a) => a.type === 'local' || a.kind === 'local')?.currency || 'USD';
  const currencySymbol = currencies.find((c) => c.code === displayCurrency)?.symbol || '$';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalId || !amount) return;

    setIsLoading(true);
    try {
      await addFunds({
        goalId,
        amount: Number(amount),
      });
      onClose();
      setAmount('');
    } catch (error) {
      console.error('Failed to add funds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Funds"
      description={`Add money to your "${goalTitle}" goal.`}
      type="success"
      maxWidth="max-w-sm"
    >
      <motion.form
        animate="visible"
        onSubmit={handleSubmit}
        className="space-y-6 mt-4"
      >
        <motion.div variants={itemVariants} className="space-y-2">
          <label className="text-xs font-bold text-orange-600 uppercase tracking-wider ml-1">Amount</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <span className="text-slate-400 group-focus-within:text-orange-500 transition-colors font-mono text-lg">
                {currencySymbol}
              </span>
            </div>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-10 pr-4 text-2xl font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
              placeholder="0.00"
              autoFocus
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !amount}
            className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isLoading ? (
              <>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <RiIcon className="ri-loader-4-line animate-spin text-lg" />
                </span>
                <span className="leading-none">Adding...</span>
              </>
            ) : (
              <>
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <RiIcon className="ri-wallet-line text-lg" />
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-orange-500 shadow-sm">
                    <RiIcon className="ri-add-line text-[10px]" />
                  </span>
                </span>
                <span className="leading-none">Add Funds</span>
              </>
            )}
          </button>
        </motion.div>
      </motion.form>
    </Dialog>
  );
}