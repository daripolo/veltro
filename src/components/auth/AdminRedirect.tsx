"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Admins should land in the admin console instead of the customer dashboard.
 * The query is reactive, so this also covers the brief window right after
 * sign-in when Convex has not attached the auth token yet.
 */
export default function AdminRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = useQuery(
    api.admin.isAdmin,
    pathname === "/home" ? {} : "skip",
  );

  useEffect(() => {
    if (isAdmin === true) {
      router.replace("/admin");
    }
  }, [isAdmin, router]);

  return null;
}
