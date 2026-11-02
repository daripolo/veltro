"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@/src/lib/auth-client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      const signinUrl = new URL("/auth/signin", window.location.origin);
      signinUrl.searchParams.set("redirect", pathname);
      router.replace(signinUrl.toString());
    }
  }, [session, isPending, pathname, router]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F5F0E8]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
          <p className="text-sm text-stone-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
}
