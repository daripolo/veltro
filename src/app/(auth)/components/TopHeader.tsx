"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { authClient } from "@/src/lib/auth-client";
import { CustomAvatar } from "@/components/ui/CustomAvatar";
import RiIcon from "@/components/ui/RiIcon";
import NotificationDropdown from "@/components/feature/NotificationDropdown";
import UserMenuDropdown from "@/components/feature/UserMenuDropdown";
import { SidebarBrand, SidebarLinks } from "./Sidebar";

type DropdownNotification = {
  id: Id<"notifications">;
  type: "payment" | "security" | "system" | "social";
  title: string;
  message: string;
  time: string;
  unread: boolean;
};

const mapNotificationType = (
  rawType: string | undefined,
  icon: string | undefined
): "payment" | "security" | "system" | "social" => {
  const t = rawType?.toLowerCase().trim() ?? "";
  const i = icon?.toLowerCase().trim() ?? "";

  if (i.includes("heart") || t.includes("social")) return "social";
  if (
    i.includes("shield") ||
    t.includes("alert") ||
    t.includes("warning") ||
    t.includes("security")
  )
    return "security";
  if (i.includes("money") || t.includes("success") || t.includes("payment"))
    return "payment";
  return "system";
};

const getRelativeTime = (time: string) => {
  if (time === "Just now") return "Just now";
  const date = new Date(time);
  if (isNaN(date.getTime())) return time;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

export function TopHeader() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const provisionUserCryptoVault = useAction(
    api.actions.wallet.generate.provisionUserCryptoVault
  );
  const ensureLinkedUser = useMutation(api.user.ensureLinkedUser);
  const { data: session } = authClient.useSession();

  const currentUser = useQuery(api.auth.getCurrentUser);
  const user = useQuery(api.user.user);
  const notifications = useQuery(api.notifications.getNotifications);
  const markAllNotificationsRead = useMutation(api.notifications.markAllAsRead);
  const markNotificationRead = useMutation(api.notifications.markAsRead);

  useEffect(() => {
    if (!session) return;
    void provisionUserCryptoVault({}).catch(() => {});
    void ensureLinkedUser().catch(() => {});
  }, [ensureLinkedUser, provisionUserCryptoVault, session]);

  const userEmail =
    typeof currentUser?.email === "string" ? currentUser.email : "";

  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    (typeof currentUser?.name === "string" ? currentUser.name.trim() : "") ||
    userEmail.split("@")[0] ||
    "User";

  const userAvatar =
    typeof currentUser?.image === "string" && currentUser.image.trim()
      ? currentUser.image
      : typeof user?.image === "string"
        ? user.image
        : "";

  const userType = (() => {
    if (!currentUser?.emailVerified) return "member";
    if (
      user?.nationalIdStatus === "approved" &&
      user?.driversLicenseStatus === "approved"
    ) {
      if (
        user?.governmentIdStatus === "approved" &&
        user?.proofOfAddressStatus === "approved"
      )
        return "premium member";
      return "gold member";
    }
    return "member";
  })();

  const recentNotifications: DropdownNotification[] = (notifications ?? []).map(
    (n) => ({
      id: n._id,
      type: mapNotificationType(n.type, n.icon),
      title: n.title,
      message: n.message,
      time: getRelativeTime(
        n._creationTime ? new Date(n._creationTime).toISOString() : n.time
      ),
      unread: !n.read,
    })
  );

  const unreadCount = recentNotifications.reduce(
    (count, n) => count + (n.unread ? 1 : 0),
    0
  );

  return (
    <>
      <header className="shrink-0 min-h-14 w-full bg-white border-b border-slate-100 flex items-center justify-between lg:justify-end pl-4 pr-4 sm:px-6 pt-safe sticky top-0 z-40">
        {/* Hamburger (mobile) */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <RiIcon className="ri-menu-line text-xl" />
        </button>

        <div className="flex items-center gap-2">
        {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label="Notifications"
          className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <RiIcon className="ri-notification-line text-xl" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
          )}
        </button>

        <NotificationDropdown
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          notifications={recentNotifications}
          onMarkAllRead={() => {
            void markAllNotificationsRead().catch(() => {});
          }}
          onMarkRead={(id) => {
            void markNotificationRead({ id }).catch(() => {});
          }}
        />
      </div>

      <div className="w-px h-6 bg-slate-200"></div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <CustomAvatar
            src={userAvatar}
            name={userName}
            size={32}
            className="rounded-full ring-2 ring-slate-100"
          />
          <span className="hidden sm:block text-sm font-semibold text-slate-700 max-w-[140px] truncate">
            {userName}
          </span>
          <RiIcon className="ri-arrow-down-s-line text-slate-400 text-sm" />
        </button>

        <UserMenuDropdown
          isOpen={showUserMenu}
          onClose={() => setShowUserMenu(false)}
          user={{ name: userName, email: userEmail, avatar: userAvatar, type: userType }}
        />
        </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
              className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white border-r border-slate-100 flex flex-col p-5 shadow-xl"
            >
              <div className="flex items-start justify-between">
                <SidebarBrand />
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="w-9 h-9 -mt-1 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <RiIcon className="ri-close-line text-lg" />
                </button>
              </div>
              <SidebarLinks onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
