
import { PropsWithChildren } from "react";
import type { Metadata } from "next";
import { fetchAuthQuery } from "@/src/lib/auth-server";
import { redirect } from "next/navigation";
import { Sidebar } from "./components/Sidebar";
import { TopHeader } from "./components/TopHeader";
import MobileBottomNav from "@/components/feature/MobileBottomNav";
import { api } from "@/convex/_generated/api";

// Authenticated screens must never appear in search results.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};


export default async function DashboardLayout({ children }: PropsWithChildren) {
  // 1️⃣ Fetch current user identity and profile from Convex
  const identity = await fetchAuthQuery(api.auth.getCurrentUser, {});
  const user = await fetchAuthQuery(api.user.user, {});
  // 2️⃣ Not logged in → redirect to sign-in
  if (!identity) {
    redirect("/auth/signin");
  }

  // 3️⃣ Email not verified → redirect to verify page
  if (identity.emailVerified === false) {
    redirect("/verify-email");
  }

  // 4️⃣ Check onboarding completion

  const required = [
    "firstName",
    "lastName",
    "country",
    "city",
    "address",
    "zipCode",
    "occupation",
    "currency",
    "language",
  ] as const;

  const isOnboarded =
    !!user &&
    required.every((k) => {
      const value = user[k];
      return typeof value === "string" && value.trim().length > 0;
    });

  // 5️⃣ Not onboarded → redirect to onboarding
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  // ✅ All checks passed, render dashboard content
  return (
    <div className="flex bg-[#F5F0E8] h-dvh">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <TopHeader />
        <div className="flex-1 min-h-0 min-w-0 w-full overflow-y-auto overflow-x-hidden">
          <main className="p-4 pb-24 lg:pb-6 w-full max-w-(--breakpoint-2xl) mx-auto overflow-hidden">
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
