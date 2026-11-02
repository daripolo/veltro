"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import RiIcon from "@/components/ui/RiIcon";

interface AdminAuthProps {
  onAuthenticated: () => void;
}

export default function AdminAuth({ onAuthenticated }: AdminAuthProps) {
  const isAdmin = useQuery(api.admin.isAdmin);

  useEffect(() => {
    if (isAdmin === true) {
      onAuthenticated();
    }
  }, [isAdmin, onAuthenticated]);

  if (isAdmin === undefined) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-500">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center text-red-500 mx-auto">
          <RiIcon className="ri-shield-user-line text-2xl" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Admin Access Required
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Your account is not registered as an admin. Please contact an administrator for access.
        </p>
        <p className="mt-4 text-xs text-slate-400">
          Signed in as: Check your ADMIN_EMAILS env var for authorized addresses.
        </p>
      </div>
    </div>
  );
}
