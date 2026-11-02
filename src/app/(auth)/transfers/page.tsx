'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import InternationalTransferForm from './InternationalTransferForm';
import LocalTransferForm from './LocalTransferForm';
import EmailTransferForm from './EmailTransferForm';
import RequestMoneyForm from './RequestMoneyForm';

import RiIcon from '@/components/ui/RiIcon';

type TransferType = 'local' | 'bank_email' | 'international' | 'request' | null;

export default function TransfersPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<TransferType>(null);
  const [success, setSuccess] = useState(false);
  const [requestActionId, setRequestActionId] = useState<Id<"transfers"> | null>(null);
  const [internationalAccountId, setInternationalAccountId] = useState<Id<"bank_accounts"> | null>(null);
  const [localAccountId, setLocalAccountId] = useState<Id<"bank_accounts"> | null>(null);

  const identity = useQuery(api.user.user);
  const accounts = useQuery(api.accounts.getAccounts);
  const internationalAccount = accounts?.find((acc) => acc.type === "international" || acc.kind === "international") ?? accounts?.[0];
  const localAccount = accounts?.find((acc) => acc.type === "local" || acc.kind === "local") ?? accounts?.[0];
  const ensureUserAccounts = useMutation(api.accounts.ensureUserAccounts);
  const incomingRequests = useQuery(api.transfers.getIncomingRequests);
  const respondToRequest = useMutation(api.transactions.respondToRequest);

  useEffect(() => {
    if (!identity) return;
    void ensureUserAccounts({})
      .then((result) => {
        if (!result) return;
        setInternationalAccountId(result.internationalId);
        setLocalAccountId(result.localId);
      })
      .catch(() => { });
  }, [ensureUserAccounts, identity]);

  const handleTypeSelect = (type: TransferType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedType(null);
    setSuccess(false);
  };

  const transferOptions = [
    { id: 'local', label: 'Local Transfer', desc: 'Transfer to a local bank account', icon: 'ri-bank-card-line', color: 'text-primary bg-primary/10' },
    { id: 'bank_email', label: 'Send to Email', desc: 'Transfer funds via email address', icon: 'ri-mail-send-line', color: 'text-primary bg-primary/10' },
    { id: 'international', label: 'International Transfer', desc: 'Send money abroad', icon: 'ri-global-line', color: 'text-primary bg-primary/10' },
    { id: 'request', label: 'Request Money', desc: 'Request funds via email', icon: 'ri-hand-coin-line', color: 'text-primary bg-primary/10', isNew: true },
  ];

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 overflow-hidden">
        <div className="space-y-5 sm:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 sm:mb-6 text-center"
          >
            <h1 className="text-[clamp(1.75rem,4vw,3rem)] font-extrabold text-slate-900 mb-2 leading-tight">New Transfer</h1>
            <p className="text-slate-500 text-base lg:text-lg">Choose how you want to move your money</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {incomingRequests === undefined ? (
                  <div className="mb-5 sm:mb-6 animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-5 w-44 bg-slate-100 rounded" />
                      <div className="h-4 w-20 bg-slate-100 rounded" />
                    </div>
                    <div className="space-y-3">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="p-5 bg-white rounded-2xl border border-slate-100">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-100 shrink-0" />
                              <div className="min-w-0">
                                <div className="h-4 w-36 bg-slate-100 rounded mb-2" />
                                <div className="h-3 w-44 bg-slate-100 rounded" />
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="h-4 w-20 bg-slate-100 rounded ml-auto mb-2" />
                              <div className="h-3 w-14 bg-slate-100 rounded ml-auto" />
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-end gap-2">
                            <div className="h-9 w-20 bg-slate-100 rounded-xl" />
                            <div className="h-9 w-20 bg-slate-100 rounded-xl" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (incomingRequests?.length ?? 0) > 0 && (
                  <div className="mb-5 sm:mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-slate-900">Incoming Requests</h2>
                      <span className="text-xs text-slate-500">{incomingRequests.length} pending</span>
                    </div>
                    <div className="space-y-3">
                      {incomingRequests.map((req) => (
                        <div
                          key={req._id}
                          className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-primary/20 transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/15 shrink-0">
                                  <RiIcon className="ri-hand-coin-line text-lg" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-900 truncate">{req.from}</p>
                                  <p className="text-xs text-slate-500 truncate">{req.note || 'Request'}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-slate-900">
                                {localAccount?.currency ? (localAccount.currency === 'USD' ? '$' : localAccount.currency) : '$'}
                                {req.amount.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">Pending</p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={!localAccountId || requestActionId === req._id}
                              onClick={() => {
                                if (!localAccountId) return;
                                setRequestActionId(req._id);
                                void respondToRequest({ transferId: req._id, action: "decline" })
                                  .finally(() => setRequestActionId(null));
                              }}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              disabled={!localAccountId || requestActionId === req._id}
                              onClick={() => {
                                if (!localAccountId) return;
                                setRequestActionId(req._id);
                                void respondToRequest({ transferId: req._id, action: "accept", payerAccountId: localAccountId })
                                  .finally(() => setRequestActionId(null));
                              }}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-linear-to-r from-primary to-orange-500 text-white hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Pay Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {transferOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => handleTypeSelect(option.id as TransferType)}
                      className="group flex items-center gap-4 p-4 lg:p-6 bg-white rounded-2xl border border-slate-100 hover:border-primary/30 hover:bg-slate-50 transition-all cursor-pointer relative overflow-hidden h-full w-full"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${option.color} group-hover:scale-110 transition-transform shrink-0`}>
                        <RiIcon className={option.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg truncate">{option.label}</h3>
                          {option.isNew && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500 text-white uppercase shrink-0">New</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 truncate">{option.desc}</p>
                      </div>
                      <RiIcon className="ri-arrow-right-s-line text-slate-500 group-hover:text-slate-900 text-xl shrink-0" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Render specific form based on selection */}
                {selectedType === 'international' && internationalAccountId && (
                  <InternationalTransferForm
                    internationalAccountId={internationalAccountId}
                    balance={internationalAccount?.balance ?? 0}
                    currency={internationalAccount?.currency}
                    onSuccess={() => {
                      setSuccess(true);
                      setTimeout(handleBack, 2000);
                    }}
                    onCancel={handleBack}
                  />
                )}

                {selectedType === 'local' && localAccountId && (
                  <LocalTransferForm
                    localAccountId={localAccountId}
                    balance={localAccount?.balance ?? 0}
                    currency={localAccount?.currency}
                    onSuccess={() => {
                      setSuccess(true);
                      setTimeout(handleBack, 2000);
                    }}
                    onCancel={handleBack}
                  />
                )}

                {selectedType === 'bank_email' && localAccountId && (
                  <EmailTransferForm
                    localAccountId={localAccountId}
                    balance={localAccount?.balance ?? 0}
                    currency={localAccount?.currency}
                    onSuccess={() => {
                      setSuccess(true);
                      setTimeout(handleBack, 2000);
                    }}
                    onCancel={handleBack}
                  />
                )}

                {selectedType === 'request' && localAccountId && (
                  <RequestMoneyForm
                    localAccountId={localAccountId}
                    currency={localAccount?.currency}
                    onSuccess={() => {
                      setSuccess(true);
                      setTimeout(handleBack, 2000);
                    }}
                    onCancel={handleBack}
                  />
                )}

                {/* Loading State if accounts aren't ready */}
                {((selectedType === 'international' && !internationalAccountId) ||
                  (selectedType !== 'international' && !localAccountId)) && (
                    <div className="flex items-center justify-center h-64">
                      <RiIcon className="ri-loader-4-line animate-spin text-3xl text-primary" />
                    </div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </div>
  );
}
