"use client"

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/base/Card';
import Button from '@/components/base/Button';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import RiIcon from '@/components/ui/RiIcon';

export default function FinancialInsights() {
  const notifications = useQuery(api.notifications.getNotifications);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return 'ri-alert-line';
      case 'success': return 'ri-check-line';
      case 'info': return 'ri-information-line';
      default: return 'ri-lightbulb-line';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-orange-500 bg-orange-50';
      case 'success': return 'text-green-500 bg-green-50';
      case 'info': return 'text-blue-500 bg-blue-50';
      default: return 'text-slate-400 bg-slate-100';
    }
  };

  const financialInsights = useMemo(() => {
    return (notifications ?? []).slice(0, 3).map((n) => ({
      id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
    }));
  }, [notifications]);

  return (
    <Card className="p-4 md:p-6 bg-white border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900">Financial Insights</h3>
        <RiIcon className="ri-lightbulb-line text-orange-500 text-xl" />
      </div>

      <div className="space-y-4">
        {financialInsights.map((insight, index) => (
          <motion.div
            key={insight.id ?? index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-orange-200 transition-all"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getInsightColor(insight.type)}`}>
              <RiIcon className={`${getInsightIcon(insight.type)} text-lg`} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 mb-1">{insight.title}</h4>
              <p className="text-slate-500 text-sm mb-3">{insight.message}</p>
              <Link href="/notifications">
                <Button variant="outline" size="sm" className="text-xs">
                  View
                </Button>
              </Link>
            </div>
          </motion.div>
        ))}

        {financialInsights.length === 0 && (
          <div className="py-10 text-center text-slate-400 text-sm">
            <RiIcon className="ri-lightbulb-line text-3xl mb-3 block mx-auto" />
            No insights right now. Check back later.
          </div>
        )}
      </div>
    </Card>
  );
}