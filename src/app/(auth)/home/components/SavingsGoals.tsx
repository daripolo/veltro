"use client"
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { motion } from 'framer-motion';
import Card from '@/components/base/Card';
import { api } from '@/convex/_generated/api';
import CreateSavingsGoalModal from './CreateSavingsGoalModal';
import AddFundsModal from './AddFundsModal';
import type { Id } from '@/convex/_generated/dataModel';
import { currencies } from '@/src/data/currencies';
import RiIcon from '@/components/ui/RiIcon';

export default function SavingsGoals() {
  const savingsGoals = useQuery(api.savingsGoals.getSavingsGoals);
  const accounts = useQuery(api.accounts.getAccounts);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [addFundsGoal, setAddFundsGoal] = useState<{ id: Id<"savings_goals">; title: string } | null>(null);

  const displayCurrency =
    accounts?.find((a) => a.type === 'local' || a.kind === 'local')?.currency || 'USD';
  const currencySymbol = currencies.find((c) => c.code === displayCurrency)?.symbol || '$';

  const formatDeadline = (deadline: string) => {
    const parsed = Date.parse(deadline);
    if (!Number.isFinite(parsed)) return deadline || 'No date';
    return new Date(parsed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <Card className="bg-white border border-slate-100 shadow-sm">
        <div className="p-3 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Savings Goals</h3>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <RiIcon className="ri-add-line" />
              Add Goal
            </button>
          </div>

          <div className="space-y-4">
            {(savingsGoals ?? []).map((goal, index) => {
              const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;

              return (
                <motion.div
                  key={goal._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-slate-50 border border-slate-100 rounded-xl p-4 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <h4 className="font-semibold text-slate-900 group-hover:text-primary transition-colors truncate">{goal.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        goal.priority === 'high' ? 'bg-red-50 text-red-500' : goal.priority === 'low' ? 'bg-blue-50 text-blue-500' : 'bg-yellow-50 text-yellow-600'
                      }`}>
                        {goal.priority}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">Due: {formatDeadline(goal.deadline)}</span>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-500">
                        {currencySymbol}
                        {goal.current.toLocaleString()} saved
                      </span>
                      <span className="text-slate-500">
                        {currencySymbol}
                        {goal.target.toLocaleString()} goal
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ delay: 0.5 + (0.1 * index), duration: 1 }}
                        className="bg-orange-500 h-2 rounded-full"
                      ></motion.div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-orange-600">
                      {progress.toFixed(1)}% complete
                    </span>
                    <button
                      onClick={() => setAddFundsGoal({ id: goal._id, title: goal.title })}
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-orange-500/15 transition-all hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                        <RiIcon className="ri-wallet-line text-sm" />
                        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-orange-500 shadow-sm">
                          <RiIcon className="ri-add-line text-[9px]" />
                        </span>
                      </span>
                      <span className="leading-none">Add Funds</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {(savingsGoals ?? []).length === 0 && (
              <div className="py-10 text-center text-slate-400 text-sm">
                <RiIcon className="ri-flag-line text-3xl mb-3 block mx-auto" />
                No savings goals yet. Create your first goal to start tracking progress.
              </div>
            )}
          </div>
        </div>
      </Card>

      <CreateSavingsGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <AddFundsModal
        isOpen={!!addFundsGoal}
        onClose={() => setAddFundsGoal(null)}
        goalId={addFundsGoal?.id ?? null}
        goalTitle={addFundsGoal?.title ?? ''}
      />
    </>
  );
}