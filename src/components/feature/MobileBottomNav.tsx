'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {Graph, Home, MoneyBag, TransferHorizontal, Wallet } from '@solar-icons/react-perf/Linear';
import {
 Graph as GraphActive,
  Home as HomeActive,
  MoneyBag as MoneyBagActive,
  TransferHorizontal as TransferHorizontalActive,
  Wallet as WalletActive,
} from '@solar-icons/react-perf/Bold';

const navigationItems = [
  { name: 'Home', path: '/home', Icon: Home, ActiveIcon: HomeActive },
  { name: 'Transfers', path: '/transfers', Icon: TransferHorizontal, ActiveIcon: TransferHorizontalActive },
  { name: 'Accounts', path: '/accounts', Icon: Wallet, ActiveIcon: WalletActive },
  { name: 'Loan', path: '/loans', Icon: MoneyBag, ActiveIcon: MoneyBagActive },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-100 pb-safe shadow-[0_-1px_20px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between px-4 py-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.path || (pathname.startsWith(item.path) && item.path !== '/' && pathname[item.path.length] === '/');
          
          const Icon = isActive ? item.ActiveIcon : item.Icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className="relative flex flex-col items-center justify-center p-2 group w-full"
            >
              <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-900'
              }`}>
                {isActive && (
                   <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 bg-primary/5 rounded-2xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon size={24} color="currentColor" className="relative z-10" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 transition-colors ${
                isActive ? 'text-primary' : 'text-slate-400'
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
