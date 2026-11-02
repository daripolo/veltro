'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { type } from 'arktype';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import RiIcon from '@/components/ui/RiIcon';
import { ScrollArea, ScrollBar } from '@/src/components/ui/scroll-area';

// --- ArkType Schemas ---
const AccountSchema = type("string | number").describe("Account Number");
const AmountSchema = type("number > 0").describe("Amount must be positive");
const NoteSchema = type("string <= 18").describe("Note must be 18 characters or less");

interface LocalTransferFormProps {
  localAccountId: Id<"bank_accounts">;
  balance: number;
  currency?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

import { currencies } from '@/data/currencies';

const getCurrencySymbol = (currencyCode: string = 'USD') => {
  return currencies.find(c => c.code === currencyCode)?.symbol || '$';
};

interface Beneficiary {
  _id: string;
  name: string;
  iban: string;
  color?: string;
}

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

export default function LocalTransferForm({
  localAccountId,
  balance,
  currency = 'USD',
  onSuccess,
  onCancel,
}: LocalTransferFormProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const currencySymbol = getCurrencySymbol(currency);
  const [bankDetails, setBankDetails] = useState<{ name: string; bic: string } | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [useManualDetails, setUseManualDetails] = useState(false);
  const identity = useQuery(api.user.user);
  const user = useQuery(
    api.user.getUserByEmail,
    typeof identity?.email === 'string' ? { email: identity.email } : 'skip',
  );
  const [imsCode, setImsCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const createTransfer = useMutation(api.transfers.createTransfer);
  const createBeneficiary = useMutation(api.beneficiaries.createBeneficiary);
  const createTransaction = useMutation(api.transactions.createTransaction);
  const createNotification = useMutation(api.notifications.createNotification);
  const beneficiaries = useQuery(api.beneficiaries.getBeneficiaries) || [];
  const setImsCodeDb = useMutation(api.user.setImsCode);
  const setOtpCodeDb = useMutation(api.user.setOtpCode);

  const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

  const normalizeOtp = (value: string) => value.replace(/[^\d]/g, '').slice(0, 6);

  const goBack = () => {
    if (step === 1) {
      onCancel();
      return;
    }
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else setStep(3);
  };

  const form = useForm({
    defaultValues: {
      recipient: '',
      amount: '',
      note: '',
      accountName: '',
      bankName: '',
    },
    onSubmit: async ({ value }) => {
      try {
        await createTransfer({
          recipient: value.recipient,
          amount: parseFloat(value.amount),
          note: value.note,
          type: 'local',
          fromAccountId: localAccountId,
        });

        await createTransaction({
          bankAccountId: localAccountId,
          description: `Transfer to ${value.accountName || value.recipient}`,
          amount: parseFloat(value.amount),
          date: new Date().toISOString(),
          category: "Transfer",
          status: "completed",
          merchant: value.accountName || value.recipient,
          location: "Online",
        });

        await createNotification({
          title: "Transfer Sent",
          message: `You sent ${currencySymbol}${value.amount} to ${value.accountName || value.recipient}`,
          type: "success",
          icon: "ri-send-plane-fill",
        });

        if (value.accountName.trim()) {
          await createBeneficiary({
            name: value.accountName.trim(),
            iban: value.recipient,
            bankName: value.bankName.trim() || bankDetails?.name || undefined,
          });
        }

        onSuccess();
      } catch (error) {
        console.error('Transfer failed', error);
      }
    },
  });

  const validateAndResolve = async (account: string) => {
    const result = AccountSchema(account);
    if (result instanceof type.errors) {
      setResolveError("Invalid format");
      setBankDetails(null);
      setUseManualDetails(false);
      return false;
    }

    // For local transfers, we might not have a resolution API, but we'll try or mock it
    // Assuming the same resolve endpoint works or we just skip it for now
    setIsResolving(true);
    setResolveError(null);

    try {
      // Mock resolution for local accounts or use real API if available
      // For now, let's simulate a delay and success for demo purposes
      // or try the API

      const res = await fetch('/api/bank/resolve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ account }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok || data.valid !== true) {
        // Fallback for local accounts that might not be IBANs
        // If it fails resolution, we encourage manual entry
        setResolveError('Could not resolve account details');
        setBankDetails(null);
        return false;
      }

      setBankDetails({
        name: data.bank?.name || 'Unknown Bank',
        bic: data.bank?.bic || '',
      });
      setUseManualDetails(false);
      return true;
    } catch (err) {
      setResolveError('Failed to resolve bank details');
      return false;
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] border border-slate-100 p-5 sm:p-6 lg:p-8 relative overflow-hidden flex flex-col shadow-lg shadow-slate-900/5">
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
            LOCAL TRANSFER
          </motion.h2>
          <div className="flex items-center justify-center gap-1 mt-1">
            <div className={`h-1 w-6 sm:w-8 rounded-full transition-colors duration-500 ${step === 1 ? 'bg-primary' : 'bg-slate-200'}`} />
            <div className={`h-1 w-6 sm:w-8 rounded-full transition-colors duration-500 ${step === 2 ? 'bg-primary' : 'bg-slate-200'}`} />
            <div className={`h-1 w-6 sm:w-8 rounded-full transition-colors duration-500 ${step === 3 ? 'bg-primary' : 'bg-slate-200'}`} />
            <div className={`h-1 w-6 sm:w-8 rounded-full transition-colors duration-500 ${step === 4 ? 'bg-primary' : 'bg-slate-200'}`} />
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
                {/* Recents */}
                <motion.div variants={itemVariants}>
                  <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest pl-1">Recent Beneficiaries</h3>
                  <ScrollArea>
                    <div className="flex gap-4 py-4 px-2">
                      {beneficiaries.map((user: Beneficiary, i: number) => (
                        <motion.div
                          key={user._id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={() => {
                            form.setFieldValue('recipient', user.iban);
                            validateAndResolve(user.iban);
                          }}
                          className="flex flex-col items-center gap-3 min-w-[70px] cursor-pointer group"
                        >
                          <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] ${user.color || 'bg-slate-100 text-slate-700'}`}>
                            {user.name.split(' ').map((n) => n[0]).join('')}
                            <div className="absolute inset-0 rounded-2xl bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-xs text-slate-500 font-medium">{user.name.split(' ')[0]}</span>
                        </motion.div>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </motion.div>

                <div className="space-y-6">
                  <motion.div variants={itemVariants}>
                    <form.Field
                      name="recipient"
                      children={(field) => (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Recipient Account</label>
                          <div className="relative">
                            <input
                              value={field.state.value}
                              onChange={(e) => {
                                field.handleChange(e.target.value);
                                setResolveError(null);
                                setBankDetails(null);
                                setUseManualDetails(false);
                                form.setFieldValue('accountName', '');
                                form.setFieldValue('bankName', '');
                              }}
                              onBlur={(e) => field.handleBlur()}
                              placeholder="Account Number"
                              className={`w-full bg-slate-50 border rounded-xl px-4 py-4 text-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 transition-colors font-mono ${resolveError ? 'border-red-500/50' : 'border-slate-100'}`}
                            />
                            {isResolving && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <RiIcon className="ri-loader-4-line animate-spin text-primary text-xl" />
                              </div>
                            )}
                          </div>
                          {resolveError && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs pl-1">
                              {resolveError}
                            </motion.p>
                          )}
                        </div>
                      )}
                    />
                  </motion.div>

                  {/* Bank Selection Display */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Bank Details</label>
                    <form.Subscribe
                      selector={(state) => [state.values.bankName, state.values.accountName]}
                      children={([manualBankName, manualAccountName]) => {
                        const isManualReady = useManualDetails && !!manualBankName && !!manualAccountName;
                        const displayBankName = bankDetails
                          ? bankDetails.name
                          : useManualDetails && manualBankName
                            ? manualBankName
                            : 'Unknown Bank';
                        const showCheck = !!bankDetails || isManualReady;
                        return (
                          <div className={`w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 flex items-center justify-between ${showCheck ? 'border-primary/30 bg-primary/5' : ''}`}>
<div className="flex min-w-0 items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${showCheck ? 'bg-primary text-white' : 'bg-slate-50 text-slate-500'}`}>
                                <RiIcon className="ri-bank-line text-lg" />
                              </div>
                              <div className="flex min-w-0 flex-col">
                                <span className={`block truncate font-medium ${showCheck ? 'text-slate-900' : 'text-slate-500'}`}>
                                  {displayBankName}
                                </span>
                                {bankDetails && <span className="text-xs text-primary/80">Verified</span>}
                                {!bankDetails && isManualReady && <span className="text-xs text-primary/80">Manual</span>}
                              </div>
                            </div>
                            {showCheck && (
                              <RiIcon className="ri-check-line text-green-500 text-xl" />
                            )}
                          </div>
                        );
                      }}
                    />
                  </motion.div>

                  {!bankDetails && !!resolveError && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Can&apos;t find bank details?</span>
                      <button
                        type="button"
                        onClick={() => setUseManualDetails((v) => !v)}
                        className="text-xs font-medium text-primary/80 hover:text-primary transition-colors"
                      >
                        {useManualDetails ? 'Hide' : 'Enter manually'}
                      </button>
                    </div>
                  )}

                  {useManualDetails && (
                    <div className="space-y-4">
                      <form.Field
                        name="accountName"
                        children={(field) => (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Account Name</label>
                            <input
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              onBlur={() => field.handleBlur()}
                              placeholder="e.g. John Doe"
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 transition-colors"
                            />
                          </div>
                        )}
                      />
                      <form.Field
                        name="bankName"
                        children={(field) => (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Bank Name</label>
                            <input
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              onBlur={() => field.handleBlur()}
                              placeholder="e.g. Chase Bank"
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 transition-colors"
                            />
                          </div>
                        )}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                  <form.Subscribe
                    selector={(state) => [state.values.recipient, state.values.accountName, state.values.bankName]}
                    children={([recipient, manualAccountName, manualBankName]) => (
                      <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={async () => {
                          const isManualReady = useManualDetails && !!manualAccountName && !!manualBankName;
                          if (isManualReady) {
                            setStep(2);
                            return;
                          }
                          const isValid = await validateAndResolve(recipient);
                          if (isValid) setStep(2);
                        }}
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
                  selector={(state) => [state.values.recipient, state.values.accountName, state.values.bankName]}
                  children={([recipient, accountName, bankName]) => (
                    <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border border-slate-100 flex items-center justify-between backdrop-blur-md relative overflow-hidden group">
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="flex min-w-0 items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                          <RiIcon className="ri-bank-line text-xl" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Recipient</p>
                          <p className="font-bold text-slate-900 text-lg truncate">{accountName || bankDetails?.name || bankName || 'Recipient'}</p>
                        </div>
                      </div>
                      <div className="text-right relative z-10 min-w-0 shrink-0">
                        <p className="text-sm text-slate-500 font-mono bg-slate-200 px-3 py-1 rounded-lg border border-slate-100 max-w-full truncate">{recipient.slice(-4).padStart(recipient.length, '•')}</p>
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
                        onChange: ({ value }) => {
                          const result = AmountSchema(parseFloat(value));
                          if (value && result instanceof type.errors) return "Invalid amount";
                          if (parseFloat(value) > balance) return "Insufficient funds";
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
                            <span className="text-slate-500 text-xs flex items-center gap-2">
                              Available: <span className="text-slate-900 font-mono">{currencySymbol}{balance.toLocaleString()}</span>
                            </span>
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
                        onChange: ({ value }) => {
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
                              placeholder="Add a note (optional)"
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
                        type="button"
                        disabled={!canSubmit || isSubmitting}
                        onClick={async () => {
                          if (!canSubmit || isSubmitting) return;
                          setOtpError(null);
                          setImsCode('');
                          setOtpCode('');

                          const ims = user?.imsCode ?? generateOtp();
                          if (user?.isImsCode == false || undefined) {
                            await fetch('/api/send/ims-next-step', {
                              method: 'POST',
                              body: JSON.stringify({
                                email: user?.email,
                                name: user?.firstName,
                              }),
                            });
                          } else {
                            await fetch('/api/send/ims', {
                              method: 'POST',
                              body: JSON.stringify({
                                email: user?.email,
                                name: user?.firstName || 'User',
                                code: ims,
                              }),
                            })
                            await setImsCodeDb({ imsCode: ims });
                          }

                          setStep(3);
                        }}
                        className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-primary via-orange-400 to-orange-700 text-white font-bold text-lg rounded-2xl disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-3 relative overflow-hidden group"
                      >
                        <>
                          <span>Send OTP</span>
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <RiIcon className="ri-lock-password-line text-sm font-bold" />
                          </div>
                        </>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                      </motion.button>
                    )}
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={containerVariants}
              
                animate="visible"
                exit="exit"
                className="flex-1 flex flex-col space-y-6"
              >
                <motion.div variants={itemVariants} className="text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.25em]">IMS Verification</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-2">Confirm this transfer</h3>
                  <p className="text-sm text-slate-500 mt-2">Enter the IMS code we sent to you.</p>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary">
                        <RiIcon className="ri-mail-check-line text-lg" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">IMS Code</p>
                        <p className="text-xs text-slate-500">Valid for a short time</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setOtpError(null);
                        setImsCode('');
                        const newCode = generateOtp();
                        await setImsCodeDb({ imsCode: newCode });
                      }}
                      className="text-xs font-medium text-primary/80 hover:text-primary transition-colors"
                    >
                      Resend
                    </button>
                  </div>

                  <div className="mt-5">
                    <input
                      value={imsCode}
                      onChange={(e) => {
                        setOtpError(null);
                        setImsCode(normalizeOtp(e.target.value));
                      }}
                      inputMode="numeric"
                      placeholder="••••••"
                      className={`w-full bg-slate-50 border rounded-xl px-5 py-4 text-xl sm:text-2xl tracking-[0.25em] sm:tracking-[0.35em] text-center text-slate-900 placeholder-slate-300 focus:outline-none focus:border-primary/50 transition-colors font-mono ${otpError ? 'border-red-500/50' : 'border-slate-100'}`}
                      maxLength={6}
                      aria-label="IMS code"
                    />
                    {otpError && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs mt-2 text-center">
                        {otpError}
                      </motion.p>
                    )}
                  </div>
                </motion.div>

                <div className="mt-auto pt-4">
                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    disabled={imsCode.length !== 6 || isVerifyingOtp}
                    onClick={async () => {
                      const expected = user?.imsCode ?? generateOtp();
                      if (!user?.imsCode) await setImsCodeDb({ imsCode: expected });
                      setIsVerifyingOtp(true);
                      try {
                        if (imsCode !== expected) {
                          setOtpError('Incorrect code. Please try again.');
                          return;
                        }

                        const code = generateOtp();
                        await setOtpCodeDb({ otpCode: code });

                        if (user?.email) {
                          await fetch('/api/send/otp', {
                            method: 'POST',
                            body: JSON.stringify({
                              email: user.email,
                              name: user.firstName,
                              code: code,
                            }),
                          });
                        }

                        setOtpError(null);
                        setStep(4);
                      } finally {
                        setIsVerifyingOtp(false);
                      }
                    }}
                    className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-primary via-orange-400 to-orange-700 text-white font-bold text-lg rounded-2xl disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-3 relative overflow-hidden group"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <RiIcon className="ri-loader-4-line animate-spin text-xl" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify IMS</span>
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                          <RiIcon className="ri-arrow-right-line text-sm font-bold" />
                        </div>
                      </>
                    )}
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                variants={containerVariants}
              
                animate="visible"
                exit="exit"
                className="flex-1 flex flex-col space-y-6"
              >
                <motion.div variants={itemVariants} className="text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.25em]">OTP Verification 2/2</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-2">Final confirmation</h3>
                  <p className="text-sm text-slate-500 mt-2">Enter the second code to submit the transfer.</p>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary">
                        <RiIcon className="ri-shield-check-line text-lg" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Second factor</p>
                        <p className="text-xs text-slate-500">Extra protection for transfers</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setOtpError(null);
                        setOtpCode('');
                        const newCode = generateOtp();
                        await setOtpCodeDb({ otpCode: newCode });
                      }}
                      className="text-xs font-medium text-primary/80 hover:text-primary transition-colors"
                    >
                      Resend
                    </button>
                  </div>

