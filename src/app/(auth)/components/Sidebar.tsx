"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Widget6Linear,
  WalletLinear,
  TransferVerticalLinear,
  SettingsLinear,
  LogoutLinear,
  CardLinear,
  DollarLinear,
  TransferHorizontalLinear,
  Chart2Linear,
  ShieldLinear,
  BellLinear,
  PhoneLinear,
} from "@solar-icons/react-perf";
import { cn } from "@/lib/utils";
import { authClient } from "@/src/lib/auth-client";
import { brand, BrandMark } from "@/src/components/landing/landing-config";

export const NAV_ITEMS = [
  { name: "Home", href: "/home", icon: Widget6Linear },
  { name: "Accounts", href: "/accounts", icon: WalletLinear },
  { name: "Cards", href: "/cards", icon: CardLinear },
  { name: "Transfers", href: "/transfers", icon: TransferVerticalLinear },
  { name: "Deposit", href: "/deposit", icon: DollarLinear },
  { name: "Convert", href: "/convert", icon: TransferHorizontalLinear },
  { name: "Loans", href: "/loans", icon: ShieldLinear },
];

export const SECONDARY_ITEMS = [
  { name: "Settings", href: "/settings", icon: SettingsLinear },
  { name: "Support", href: "/support", icon: PhoneLinear },
];

export function SidebarBrand() {
  return (
    <Link
      href="/home"
      aria-label={`${brand.name} home`}
      className="mb-6 inline-flex w-fit items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
    >
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-[10px] bg-orange-600 text-black"
      >
        <BrandMark className="size-4" strokeWidth={2.25} />
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900">{brand.name}</span>
    </Link>
  );
}

export function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      router.replace("/auth/signin");
      router.refresh();
      setIsSigningOut(false);
    }
  };

  return (
    <>
      {/* Main Nav */}
      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group",
                isActive
                  ? "bg-primary text-white"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="space-y-0.5 pt-5 border-t border-slate-100">
        {SECONDARY_ITEMS.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all group"
          >
            <item.icon className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
            <span className="font-medium text-sm">{item.name}</span>
          </Link>
        ))}

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group w-full"
        >
          <LogoutLinear className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
          <span className="font-medium text-sm">{isSigningOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-60 h-screen bg-white border-r border-slate-100 flex-col p-5 sticky top-0">
      <SidebarBrand />
      <SidebarLinks />
    </aside>
  );
}
