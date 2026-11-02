"use client"
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CustomAvatar } from '../ui/CustomAvatar';
import { useState } from 'react';
import RiIcon from '../ui/RiIcon';
import { authClient } from '@/src/lib/auth-client';

interface UserMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    email: string;
    avatar: string;
    type: string;
  };
}

export default function UserMenuDropdown({ isOpen, onClose, user }: UserMenuDropdownProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const menuItems = [
    { label: 'Profile', icon: 'ri-user-line', href: '/profile', description: 'Manage your personal info' },
    { label: 'Settings', icon: 'ri-settings-4-line', href: '/settings', description: 'App preferences & security' },
    { label: 'Support', icon: 'ri-customer-service-2-line', href: '/support', description: 'Get help & FAQs' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-xl shadow-slate-950/5 border border-slate-100 py-2 z-50 overflow-hidden"
        >
          {/* User Info Header */}
          <div className="px-5 py-4 border-b border-slate-100 relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <div className="relative z-10 flex items-center gap-4">
              <CustomAvatar
                src={user.avatar}
                name={user.name}
                size={48}
                className="rounded-full border-2 border-white shadow-sm ring-2 ring-primary/10"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-base truncate tracking-tight">{user.name}</h3>
                <p className="text-xs text-slate-400 truncate mb-1">{user.email}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase tracking-tighter">
                  {user.type}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2 space-y-1">
            {menuItems.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                  <RiIcon className={`${item.icon} text-lg`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors tracking-tight">{item.label}</p>
                  <p className="text-[10px] font-medium text-slate-400 tracking-tight">{item.description}</p>
                </div>
                <RiIcon className="ri-arrow-right-s-line ml-auto text-slate-300 group-hover:text-slate-900 transition-colors opacity-0 group-hover:opacity-100" />
              </Link>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="p-2 border-t border-slate-50 mt-1">
            <button
              onClick={async () => {
                if (isSigningOut) return;
                setIsSigningOut(true);
                onClose();
                try {
                  await authClient.signOut();
                } finally {
                  router.replace("/auth/signin");
                  router.refresh();
                  setIsSigningOut(false);
                }
              }}
              disabled={isSigningOut}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors group"
            >
              <RiIcon className="ri-logout-box-r-line font-bold group-hover:-translate-x-1 transition-transform" />
              {isSigningOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
