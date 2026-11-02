"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@/src/lib/auth-client";

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    if (session) {
      router.replace("/home");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="size-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (session) return null;

  return <>{children}</>;
}
