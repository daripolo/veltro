"use client";

import { useQuery, useMutation } from "convex/react";

import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";

import RiIcon from '@/components/ui/RiIcon';

export default function NotificationsPage() {
  const notifications = useQuery(api.notifications.getNotifications);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const getTypeIcon = (type: string, icon: string) => {
    if (icon) return icon;
    switch (type) {
      case 'payment': return 'ri-money-dollar-circle-line';
      case 'security': return 'ri-shield-alert-line';
      case 'social': return 'ri-heart-line';
      default: return 'ri-notification-3-line';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'text-green-600 bg-green-500/10 border-green-500/20';
      case 'security': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'social': return 'text-pink-600 bg-pink-500/10 border-pink-500/20';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  return (
    <div className="w-full">

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Notifications</h1>
            <p className="text-slate-500">Stay updated with your account activity.</p>
          </div>
          {notifications && notifications.length > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="px-4 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-medium text-primary transition-colors flex items-center gap-2"
            >
              <RiIcon className="ri-check-double-line" />
              Mark all as read
            </button>
          )}
        </div>

        <div className="space-y-4">
          {notifications === undefined ? (
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-100 rounded-2xl border border-slate-100 p-5 flex gap-5"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="h-4 w-52 max-w-full bg-slate-100 rounded" />
                      <div className="h-5 w-20 bg-slate-100 rounded-lg shrink-0" />
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded mb-2" />
                    <div className="h-3 w-2/3 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl border border-slate-100 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <RiIcon className="ri-notification-off-line text-2xl text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No notifications</h3>
              <p className="text-slate-500 text-sm">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => !notification.read && markAsRead({ id: notification._id })}
                className={`relative group bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl border transition-all cursor-pointer overflow-hidden ${notification.read
                    ? 'border-slate-100 opacity-80'
                    : 'border-primary/30 shadow-[0_0_20px_rgba(234,88,12,0.06)]'
                  }`}
              >
                {!notification.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}

                <div className="p-5 flex gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${getTypeColor(notification.type)}`}>
                    <RiIcon className={`${getTypeIcon(notification.type, notification.icon)} text-xl`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className={`font-bold text-lg truncate ${notification.read ? 'text-slate-600' : 'text-slate-900'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs font-medium text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-1 rounded-lg">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

