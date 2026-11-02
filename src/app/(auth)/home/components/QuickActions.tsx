import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowRightDown,
  ArrowRightUp,
  AddCircle
} from '@solar-icons/react-perf/Bold';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    { label: 'Request', icon: ArrowRightDown, href: '/transfers', outlined: true },
    { label: 'Transfer', icon: ArrowRightUp, href: '/transfers', outlined: true },
    { label: 'Add Account', icon: AddCircle, href: '/accounts', outlined: false },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <motion.button
          key={action.label}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push(action.href)}
          className={
            action.outlined
              ? "flex-1 min-w-[130px] flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 hover:border-slate-300 hover:shadow-sm transition-all group"
              : "flex-1 min-w-[130px] flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white transition-all group"
          }
        >
          <action.icon className={action.outlined ? "w-5 h-5 text-slate-500" : "w-5 h-5 text-white"} />
          <span className="font-bold text-sm">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
