import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ScrollArea, ScrollBar } from '@/src/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  Bell,
  BellOff,
  Dollar,
  ShieldWarning,
  Heart,
  ArrowRight,
  ArrowRightUp,
  ArrowRightDown,
  InfoCircle
} from '@solar-icons/react-perf/Linear';

interface Notification {
  id: Id<'notifications'>;
  type: 'payment' | 'security' | 'system' | 'social';
  user?: {
    name: string;
    avatar: string;
  };
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkRead?: (id: Id<'notifications'>) => void;
}

const highlightAmount = (text: string) => {
  // Regex to find currency amounts like $14.99, -$14.99, +$2,434.22
  const parts = text.split(/([+\-]?\$[\d,]+(?:\.\d{2})?)/g);

  return parts.map((part, i) => {
    if (part.match(/^[+\-]?\$[\d,]+(?:\.\d{2})?$/)) {
      const isNegative = part.startsWith('-') || (!part.startsWith('+') && !part.startsWith('$'));
      // Assume negative if it has minus, or positive if it has plus. 
      // Context matters but simple heuristic: - is red, + is green.
      // If just $, usually context implies. Let's look for + or -.

      const isPositive = part.startsWith('+');
      const isMinus = part.startsWith('-');

      let className = "font-bold text-white";
      if (isPositive) className = "font-bold text-green-400";
      if (isMinus) className = "font-bold text-red-400";

      return <span key={i} className={className}>{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
};

const getBadges = (notification: Notification) => {
  const badges = [];

  if (notification.type === 'payment') {
    if (notification.message.includes('+')) {
      badges.push({ label: 'Income', color: 'bg-white/5 text-gray-400' });
    } else {
      badges.push({ label: 'Paid', color: 'bg-green-500/10 text-green-400' });
    }

    if (notification.title.includes('Subscription') || notification.message.includes('Plan')) {
      badges.push({ label: 'Membership', color: 'bg-white/5 text-gray-400' });
    } else if (notification.message.includes('received')) {
      // badges.push({ label: 'Income', color: 'bg-white/5 text-gray-400' });
    } else {
      badges.push({ label: 'General', color: 'bg-white/5 text-gray-400' });
    }
  } else if (notification.type === 'security') {
    badges.push({ label: 'Alert', color: 'bg-red-500/10 text-red-400' });
    badges.push({ label: 'Security', color: 'bg-white/5 text-gray-400' });
  } else if (notification.type === 'system') {
    badges.push({ label: 'System', color: 'bg-blue-500/10 text-blue-400' });
  } else if (notification.type === 'social') {
    badges.push({ label: 'Social', color: 'bg-purple-500/10 text-purple-400' });
  }

  return badges;
};

export default function NotificationDropdown({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkRead,
}: NotificationDropdownProps) {

  // No filtering in the new design, just list all
  // But maybe we keep unread logic if needed? 
  // The design shows "Mark as read" which implies managing state.
  // We'll show all but prioritize unread or just list by time (default).

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+4.5rem)] mx-auto w-auto max-w-md md:absolute md:right-0 md:left-auto md:top-full md:mt-2 md:w-[380px] md:max-w-none bg-white rounded-3xl border border-slate-100 z-50 overflow-hidden font-sans shadow-xl shadow-slate-950/5"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base tracking-tight">Notifications</h3>
            <button
              onClick={onMarkAllRead}
              className="text-xs font-bold text-primary hover:text-primary-dark transition-colors uppercase tracking-widest"
            >
              Mark all read
            </button>
          </div>

          {/* List */}
          <ScrollArea className="h-80 md:h-96">
            <div className="py-2">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center mb-4">
                    <BellOff className="text-2xl opacity-30" />
                  </div>
                  <p className="text-sm font-bold tracking-tight">All caught up!</p>
                  <p className="text-xs font-medium opacity-60">No new notifications</p>
                </div>
              ) : (
                notifications.map((notification, index) => {
                  const badges = getBadges(notification);
                  const isIncome = notification.message.includes('+') || notification.message.toLowerCase().includes('received');
                  const isExpense = notification.message.includes('-') || notification.message.toLowerCase().includes('spent') || notification.message.toLowerCase().includes('purchased');

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative px-5 py-4 hover:bg-slate-50 cursor-pointer transition-all group border-b border-slate-50 last:border-0`}
                      onClick={() => {
                        if (!notification.unread) return;
                        if (!onMarkRead) return;
                        onMarkRead(notification.id);
                      }}
                    >
                      <div className="flex gap-5 items-start">
                        {/* Avatar */}
                        <div className="shrink-0 relative">
                          <div className="w-11 h-11 rounded-xl bg-white overflow-hidden border border-slate-100 shadow-sm group-hover:border-primary/30 transition-colors">
                            {notification.user?.avatar ? (
                              <img src={notification.user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {notification.type === 'payment' && <Dollar className="text-2xl text-green-600" />}
                                {notification.type === 'security' && <ShieldWarning className="text-2xl text-red-600" />}
                                {notification.type === 'system' && <InfoCircle className="text-2xl text-blue-600" />}
                                {notification.type === 'social' && <Heart className="text-2xl text-purple-600" />}
                              </div>
                            )}
                          </div>

                          {/* Overlay Icon */}
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center ring-2 ring-white ${isIncome ? 'bg-green-500' :
                              isExpense ? 'bg-red-500' :
                                notification.type === 'security' ? 'bg-orange-500' :
                                  'bg-slate-900'
                            }`}>
                            {isIncome && <ArrowRightDown className="text-xs text-white" />}
                            {isExpense && <ArrowRightUp className="text-xs text-white" />}
                            {notification.type === 'security' && <ShieldWarning className="text-xs text-white" />}
                            {!isIncome && !isExpense && notification.type !== 'security' && <Bell className="text-xs text-white" />}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate pr-2 tracking-tight">
                              {notification.user?.name || notification.title}
                            </p>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter whitespace-nowrap">
                              {notification.time}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 mb-2">
                            {highlightAmount(notification.message)}
                          </p>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2">
                            {badges.map((badge, i) => (
                              <span key={i} className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", badge.color)}>
                                {badge.label}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Unread Dot */}
                        {notification.unread && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100">
            <Link
              href="/notifications"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-all group"
            >
              See all activity
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
