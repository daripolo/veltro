"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import RiIcon from "@/components/ui/RiIcon";
import SignOutButton from "./components/SignOutButton";
import UserDetail from "./components/UserDetail";

function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-12">
        <div className="h-8 w-48 bg-white rounded-xl animate-pulse mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center text-red-500 mx-auto">
          <RiIcon className="ri-shield-user-line text-2xl" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Access Denied
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          You don&apos;t have permission to access the admin panel. Contact an administrator for access.
        </p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const isAdmin = useQuery(api.admin.isAdmin);
  const allUsers = useQuery(api.admin.getAllUsers);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Doc<"user"> | null>(null);

  if (isAdmin === undefined) return <AdminSkeleton />;
  if (!isAdmin) return <AccessDenied />;

  if (selectedUser) {
    return (
      <UserDetail
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  const filtered = allUsers?.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    return name.includes(q) || (u.email || "").toLowerCase().includes(q);
  }) ?? [];

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-12">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <RiIcon className="ri-shield-check-line text-primary text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
              <p className="text-xs text-slate-500">
                {allUsers ? `${filtered.length} of ${allUsers.length} accounts` : "Loading..."}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>

        <div className="relative mb-5">
          <RiIcon className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-colors"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <RiIcon className="ri-user-search-line text-3xl text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-500">No users found</p>
            </div>
          )}
          <AnimatePresence>
            {filtered.map((u) => {
              const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
              const initials =
                ((u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? "")).toUpperCase() ||
                (u.email?.[0] ?? "?").toUpperCase();

              return (
                <motion.button
                  key={u._id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  type="button"
                  onClick={() => u.userId && setSelectedUser(u)}
                  disabled={!u.userId}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-semibold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {fullName}
                      </p>
                      {!u.userId && (
                        <span className="text-[10px] font-semibold bg-slate-900 text-white px-2 py-0.5 rounded-full shrink-0">
                          Not linked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {u.phonenumber && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
                        <RiIcon className="ri-phone-line text-[9px]" />+{u.phonenumber}
                      </span>
                    )}
                    {u.country && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
                        <RiIcon className="ri-map-pin-line text-[9px]" />{u.country}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(u._creationTime).toLocaleDateString()}
                    </span>
                  </div>
                  {u.userId && (
                    <RiIcon className="ri-arrow-right-s-line text-slate-300 text-lg shrink-0" />
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