                  <div className="mt-5">
                    <input
                      value={otpCode}
                      onChange={(e) => {
                        setOtpError(null);
                        setOtpCode(normalizeOtp(e.target.value));
                      }}
                      inputMode="numeric"
                      placeholder="••••••"
                      className={`w-full bg-slate-50 border rounded-xl px-5 py-4 text-xl sm:text-2xl tracking-[0.25em] sm:tracking-[0.35em] text-center text-slate-900 placeholder-slate-300 focus:outline-none focus:border-primary/50 transition-colors font-mono ${otpError ? 'border-red-500/50' : 'border-slate-100'}`}
                      maxLength={6}
                      aria-label="OTP code 2"
                    />
                    {otpError && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs mt-2 text-center">
                        {otpError}
                      </motion.p>
                    )}

                  </div>
                </motion.div>

                <div className="mt-auto pt-4">
                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    disabled={otpCode.length !== 6 || isVerifyingOtp || form.state.isSubmitting}
                    onClick={async () => {
                      const expected = user?.otpCode ?? generateOtp();
                      if (!user?.otpCode) await setOtpCodeDb({ otpCode: expected });
                      setIsVerifyingOtp(true);
                      try {
                        if (otpCode !== expected) {
                          setOtpError('Incorrect code. Please try again.');
                          return;
                        }
                        setOtpError(null);
                        await form.handleSubmit();
                      } finally {
                        setIsVerifyingOtp(false);
                      }
                    }}
                    className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-primary via-orange-400 to-orange-700 text-white font-bold text-lg rounded-2xl disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-3 relative overflow-hidden group"
                  >
                    {form.state.isSubmitting ? (
                      <>
                        <RiIcon className="ri-loader-4-line animate-spin text-xl" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Transfer</span>
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                          <RiIcon className="ri-check-line text-sm font-bold" />
                        </div>
                      </>
                    )}
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
