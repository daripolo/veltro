"use client"
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '@/components/base/Card';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { currencies } from '@/src/data/currencies';

export default function SpendingChart() {
  const accounts = useQuery(api.accounts.getAccounts);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { localAccountId, localAccount } = useMemo(() => {
    const local = accounts?.find((acc) => acc.type === 'local' || acc.kind === 'local') ?? null;
    return {
      localAccountId: local && '_id' in local ? (local._id ?? null) : null,
      localAccount: local,
    };
  }, [accounts]);

  const currencySymbol = currencies.find((c) => c.code === (localAccount?.currency || 'USD'))?.symbol || '$';

  const localTransactions = useQuery(
    api.transactions.getTransactionsByAccount,
    localAccountId ? { bankAccountId: localAccountId } : 'skip',
  );

  const { data, percentageChange, directionWord, currentIncome, currentOutcome } = useMemo(() => {
    const now = new Date();

    const numberOfMonths = isMobile ? 3 : 6;
    const monthKeys = Array.from({ length: numberOfMonths }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - ((numberOfMonths - 1) - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      return { key, month };
    });

    const buckets = new Map<string, { month: string; income: number; outcome: number }>();
    for (const { key, month } of monthKeys) {
      buckets.set(key, { month, income: 0, outcome: 0 });
    }

    for (const tx of localTransactions ?? []) {
      const parsed = Date.parse(tx.date);
      if (!Number.isFinite(parsed)) continue;
      const d = new Date(parsed);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = buckets.get(key);
      if (!bucket) continue;

      if (tx.amount >= 0) bucket.income += tx.amount;
      else bucket.outcome += Math.abs(tx.amount);
    }

    const series = monthKeys.map(({ key }) => {
      const bucket = buckets.get(key);
      return {
        month: bucket?.month ?? '',
        income: Math.round((bucket?.income ?? 0) * 100) / 100,
        amount: Math.round((bucket?.outcome ?? 0) * 100) / 100,
      };
    });

    const current = series.at(-1);
    const previous = series.at(-2);
    const currentOutcome = current?.amount ?? 0;
    const previousOutcome = previous?.amount ?? 0;

    const rawChange =
      previousOutcome !== 0 ? ((currentOutcome - previousOutcome) / previousOutcome) * 100 : 0;

    return {
      data: series,
      percentageChange: Math.abs(rawChange),
      directionWord: rawChange >= 0 ? "more" : "less",
      currentIncome: current?.income ?? 0,
      currentOutcome,
    };
  }, [isMobile, localTransactions]);

  const hasData = data.some((d) => d.income > 0 || d.amount > 0);

  return (
    <Card className="h-full bg-white border border-slate-100 shadow-sm">
      <div className="p-3 md:p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 md:mb-8 gap-4">
          <div>
            <h3 className="text-slate-400 text-xs md:text-sm font-medium mb-1">Spending Analysis</h3>
            <div className="text-lg md:text-2xl font-bold text-slate-900 mb-2">
              {hasData
                ? <>You spent {percentageChange.toFixed(1)}% {directionWord} than last month.</>
                : 'No spending data yet this period.'}
            </div>
            <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-2 md:mt-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-slate-400">Income</span>
                </div>
                <div className="text-base md:text-lg font-bold text-slate-900">{currencySymbol}{currentIncome.toLocaleString()}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-xs text-slate-400">Outcome</span>
                </div>
                <div className="text-base md:text-lg font-bold text-slate-900">{currencySymbol}{currentOutcome.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {!hasData ? (
          <div className="h-56 md:h-80 w-full flex items-center justify-center text-sm text-slate-400">
            Transactions from your main account will appear here as a monthly income / outcome chart.
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="h-56 md:h-80 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  fontSize={12}
                  tick={{ fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  fontSize={12}
                  tickFormatter={(value: number) => `${value / 1000}k`}
                  tick={{ fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    color: '#0f172a',
                  }}
                  labelStyle={{ color: '#64748b', marginBottom: '0.5rem' }}
                  itemStyle={{ padding: 0 }}
                  formatter={(value: number, name: string) => [
                    <span key="val" className="font-bold ml-2 text-slate-900">{currencySymbol}{value.toLocaleString()}</span>,
                    name === 'income' ? 'Income' : 'Outcome',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#f97316"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </Card>
  );
}