"use client"
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Card from '@/components/base/Card';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { currencies } from '@/src/data/currencies';
import RiIcon from '@/components/ui/RiIcon';

export default function CategorySpending() {
  const accounts = useQuery(api.accounts.getAccounts);

  const displayCurrency =
    accounts?.find((a) => a.type === 'local' || a.kind === 'local')?.currency || 'USD';
  const currencySymbol = currencies.find((c) => c.code === displayCurrency)?.symbol || '$';

  const localAccountId = useMemo(() => {
    const local = accounts?.find((acc) => acc.type === 'local' || acc.kind === 'local');
    return local && '_id' in local ? (local._id ?? null) : null;
  }, [accounts]);

  const localTransactions = useQuery(
    api.transactions.getTransactionsByAccount,
    localAccountId ? { bankAccountId: localAccountId } : 'skip',
  );

  const { totalSpent, totalBudget, percentage } = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    let totalSpent = 0;
    for (const tx of localTransactions ?? []) {
      if (tx.amount >= 0) continue;
      const parsed = Date.parse(tx.date);
      if (!Number.isFinite(parsed)) continue;
      const d = new Date(parsed);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key !== currentMonthKey) continue;
      totalSpent += Math.abs(tx.amount);
    }

    const localAccount = accounts?.find((a) => a.type === 'local' || a.kind === 'local');
    const totalBudget =
      (localAccount && 'monthlyExpenses' in localAccount ? (localAccount.monthlyExpenses ?? 0) : 0) || totalSpent || 1;
    const percentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

    return { totalSpent, totalBudget, percentage };
  }, [accounts, localTransactions]);

  const data = [
    { name: 'Spent', value: totalSpent },
    { name: 'Remaining', value: Math.max(totalBudget - totalSpent, 0) },
  ];

  return (
    <Card className="p-3 md:p-6 bg-white border border-slate-100 shadow-sm h-full relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-slate-900">Expenses</h3>
        <button className="text-slate-300 hover:text-slate-500" aria-label="More options">
          <RiIcon className="ri-more-fill" />
        </button>
      </div>

      <div className="relative h-48 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              startAngle={180}
              endAngle={0}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell key="spent" fill="#f97316" />
              <Cell key="remaining" fill="#f1f5f9" />
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                color: '#0f172a',
              }}
              itemStyle={{ color: '#f97316' }}
              formatter={(value: number) => `${currencySymbol}${value.toLocaleString()}`}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
          <span className="text-3xl font-bold text-slate-900">{percentage.toFixed(1)}%</span>
          <span className="text-xs text-slate-400">
            {percentage >= 80 ? 'High usage' : percentage >= 50 ? 'Normal level' : 'Healthy'}
          </span>
        </div>
      </div>

      <div className="text-center mt-[-20px]">
        <div className="inline-block px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">Total Exp</p>
          <p className="text-lg font-bold text-orange-600">
            {currencySymbol}
            {totalSpent.toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
}