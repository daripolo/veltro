'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useMutation, useQuery } from 'convex/react';
import { useForm } from '@tanstack/react-form';
import { type } from 'arktype';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import RiIcon from '@/components/ui/RiIcon';
import ModernCreditCard from '@/components/feature/ModernCreditCard';
import { currencies } from '@/data/currencies';
import { cn } from '@/lib/utils';

const CardNameSchema = type('string >= 1').and(type('string <= 40').describe('Card name must be between 1 and 40 characters'));
const CardNumberSchema = type(/^\d{16}$/).or(type(/^\d{4} \d{4} \d{4} \d{4}$/).describe('Card number must be 16 digits or 4 groups of 4 digits separated by spaces'));
const CardExpirySchema = type(/^\d{2}\/\d{2}$/).describe('Card expiry must be in the format MM/YY');
const CardCvvSchema = type(/^\d{3}$/).describe('Card CVV must be 3 digits');
const CardPinSchema = type(/^\d{4}$/).describe('Card PIN must be 4 digits');
const CardBillingSchema = type('string >= 5').describe('Billing address must be at least 5 characters long');

const getStringError = (result: unknown, fallback: string) => {
  if (result instanceof type.errors) {
    return result.summary.split('\n')[0]?.replace(/^◦\s*/, '').trim() || fallback;
  }
  return null;
};

