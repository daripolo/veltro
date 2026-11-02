'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { type } from 'arktype';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import RiIcon from '@/components/ui/RiIcon';

// --- ArkType Schemas ---
const AmountSchema = type("number > 0").describe("Amount must be positive");
const NoteSchema = type("string <= 18").describe("Note must be 18 characters or less");

interface RequestMoneyFormProps {
  localAccountId: Id<"bank_accounts">;
  currency?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

import { currencies } from '@/data/currencies';

const getCurrencySymbol = (currencyCode: string = 'USD') => {
  return currencies.find(c => c.code === currencyCode)?.symbol || '$';
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
  exit: { opacity: 0 }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export default function RequestMoneyForm({
  localAccountId,
  currency = 'USD',
  onSuccess,
  onCancel,
}: RequestMoneyFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const currencySymbol = getCurrencySymbol(currency);

  const createTransfer = useMutation(api.transfers.createTransfer);
  const createNotification = useMutation(api.notifications.createNotification);

  const goBack = () => {
    if (step === 1) {
      onCancel();
      return;
    }
    setStep(1);
  };

  const form = useForm({
    defaultValues: {
      recipient: '',
      amount: '',
      note: '',
    },
    onSubmit: async ({ value }) => {
      try {
        const amount = parseFloat(value.amount);
        await createTransfer({
          recipient: value.recipient,
          amount,
          note: value.note,
          type: 'request',
          fromAccountId: localAccountId,
        });

        await createNotification({
          title: "Request Sent",
          message: `You requested ${currencySymbol}${value.amount} from ${value.recipient}`,
          type: "info",
          icon: "ri-hand-coin-line",
        });

        onSuccess();
      } catch (error) {
        console.error('Request failed', error);
      }
    },
  });

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] border border-slate-100 p-5 sm:p-6 lg:p-8 relative overflow-hidden min-h-[400px] sm:min-h-[500px] flex flex-col shadow-lg shadow-slate-900/5">
      <div className="absolute inset-0 bg-slate-50" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-5 sm:mb-6">
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.95 }}
          onClick={goBack}
          className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 backdrop-blur-md transition-colors"
        >
          <RiIcon className="ri-arrow-left-line text-slate-600 text-xl" />
        </motion.button>
        <div className="min-w-0 flex-1 px-2 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-base sm:text-lg font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-slate-400 via-primary to-slate-400"
          >
            REQUEST MONEY
          </motion.h2>
          <div className="flex items-center justify-center gap-1 mt-1">
             <div className={`h-1 w-6 sm:w-8 rounded-full transition-colors duration-500 ${step === 1 ? 'bg-primary' : 'bg-slate-200'}`} />
             <div className={`h-1 w-6 sm:w-8 rounded-full transition-colors duration-500 ${step === 2 ? 'bg-primary' : 'bg-slate-200'}`} />
          </div>
        </div>
        <div className="w-12" />
      </div>

      {/* Form Content */}
      <div className="flex-1 relative z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="h-full flex flex-col"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={containerVariants}
              
                animate="visible"
                exit="exit"
                className="flex-1 flex flex-col space-y-5 sm:space-y-6"
              >
                <div className="space-y-5 sm:space-y-6 pt-4 sm:pt-6">
                    <motion.div variants={itemVariants}>
                        <form.Field
                            name="recipient"
                            children={(field) => (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Request From (Email)</label>
                                    <div className="relative">
                                        <input
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            onBlur={(e) => field.handleBlur()}
                                            placeholder="user@example.com"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 text-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                                            <RiIcon className="ri-mail-line text-xl" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        />
                    </motion.div>
                </div>

                <div className="mt-auto">
                    <form.Subscribe
                        selector={(state) => [state.values.recipient]}
                        children={([recipient]) => (
                            <motion.button
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => {
                                    if (validateEmail(recipient)) {
                                        setStep(2);
                                    }
                                }}
                                disabled={!validateEmail(recipient)}
                                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-primary via-orange-400 to-orange-700 text-white font-bold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Continue <RiIcon className="ri-arrow-right-line transition-transform group-hover:translate-x-1" />
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                            </motion.button>
                        )}
                    />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={containerVariants}
              
                animate="visible"
                exit="exit"
                className="flex-1 flex flex-col space-y-6"
              >
                 {/* Summary Card */}
                 <form.Subscribe
                  selector={(state) => [state.values.recipient]}
                  children={([recipient]) => (
                    <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border border-slate-100 flex items-center justify-between backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                <RiIcon className="ri-hand-coin-line text-xl" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Request From</p>
                                <p className="font-bold text-slate-900 text-lg truncate max-w-[200px]">{recipient}</p>
                            </div>
                        </div>
                    </motion.div>
                  )}
                />

                <div className="space-y-5 sm:space-y-6">
                    {/* Amount Input */}
                    <motion.div variants={itemVariants}>
                        <form.Field
                            name="amount"
                            validators={{
                                onChange: ({value}) => {
                                    const result = AmountSchema(parseFloat(value));
                                    if (value && result instanceof type.errors) return "Invalid amount";
                                    // No balance check for request
                                    return undefined;
                                }
                            }}
                            children={(field) => (
                                <div className="space-y-4 text-center">
                                    <label className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Enter Amount</label>
                                    <div className="relative inline-block w-full">
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="text-3xl sm:text-4xl text-slate-500 font-light mt-2">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                placeholder="0.00"
                                                className="min-w-0 flex-1 bg-transparent py-2 text-5xl sm:text-6xl font-bold text-slate-900 placeholder-slate-300 focus:outline-none text-center tracking-tighter caret-primary"
                                                autoFocus
                                            />
                                        </div>
                                        {/* Underline Animation */}
                                        <div className="h-0.5 w-24 mx-auto bg-slate-100 mt-2 relative overflow-hidden rounded-full">
                                            <div className="absolute inset-0 bg-primary transform -translate-x-full animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-2 bg-slate-50 rounded-full border border-slate-100 max-w-xs mx-auto">
                                        <span className="text-red-500 text-xs font-bold">{field.state.meta.errors ? field.state.meta.errors.join(", ") : ""}</span>
                                    </div>
                                </div>
                            )}
                        />
                    </motion.div>

                    {/* Note Input */}
                    <motion.div variants={itemVariants}>
                        <form.Field
                            name="note"
                            validators={{
                                onChange: ({value}) => {
                                    if (value.trim().length === 0) return "Note is required";
                                    const result = NoteSchema(value);
                                    if (result instanceof type.errors) return "Note too long";
                                    return undefined;
                                }
                            }}
                            children={(field) => (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <RiIcon className="ri-pencil-line absolute left-4 top-4 text-slate-500" />
                                        <textarea
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="What's this for?"
                                            rows={2}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 pl-10 py-4 text-slate-900 focus:border-primary/50 focus:bg-slate-100 outline-none transition-all resize-none"
                                        />
                                        <div className="absolute right-4 bottom-4 text-[10px] text-slate-600 font-mono border border-slate-100 px-1.5 py-0.5 rounded">
                                            {field.state.value.length}/18
                                        </div>
                                    </div>
                                </div>
                            )}
                        />
                    </motion.div>
                </div>

                <div className="mt-auto pt-4">
                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                        children={([canSubmit, isSubmitting]) => (
                             <motion.button
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={!canSubmit || isSubmitting}
                                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-primary via-orange-400 to-orange-700 text-white font-bold text-lg rounded-2xl disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-3 relative overflow-hidden group"
                            >
                                {isSubmitting ? (
                                    <>
                                        <RiIcon className="ri-loader-4-line animate-spin text-xl" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Send Request</span>
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                            <RiIcon className="ri-send-plane-fill text-sm font-bold" />
                                        </div>
                                    </>
                                )}
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                            </motion.button>
                        )}
                    />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
