"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
// import { useTheme } from '../../contexts/ThemeContext';
import NotificationDropdown from "./NotificationDropdown";
import UserMenuDropdown from "./UserMenuDropdown";
import { CustomAvatar } from "../ui/CustomAvatar";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  Card,
  Graph,
  MoneyBag,
  TransferHorizontal,
  Widget,
} from "@solar-icons/react-perf/BoldDuotone";
import { authClient } from "@/src/lib/auth-client";
import { api } from "@/convex/_generated/api";
import RiIcon from "../ui/RiIcon";
import { brand, BrandMark } from "@/src/components/landing/landing-config";

export default function Header() {
  const pathname = usePathname();
  // const { isDarkMode, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const provisionUserCryptoVault = useAction(
    api.actions.wallet.generate.provisionUserCryptoVault
  );
  const { data: session } = authClient.useSession();
  const currentUser = useQuery(api.auth.getCurrentUser);
  const user = useQuery(api.user.user);
  const userProfile = useQuery(
    api.user.getUserByEmail,
    typeof currentUser?.email === "string"
      ? { email: currentUser.email }
      : "skip"
  );
  const notifications = useQuery(api.notifications.getNotifications);
  const markAllNotificationsRead = useMutation(api.notifications.markAllAsRead);
  const markNotificationRead = useMutation(api.notifications.markAsRead);
  const ensureLinkedUser = useMutation(api.user.ensureLinkedUser);

  useEffect(() => {
    if (!session) return;
    void provisionUserCryptoVault({}).catch(() => {});
    void ensureLinkedUser().catch(() => {});
  }, [ensureLinkedUser, provisionUserCryptoVault, session]);

  const navigationItems = [
    { name: "Dashboard", path: "/home", Icon: Widget },
    { name: "Accounts", path: "/accounts", Icon: Card },
    { name: "Transfers", path: "/transfers", Icon: TransferHorizontal },
    { name: "Investments", path: "/investments", Icon: Graph },
    { name: "Loans", path: "/loans", Icon: MoneyBag },
  ];

  const defaultAvatar = user?.image;
  const userEmail =
    (typeof currentUser?.email === "string" ? currentUser.email : null) ??
    (typeof userProfile?.email === "string" ? userProfile.email : null) ??
    "";

  const firstName =
    typeof userProfile?.firstName === "string"
      ? userProfile.firstName.trim()
      : "";
  const lastName =
    typeof userProfile?.lastName === "string"
      ? userProfile.lastName.trim()
      : "";
  const profileName = `${firstName} ${lastName}`.trim();

  const authName =
    typeof currentUser?.name === "string" ? currentUser.name.trim() : "";
  const fromEmail = userEmail.split("@")[0]?.trim() ?? "";
  const userName = profileName || authName || fromEmail || "User";

  const userNameParts = userName.split(/\s+/).filter(Boolean);
  const userNameShort = (() => {
    if (userNameParts.length === 0) return "User";
    if (userNameParts.length === 1) return userNameParts[0] ?? "User";
    const first = userNameParts[0] ?? "User";
    const second = userNameParts[1] ?? "";
    return second ? `${first} ${second[0]}.` : first;
  })();

  const userAvatar =
    typeof currentUser?.image === "string" && currentUser.image.trim()
      ? currentUser.image
      : defaultAvatar;

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
    if (isNaN(date.getTime())) return time; // Fallback if parsing fails

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getUserLevel = () => {
    if (!user) return null;
    let level = 0;
    let status = "";
    // Level 1: Email verified (assuming identity exists means email is verified via Better Auth)
    if (currentUser?.emailVerified == true) {
      level = 1;
      status = "member";
    }
    // Level 2: Level 1 + National ID approved
    if (
      level === 1 &&
      user.nationalIdStatus === "approved" &&
      user.driversLicenseStatus === "approved"
    ) {
      level = 2;
      status = "Veltro Member";
    }

    // Level 3: Level 2 + Government ID + Proof of Address approved
    if (
      level === 2 &&
      user.governmentIdStatus === "approved" &&
      user.proofOfAddressStatus === "approved"
    ) {
      level = 3;
      status = "premium member";
    }

    return status;
  };

  const recentNotifications = (notifications ?? []).map((n) => ({
    id: n._id,
    type: mapNotificationType(n.type, n.icon),
    title: n.title,
    message: n.message,
    time: getRelativeTime(
      n._creationTime ? new Date(n._creationTime).toISOString() : n.time
    ),
    unread: !n.read,
  }));

  const unreadCount = recentNotifications.reduce(
    (count, n) => count + (n.unread ? 1 : 0),
    0
  );

  return (
    <header className="bg-charcoal/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 transition-all">
      <div className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/home" className="flex items-center space-x-3 group">
            <span
              aria-hidden
              className="grid size-10 place-items-center rounded-xl bg-orange-600 text-black"
            >
              <BrandMark className="size-5" strokeWidth={2.25} />
            </span>
            <span className="text-2xl font-bold text-white tracking-wide transition-colors group-hover:text-orange-500">
              {brand.name}
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1 bg-white/5 p-1.5 rounded-2xl border border-white/5">
            {navigationItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.Icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 group ${
                    isActive ? "text-black" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-linear-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/20"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center space-x-2">
                    <Icon
                      size={20}
                      color="currentColor"
                      className={`${
                        isActive
                          ? "text-black"
                          : "group-hover:text-orange-500 transition-colors"
                      }`}
                    />
                    <span>{item.name}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            {/* <motion.button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ rotate: isDarkMode ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <RiIcon className={`text-xl ${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'}`} />
            </motion.button> */}

            {/* Notifications */}
            <div className="relative">
              <motion.button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RiIcon className="ri-notification-line text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-charcoal animate-pulse"></span>
                )}
              </motion.button>

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

            {/* User Menu */}
            <div className="relative pl-4 border-l border-white/10">
              <motion.button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-1 pr-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CustomAvatar
                  src={userAvatar}
                  name={userName}
                  size={36}
                  className="rounded-full border-2 border-orange-500/20 group-hover:border-orange-500 transition-colors"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-bold text-white leading-none mb-0.5">
                    {userNameShort}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {getUserLevel() as string}
                  </p>
                </div>
                <RiIcon className="ri-arrow-down-s-line text-gray-400 group-hover:text-white transition-colors" />
              </motion.button>

              <UserMenuDropdown
                isOpen={showUserMenu}
                onClose={() => setShowUserMenu(false)}
                user={{
                  name: userName,
                  email: userEmail,
                  avatar: userAvatar as string,
                  type: getUserLevel() as string,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Hidden since we have Bottom Nav */}
      <div className="hidden md:hidden border-t border-white/5 bg-charcoal/95 backdrop-blur-xl">
        <div className="px-4 py-3">
          <div className="flex space-x-2 overflow-x-auto no-scrollbar">
            {navigationItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.Icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-linear-to-r from-orange-500 to-orange-600 text-black shadow-lg shadow-orange-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-white/5"
                  }`}
                >
                  <Icon size={16} color="currentColor" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
