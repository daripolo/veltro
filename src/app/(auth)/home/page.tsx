'use client';

import { motion } from 'framer-motion';
import DashboardHero from './components/DashboardHero';
import RecentTransactions from './components/RecentTransactions';
import QuickActions from './components/QuickActions';
import FeatureHighlights from './components/FeatureHighlights';
import SpendingChart from './components/SpendingChart';
import CategorySpending from './components/CategorySpending';
import SavingsGoals from './components/SavingsGoals';
import FinancialInsights from './components/FinancialInsights';

export default function HomePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Greeting Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
      </motion.div>

      {/* Account Cards */}
      <DashboardHero />

      {/* Quick Actions */}
      <QuickActions />

      {/* Spending Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SpendingChart />
        </div>
        <div>
          <CategorySpending />
        </div>
      </div>

      {/* Recent Transactions */}
      <RecentTransactions />

      {/* Savings Goals */}
      <SavingsGoals />

      {/* Financial Insights */}
      <FinancialInsights />

      {/* Feature Highlights */}
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-3">Why Choose Veltro</h2>
        <FeatureHighlights />
      </section>
    </div>
  );
}