const formatBalance = (amount: number, currency: string) => {
  if (currency === 'IDR') {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }
  const symbol = currencies.find((c) => c.code === currency)?.symbol || '$';
  return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatMaskedNumber = (num: string) => {
  const clean = num.replace(/\D/g, '');
  if (clean.length === 16) {
    return `**** **** **** ${clean.slice(12)}`;
  }
  return num;
};

export default function CardsPage() {
  const setCardFreeze = useMutation(api.creditCards.setCardFreeze);
  const topUpCardFromLocal = useMutation(api.creditCards.topUpCardFromLocal);
  const setCardPin = useMutation(api.creditCards.setCardPin);
  const requestCard = useMutation(api.requestcard.requestCard);
  const deleteCreditCard = useMutation(api.creditCards.deleteCreditCard);
  const ensureUserAccounts = useMutation(api.accounts.ensureUserAccounts);
  const ensureDefaultCard = useMutation(api.creditCards.ensureDefaultCard);
  const createCard = useMutation(api.creditCards.createCard);
  const cards = useQuery(api.creditCards.getCreditCards);
  const accounts = useQuery(api.accounts.getAccounts);
  const identity = useQuery(api.user.user);
  const currentUser = useQuery(api.auth.getCurrentUser);
  const user = useQuery(
    api.user.getUserByEmail,
    typeof currentUser?.email === 'string' ? { email: currentUser.email } : 'skip',
  );

  const [selectedCardId, setSelectedCardId] = useState<Id<"credit_cards"> | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showFullNumber, setShowFullNumber] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [showFeeConfirmation, setShowFeeConfirmation] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<Id<"card_requests"> | null>(null);

  const form = useForm({
    defaultValues: {
      name: '',
      number: '',
      expiry: '',
      cvv: '',
      pin: '',
      billingAddress: '',
      currency: 'USD',
      color: 'from-primary to-orange-500',
    },
    onSubmit: async ({ value }) => {
      try {
        await createCard({
          name: value.name,
          number: value.number,
          dueDate: value.expiry,
          cvv: Number(value.cvv),
          pin: Number(value.pin),
          billingAddress: value.billingAddress,
        });
        setShowAddCardModal(false);
        form.reset();
      } catch (error) {
        console.error("Failed to submit card details", error);
      }
    },
  });

  const handleCreateCard = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  useEffect(() => {
    if (!identity) return;
    void ensureUserAccounts({}).catch(() => { });
    void ensureDefaultCard().catch(() => { });
  }, [ensureDefaultCard, ensureUserAccounts, identity]);

  useEffect(() => {
    if (!cards || cards.length === 0) {
      setSelectedCardId(null);
      return;
    }
    if (!selectedCardId || !cards.some((c) => c._id === selectedCardId)) {
      setSelectedCardId(cards[0]._id);
    }
  }, [cards, selectedCardId]);

  const selectedCard = useMemo(() => {
    if (!cards || cards.length === 0) return null;
    return cards.find((c) => c._id === selectedCardId) ?? cards[0] ?? null;
  }, [cards, selectedCardId]);

  useEffect(() => {
    if (!selectedCard) return;
    setIsFrozen(Boolean((selectedCard as unknown as { freeze?: boolean }).freeze));
  }, [selectedCard]);

  const localAccount = useMemo(() => accounts?.find((acc) => acc.type === "local" || acc.kind === "local") ?? null, [accounts]);

  const { localAccountId, internationalAccountId } = useMemo(() => {
    const internationalAccount = accounts?.find((acc) => acc.type === "international" || acc.kind === "international") ?? null;

    return {
      localAccountId: localAccount && "_id" in localAccount ? (localAccount._id ?? null) : null,
      internationalAccountId:
        internationalAccount && "_id" in internationalAccount ? (internationalAccount._id ?? null) : null,
    };
  }, [accounts, localAccount]);

  const localTransactions = useQuery(
    api.transactions.getTransactionsByAccount,
    localAccountId ? { bankAccountId: localAccountId } : "skip",
  );

  const internationalTransactions = useQuery(
    api.transactions.getTransactionsByAccount,
    internationalAccountId ? { bankAccountId: internationalAccountId } : "skip",
  );

  const recentActivity = useMemo(() => {
    const combined = [...(localTransactions ?? []), ...(internationalTransactions ?? [])];

    // Filter for card top-up transactions
    const cardTransactions = combined.filter(tx =>
      tx.description.includes('Card top up')
    );

    cardTransactions.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    return cardTransactions.slice(0, 4).map((tx) => ({
      id: tx._id,
      description: tx.description,
      amount: tx.amount,
      date: tx.date,
      category: tx.category,
    }));
  }, [internationalTransactions, localTransactions]);

  // Handle Delete Card
  const handleDeleteCard = () => {
    if (!selectedCard) return;
    void deleteCreditCard({ id: selectedCard._id })
      .catch(() => { })
      .finally(() => {
        setShowDeleteConfirm(false);
      });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const handleFeeConfirmation = async () => {
    if (!localAccountId) return;
    try {
      const requestId = await requestCard({ bankAccountId: localAccountId });
      setCurrentRequestId(requestId);
      setShowFeeConfirmation(false);
    } catch (error) {
      console.error("Failed to create initial request", error);
    }
  };

  const cardCurrency = localAccount?.currency || 'USD';

  return (
    <div className="space-y-6">
      <motion.div animate="visible" variants={containerVariants} className="space-y-6">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1 leading-tight">My Cards</h1>
            <p className="text-slate-500 text-sm lg:text-base">Manage your physical and virtual cards</p>
          </div>
          <button
            disabled={cards === undefined || (cards?.length ?? 0) >= 3}
            onClick={() => setShowFeeConfirmation(true)}
            className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-orange-500 px-5 py-3 text-sm font-extrabold text-white transition-all hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <RiIcon className="ri-bank-card-line text-lg" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                <RiIcon className="ri-add-line text-[10px]" />
              </span>
            </span>
            <span className="leading-none">Request New Card</span>
          </button>
        </motion.div>

        {cards === undefined || accounts === undefined || currentUser === undefined ? (
          <div className="flex flex-col gap-6 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="shrink-0 w-[300px] md:w-[340px] h-[200px] rounded-2xl bg-slate-100 border border-slate-100" />
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-5 w-44 bg-slate-200 rounded" />
                    <div className="h-4 w-16 bg-slate-100 rounded" />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="h-3 w-44 max-w-full bg-slate-100 rounded mb-2" />
                            <div className="h-3 w-28 bg-slate-100 rounded" />
                          </div>
                        </div>
                        <div className="h-4 w-20 bg-slate-100 rounded shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 h-full">
                <div className="h-5 w-36 bg-slate-200 rounded mb-6" />
                <div className="space-y-4">
                  <div className="h-28 w-full bg-slate-100 rounded-2xl" />
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-24 w-full bg-slate-100 rounded-2xl" />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-24 w-full bg-slate-100 rounded-2xl" />
                    ))}
                  </div>
                  <div className="h-12 w-full bg-slate-100 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        ) : (cards ?? []).length === 0 ? (
          <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6">
              <RiIcon className="ri-bank-card-line text-4xl text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Cards Found</h2>
            <p className="text-slate-400 mb-6">You don't have any active cards.</p>
            <button onClick={() => setShowAddCardModal(true)} className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
              Apply for a Card
            </button>
          </motion.div>
        ) : (
          /* Cards Layout - Compact */
          <motion.div variants={itemVariants} className="flex flex-col gap-5">
            {/* Top Row: Cards and Details Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left: Card Carousel */}
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 md:p-6">
                  <ScrollArea>
                    <div className="flex overflow-x-auto p-4 gap-4 scrollbar-hide snap-x">
                      {(cards ?? []).map((card) => (
                        <div
                          key={card._id}
                          onClick={() => setSelectedCardId(card._id)}
                          className={cn(
                            'relative shrink-0 w-[300px] md:w-[340px] group cursor-pointer transition-all duration-300 transform snap-center',
                            selectedCardId === card._id ? 'scale-105' : 'opacity-80 hover:opacity-100 scale-100',
                          )}
                        >
                          {/* Selection Ring */}
                          {selectedCardId === card._id && (
                            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary to-orange-500 opacity-40 blur-sm transition-opacity duration-300"></div>
                          )}

                          <ModernCreditCard
                            name={card.name}
                            number={card.number}
                            holder={user ? `${user.firstName} ${user.lastName}` : 'Card Holder'}
                            expiry={card.dueDate}
                            isFrozen={Boolean((card as unknown as { freeze?: boolean }).freeze)}
                          />
                        </div>
                      ))}

                      {/* Add New Card Placeholder */}
                      {(cards?.length ?? 0) < 3 && (
                        <div
                          onClick={() => setShowAddCardModal(true)}
                          className="relative shrink-0 w-[220px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 hover:border-primary/50 transition-all group snap-center"
                        >
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:bg-primary group-hover:text-white text-primary transition-colors shadow-sm">
                            <RiIcon className="ri-add-line text-xl" />
                          </div>
                          <span className="text-xs font-medium text-slate-400 group-hover:text-slate-900 text-center px-2">Add Card</span>
                        </div>
                      )}
                    </div>
                    <ScrollBar className='hidden' orientation='horizontal' />
                  </ScrollArea>
                </div>

                {/* Recent Card Transactions - Compact */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <RiIcon className="ri-history-line text-primary" />
                      Recent Activity
                    </h3>
                    <Link href="/transactions" className="text-xs text-primary hover:underline font-bold">View All</Link>
                  </div>
                  {recentActivity.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <RiIcon className="ri-card-line text-3xl mb-3 block text-slate-300" />
                      <p className="text-sm">No card top-ups yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {recentActivity.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0", tx.amount > 0 ? 'bg-green-500/10 text-green-600' : 'bg-slate-100 text-slate-500')}>
                              <RiIcon className={tx.category === 'Shopping' ? 'ri-shopping-bag-3-line' :
                                tx.category === 'Food' ? 'ri-restaurant-line' :
                                  tx.category === 'Entertainment' ? 'ri-movie-line' : 'ri-exchange-dollar-line'} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-slate-900 text-sm font-medium truncate">{tx.description}</div>
                              <div className="text-xs text-slate-400 truncate">{new Date(tx.date).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className={cn("text-sm font-bold whitespace-nowrap ml-4", tx.amount > 0 ? 'text-green-600' : 'text-slate-900')}>
                            {tx.amount > 0 ? '+' : ''}{formatBalance(Math.abs(tx.amount), cardCurrency)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Compact Card Details */}
              {selectedCard && (
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 md:p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <RiIcon className="ri-settings-3-line text-primary" />
                        Card Control
                      </h2>
                      <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border", isFrozen ? 'bg-red-500/10 border-red-500/20 text-red-600' : 'bg-green-500/10 border-green-500/20 text-green-600')}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", isFrozen ? 'bg-red-500 animate-pulse' : 'bg-green-500 animate-pulse')}></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{isFrozen ? 'Frozen' : 'Active'}</span>
                      </div>
                    </div>

                    {/* Spending Limit Circle/Bar */}
                    <div className="mb-6 p-1 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="bg-white rounded-xl p-4">
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Credit Usage</div>
                            <div className="text-2xl font-bold text-slate-900">
                              {selectedCard.limit > 0 ? Math.round((selectedCard.balance / selectedCard.limit) * 100) : 0}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Available</div>
                            <div className="text-sm font-medium text-slate-900">
                              {formatBalance(selectedCard.limit - selectedCard.balance, cardCurrency)}
                            </div>
                          </div>
                        </div>

                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedCard.limit > 0 ? (selectedCard.balance / selectedCard.limit) * 100 : 0}%` }}
                            transition={{ duration: 1 }}
                            className={cn("absolute left-0 top-0 h-full rounded-full", isFrozen ? 'bg-slate-400' : 'bg-gradient-to-r from-primary to-orange-500')}
                          ></motion.div>
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>{formatBalance(selectedCard.balance, cardCurrency)} added</span>
                          <span>Limit: {formatBalance(selectedCard.limit, cardCurrency)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[50, 100, 500].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => {
                            if (!selectedCard) return;
                            void topUpCardFromLocal({ cardId: selectedCard._id, amount }).catch(() => { });
                          }}
                          className="group relative p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-primary/30 transition-all flex flex-col items-center justify-center gap-2"
                        >
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                            <RiIcon className="ri-add-circle-line text-lg" />
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-bold text-slate-900">
                              {formatBalance(amount, cardCurrency)}
                            </div>
                            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Top Up</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Actions Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
                      <button
                        onClick={() => {
                          if (!selectedCard) return;
                          const nextFreeze = !isFrozen;
                          setIsFrozen(nextFreeze);
                          void setCardFreeze({ id: selectedCard._id, freeze: nextFreeze }).catch(() => { });
                        }}
                        className={cn(
                          "group relative p-4 rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col items-center justify-center gap-2",
                          isFrozen
                            ? 'bg-red-500/5 border-red-500/30 hover:bg-red-500/10'
                            : 'bg-slate-50 border-slate-100 hover:border-primary/30 hover:bg-white'
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", isFrozen ? 'bg-red-500/10 text-red-600' : 'bg-white text-slate-500 group-hover:bg-primary group-hover:text-white shadow-sm')}>
                          <RiIcon className={`text-xl ${isFrozen ? 'ri-lock-fill' : 'ri-lock-unlock-line'}`} />
                        </div>
                        <span className={cn("text-xs font-medium", isFrozen ? 'text-red-600' : 'text-slate-500 group-hover:text-slate-900')}>
                          {isFrozen ? 'Unfreeze' : 'Freeze Card'}
                        </span>
                      </button>

                      {[
                        { icon: 'ri-eye-line', label: 'Card Details', action: () => setShowDetailsModal(true) },
                        { icon: 'ri-shield-key-line', label: 'Change PIN', action: () => { setNewPin(''); setShowPinModal(true); } },
                      ].map((item, i) => (
                        <button
                          key={i}
                          onClick={item.action}
                          className="group p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/30 hover:bg-white transition-all flex flex-col items-center justify-center gap-2"
                        >
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
                            <RiIcon className={`${item.icon} text-xl`} />
                          </div>
                          <span className="text-xs font-medium text-slate-500 group-hover:text-slate-900">{item.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="pt-6 border-t border-slate-100">
                      {/* Remove Card Link */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-500/80 hover:text-red-600 hover:bg-red-50 transition-all text-xs font-bold uppercase tracking-wider"
                        >
                          <RiIcon className="ri-delete-bin-line" />
                          Remove Card
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Change PIN Modal */}
      <AnimatePresence>
        {showPinModal && selectedCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowPinModal(false)}
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Change PIN</h3>
                <button onClick={() => setShowPinModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <RiIcon className="ri-close-line text-2xl" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setNewPin(val);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-center text-2xl tracking-[1em] focus:border-primary focus:outline-none transition-colors"
                    placeholder="••••"
                  />
                </div>

                <button
                  disabled={newPin.length !== 4}
                  onClick={() => {
                    void setCardPin({ id: selectedCard._id, pin: Number(newPin) })
                      .then(() => {
                        setShowPinModal(false);
                        setNewPin('');
                      })
                      .catch(() => { });
                  }}
                  className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update PIN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fee Confirmation Modal */}
      <AnimatePresence>
        {showFeeConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowFeeConfirmation(false)}
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <RiIcon className="ri-information-line text-3xl text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-4">Important Information</h3>
              <p className="text-slate-500 text-center mb-6 text-sm leading-relaxed">
                Please note that if this request is approved, the applicable card issuance fee will be automatically deducted from my local account. I also understand that the processing time for this request is estimated to take two to three business days.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowFeeConfirmation(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleFeeConfirmation()}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-colors"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowAddCardModal(false)}
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-xl font-bold text-slate-900">Request New Card</h3>
                <button onClick={() => setShowAddCardModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <RiIcon className="ri-close-line text-2xl" />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-[55vh] pr-4">
                  <form id="create-card-form" onSubmit={handleCreateCard} className="space-y-4 pb-3">
                    <form.Field
                      name="name"
                      validators={{
                        onChange: ({ value }) => getStringError(CardNameSchema(value), 'Name must be between 1 and 40 characters'),
                      }}
                      children={(field) => (
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Card Name</label>
                          <input
                            type="text"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-primary focus:outline-none transition-colors"
                            placeholder="e.g. Veltro Platinum"
                          />
                          {field.state.meta.errors ? (
                            <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</p>
                          ) : null}
                        </div>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <form.Field
                        name="number"
                        validators={{
                          onChange: ({ value }) => getStringError(CardNumberSchema(value), 'Must be 16 digits'),
                        }}
                        children={(field) => (
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Card Number (16 digits)</label>
                            <input
                              type="text"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-primary focus:outline-none transition-colors font-mono"
                              placeholder="0000 0000 0000 0000"
                            />
                            {field.state.meta.errors ? (
                              <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</p>
                            ) : null}
                          </div>
                        )}
                      />

                      <form.Field
                        name="expiry"
                        validators={{
                          onChange: ({ value }) => getStringError(CardExpirySchema(value), 'Format: MM/YY'),
                        }}
                        children={(field) => (
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Expiry (MM/YY)</label>
                            <input
                              type="text"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-primary focus:outline-none transition-colors font-mono"
                              placeholder="12/28"
                            />
                            {field.state.meta.errors ? (
                              <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</p>
                            ) : null}
                          </div>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <form.Field
                        name="cvv"
                        validators={{
                          onChange: ({ value }) => getStringError(CardCvvSchema(value), 'Must be 3 digits'),
                        }}
                        children={(field) => (
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">CVV</label>
                            <input
                              type="number"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-primary focus:outline-none transition-colors font-mono"
                              placeholder="123"
                              maxLength={3}
                            />
                            {field.state.meta.errors ? (
                              <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</p>
                            ) : null}
                          </div>
                        )}
                      />

                      <form.Field
                        name="pin"
                        validators={{
                          onChange: ({ value }) => getStringError(CardPinSchema(value), 'Must be 4 digits'),
                        }}
                        children={(field) => (
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">PIN</label>
                            <input
                              type="number"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-primary focus:outline-none transition-colors font-mono"
                              placeholder="1234"
                              maxLength={4}
                            />
                            {field.state.meta.errors ? (
                              <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</p>
                            ) : null}
                          </div>
                        )}
                      />
                    </div>

                    <form.Field
                      name="billingAddress"
                      validators={{
                        onChange: ({ value }) => getStringError(CardBillingSchema(value), 'Address too short'),
                      }}
                      children={(field) => (
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Billing Address</label>
                          <input
                            type="text"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-primary focus:outline-none transition-colors"
                            placeholder="123 Street, City, Country"
                          />
                          {field.state.meta.errors ? (
                            <p className="text-xs text-red-500 mt-1">{field.state.meta.errors.join(', ')}</p>
                          ) : null}
                        </div>
                      )}
                    />
                  </form>
                </ScrollArea>
              </div>

              <div className="flex gap-4 pt-6 mt-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="create-card-form"
                  className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-colors"
                >
                  Create Card
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                <RiIcon className="ri-delete-bin-line text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Card?</h3>
              <p className="text-slate-500 text-center mb-8 text-sm">
                Are you sure you want to delete your <span className="text-slate-900 font-medium">{selectedCard?.name}</span>? This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCard}
                  className="px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Show Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowDetailsModal(false)}
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl p-6 md:p-8 w-[480px] max-w-full shadow-2xl overflow-hidden"
            >
              {/* Glow Effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-32 translate-x-32 pointer-events-none"></div>

              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-xl font-bold text-slate-900">Card Information</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <RiIcon className="ri-close-line" />
                </button>
              </div>

              <div className="space-y-4 relative z-10">
                {/* Combined Card Details */}
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <RiIcon className="ri-bank-card-fill text-6xl text-primary" />
                  </div>

                  <div className="relative z-10">
                    <div className="mb-6">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Card Number</div>
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-2xl text-slate-900 tracking-widest">
                          {showFullNumber ? selectedCard.number : formatMaskedNumber(selectedCard.number)}
                        </div>
                        <button
                          onClick={() => setShowFullNumber(!showFullNumber)}
                          className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary hover:bg-slate-50 transition-colors border border-slate-100"
                        >
                          <RiIcon className={showFullNumber ? 'ri-eye-off-line' : 'ri-eye-line'} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Expiry</div>
                        <div className="font-mono text-lg text-slate-900">{selectedCard.dueDate}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">CVV</div>
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-lg text-slate-900">
                            {(() => {
                              const cvv = (selectedCard as unknown as { cvv?: number }).cvv;
                              if (cvv === undefined) return "—";
                              if (!showCvv) return "•••";
                              return String(cvv).padStart(3, "0");
                            })()}
                          </div>
                          <button
                            onClick={() => setShowCvv(!showCvv)}
                            className="text-primary hover:text-orange-500 transition-colors"
                          >
                            <RiIcon className={showCvv ? 'ri-eye-off-line' : 'ri-eye-line'} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Holder</div>
                        <div className="text-slate-900 font-medium truncate">{user ? `${user.firstName} ${user.lastName}` : '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Address - Compact Row */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <RiIcon className="ri-map-pin-2-line text-lg" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Billing Address</div>
                    <div className="text-slate-900 text-sm truncate">
                      {(selectedCard as unknown as { billingAddress?: string }).billingAddress ?? "—"}
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-700 transition-colors">
                    <RiIcon className="ri-file-copy-line" />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <RiIcon className="ri-shield-keyhole-line text-lg" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">PIN</div>
                    <div className="font-mono text-sm tracking-widest text-slate-900">
                      {(() => {
                        const pin = (selectedCard as unknown as { pin?: number }).pin;
                        if (pin === undefined) return "—";
                        if (!showPin) return "••••";
                        return String(pin).padStart(4, "0");
                      })()}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPin(!showPin)}
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <RiIcon className={showPin ? "ri-eye-off-line" : "ri-eye-line"} />
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">
                  <RiIcon className="ri-lock-fill mr-1" />
                  Your card information is end-to-end encrypted.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}