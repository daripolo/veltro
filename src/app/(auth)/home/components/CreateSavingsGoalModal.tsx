"use client"
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from 'convex/react';
import Dialog from '@/components/ui/Dialog';
import { api } from '@/convex/_generated/api';
import { motion } from 'framer-motion';
import { currencies } from '@/src/data/currencies';
import RiIcon from '@/components/ui/RiIcon';

interface CreateSavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateSavingsGoalModal({ isOpen, onClose }: CreateSavingsGoalModalProps) {
  const accounts = useQuery(api.accounts.getAccounts);
  const createSavingsGoal = useMutation(api.savingsGoals.createSavingsGoal);
  const [formData, setFormData] = useState({
    title: '',
    target: '',
    deadline: '',
    monthlyContribution: '',
    priority: 'medium',
  });
  const [isLoading, setIsLoading] = useState(false);

  const displayCurrency =
    accounts?.find((a) => a.type === 'local' || a.kind === 'local')?.currency || 'USD';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createSavingsGoal({
        title: formData.title,
        target: Number(formData.target),
        deadline: formData.deadline,
        monthlyContribution: Number(formData.monthlyContribution),
        priority: formData.priority,
      });
      onClose();
      setFormData({
        title: '',
        target: '',
        deadline: '',
        monthlyContribution: '',
        priority: 'medium',
      });
    } catch (error) {
      console.error('Failed to create savings goal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const priorities = [
    { id: 'low', label: 'Low', color: 'bg-blue-500' },
    { id: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { id: 'high', label: 'High', color: 'bg-red-500' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Savings Goal"
      description="Set a target and track your progress."
      type="info"
    >
      <div className="mt-6 mb-8">
        {/* Goal Preview Card */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-50 border border-slate-100 p-5 shadow-sm">
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-1">Goal Preview</p>
              <h3 className="text-xl font-bold text-slate-900">{formData.title || 'New Goal'}</h3>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-white border border-slate-200">
              <span className="text-[10px] font-medium text-slate-500 uppercase">{formData.priority} Priority</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Target</span>
              <span className="text-slate-900 font-mono font-semibold">
                {currencies.find((c) => c.code === displayCurrency)?.symbol}
                {Number(formData.target || 0).toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div className="h-full w-0 bg-orange-500 rounded-full"></div>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Start Today</span>
              <span>{formData.deadline || 'No Date'}</span>
            </div>
          </div>
        </div>
      </div>

      <motion.form
        variants={containerVariants}
        animate="visible"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Title Input */}
        <motion.div variants={itemVariants} className="space-y-1.5">
          <label className="text-xs font-bold text-orange-600 uppercase tracking-wider ml-1">Goal Title</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <RiIcon className="ri-flag-line text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
              placeholder="e.g. New Car, Vacation"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-5">
          {/* Target Amount */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label className="text-xs font-bold text-orange-600 uppercase tracking-wider ml-1">Target Amount</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <RiIcon className="ri-money-dollar-circle-line text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              </div>
              <input
                type="number"
                required
                min="1"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                placeholder="5000"
              />
            </div>
          </motion.div>

          {/* Monthly Contribution */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label className="text-xs font-bold text-orange-600 uppercase tracking-wider ml-1">Monthly</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <RiIcon className="ri-calendar-check-line text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              </div>
              <input
                type="number"
                required
                min="1"
                value={formData.monthlyContribution}
                onChange={(e) => setFormData({ ...formData, monthlyContribution: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                placeholder="200"
              />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Target Date */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label className="text-xs font-bold text-orange-600 uppercase tracking-wider ml-1">Target Date</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <RiIcon className="ri-calendar-event-line text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              </div>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
              />
            </div>
          </motion.div>

          {/* Priority Selector */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label className="text-xs font-bold text-orange-600 uppercase tracking-wider ml-1">Priority</label>
            <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 h-[50px]">
              {priorities.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p.id })}
                  className={`flex-1 rounded-lg text-xs font-bold transition-all ${formData.priority === p.id
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : 'text-slate-400 hover:text-slate-900 hover:bg-white'
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <RiIcon className="ri-loader-4-line animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <RiIcon className="ri-add-line" />
                Create Goal
              </>
            )}
          </button>
        </motion.div>
      </motion.form>
    </Dialog>
  );
}