"use client"
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/base/Card';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { currencies } from '@/src/data/currencies';
import RiIcon from '@/components/ui/RiIcon';

export default function CreditCards() {
  const ensureDefaultCard = useMutation(api.creditCards.ensureDefaultCard);
  const creditCards = useQuery(api.creditCards.getCreditCards);
  const identity = useQuery(api.user.user);
  const currentUser = useQuery(api.auth.getCurrentUser);
  const accounts = useQuery(api.accounts.getAccounts);

  useEffect(() => {
    if (!identity) return;
    void ensureDefaultCard().catch(() => {});
  }, [ensureDefaultCard, identity]);

  const cardHolder = currentUser?.name ?? currentUser?.email ?? "";
  const displayCurrency =
    accounts?.find((a) => a.type === 'local' || a.kind === 'local')?.currency || 'USD';
  const currencySymbol = currencies.find((c) => c.code === displayCurrency)?.symbol || '$';

  return (
    <Card className="bg-white border border-slate-100 shadow-sm">
      <div className="p-4 md:p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Credit Cards</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(creditCards ?? []).map((card, index) => (
            <motion.div
              key={card._id}
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ delay: 0.2 * index, duration: 0.6 }}
              className="relative p-6 rounded-xl bg-slate-900 text-white overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform shadow-lg"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-lg font-bold">{card.name}</div>
                  <RiIcon className="ri-bank-card-line text-2xl" />
                </div>

                <div className="mb-6">
                  <div className="text-2xl font-mono tracking-wider mb-2">
                    {card.number}
                  </div>
                  <div className="text-sm opacity-80 font-medium">{cardHolder || 'Card Holder'}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase opacity-80 mb-1">Balance</div>
                    <div className="text-lg font-bold">{currencySymbol}{card.balance.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase opacity-80 mb-1">Due Date</div>
                    <div className="text-sm font-medium">{card.dueDate}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] mb-1 opacity-80">
                    <span>Used</span>
                    <span>
                      {currencySymbol}
                      {card.balance.toFixed(2)} / {currencySymbol}
                      {card.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${card.limit ? (Math.min(card.balance, card.limit) / card.limit) * 100 : 0}%` }}
                      transition={{ delay: 1 + (0.2 * index), duration: 1 }}
                      className="bg-orange-400 h-1.5 rounded-full"
                    ></motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {(creditCards ?? []).length === 0 && (
          <div className="py-10 text-center text-slate-400 text-sm">
            <RiIcon className="ri-bank-card-line text-3xl mb-3 block mx-auto" />
            No credit cards yet.
          </div>
        )}
      </div>
    </Card>
  );
}