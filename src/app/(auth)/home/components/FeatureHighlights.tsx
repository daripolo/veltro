import { useQuery } from 'convex/react';
import { motion } from 'framer-motion';
import { api } from '@/convex/_generated/api';
import {
  SendSquare,
  ShieldCheck,
  Smartphone,
  Phone
} from '@solar-icons/react-perf/Linear';

const features = [
  {
    title: 'Fast Transfer',
    description: 'Send money to anyone instantly.',
    icon: SendSquare,
    color: 'text-orange-500 bg-orange-50',
    key: 'transfers',
  },
  {
    title: 'Secure Payment',
    description: 'Your transaction is always protected.',
    icon: ShieldCheck,
    color: 'text-yellow-500 bg-yellow-50',
    key: 'security',
  },
  {
    title: 'Easy Top Up',
    description: 'Top up balance quickly and easily.',
    icon: Smartphone,
    color: 'text-blue-500 bg-blue-50',
    key: 'topup',
  },
  {
    title: '24/7 Support',
    description: "We're here to help you anytime.",
    icon: Phone,
    color: 'text-purple-500 bg-purple-50',
    key: 'support',
  },
];

export default function FeatureHighlights() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {features.map((feature, index) => (
        <motion.div
          key={feature.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${feature.color}`}>
            <feature.icon className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-0.5">{feature.title}</h4>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">{feature.description}</p>
        </motion.div>
      ))}
    </div>
  );
}
