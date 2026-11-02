"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import RiIcon from "@/components/ui/RiIcon";

export default function SignOutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  return (
    <button
      type="button"
      disabled={isSigningOut}
      onClick={async () => {
        if (isSigningOut) return;
        setIsSigningOut(true);
        try {
          await authClient.signOut();
        } finally {
          router.replace("/auth/signin");
          router.refresh();
          setIsSigningOut(false);
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <RiIcon className={isSigningOut ? "ri-loader-4-line animate-spin" : "ri-logout-box-r-line"} />
      {isSigningOut ? "Signing out..." : "Sign out"}
    </button>
  );
}
