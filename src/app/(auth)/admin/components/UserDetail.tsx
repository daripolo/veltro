"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import RiIcon from "@/components/ui/RiIcon";
import { currencies } from "@/src/data/currencies";
import AdminTransferForm from "./AdminTransferForm";
import AdminTransactionForm from "./AdminTransactionForm";
import SignOutButton from "./SignOutButton";

interface UserDetailProps {
  user: Doc<"user">;
  onBack: () => void;
}

type ModalKind = "balance" | "ims" | "otp" | "transfer" | "transaction" | null;

const getCurrencySymbol = (code?: string) =>
  currencies.find((c) => c.code === code)?.symbol || "$";

const formatMoney = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl border border-slate-200 sm:rounded-2xl shadow-xl">
        <div className="sticky top-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 bg-white rounded-t-2xl sm:rounded-t-2xl z-10">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <RiIcon className="ri-close-line text-lg" />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export default function UserDetail({ user, onBack }: UserDetailProps) {
  const details = useQuery(api.admin.getUserDetails, { userId: user.userId! });
  const [modal, setModal] = useState<ModalKind>(null);
  const [copied, setCopied] = useState<"ims" | "otp" | null>(null);

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const initials =
    ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() ||
    (user.email?.[0] ?? "?").toUpperCase();

  const accounts = details?.accounts ?? [];
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);

  const copyCode = async (kind: "ims" | "otp") => {
    const code = kind === "ims" ? user.imsCode : user.otpCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const actions: {
    id: Exclude<ModalKind, null>;
    label: string;
    icon: string;
  }[] = [
    { id: "balance", label: "Balance", icon: "ri-wallet-3-line" },
    { id: "transfer", label: "Transfer", icon: "ri-send-plane-fill" },
    {
      id: "transaction",
      label: "Transaction",
      icon: "ri-exchange-dollar-line",
    },
    { id: "ims", label: "IMS Code", icon: "ri-lock-password-line" },
    { id: "otp", label: "OTP Code", icon: "ri-shield-check-line" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-12">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <RiIcon className="ri-arrow-left-line text-base" />
            Back to users
          </button>
          <SignOutButton />
        </div>

        <div className="mt-5 bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-slate-900 truncate">
                {fullName}
              </h1>
              <p className="text-sm text-slate-500 truncate">{user.email}</p>
            </div>
            <div className="w-full flex flex-wrap gap-2 sm:ml-auto sm:w-auto">
              {user.phonenumber && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                  <RiIcon className="ri-phone-line text-xs" />+
                  {user.phonenumber}
                </span>
              )}
              {user.country && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                  <RiIcon className="ri-map-pin-line text-xs" />
                  {user.country}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                <RiIcon className="ri-calendar-line text-xs" />
                Joined {formatDate(user._creationTime)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-3">
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setModal(a.id)}
              className="group flex flex-col items-center gap-3 p-5 sm:p-6 bg-white rounded-2xl border border-slate-100 transition-colors hover:border-orange-200 hover:bg-orange-50/30"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center transition-colors group-hover:bg-orange-50 group-hover:text-primary">
                <RiIcon className={`${a.icon} text-xl`} />
              </div>
              <span className="text-sm font-medium text-slate-900">
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {modal === "balance" && (
        <Modal title="Account balances" onClose={() => setModal(null)}>
          {details === undefined ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Total balance
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-slate-900">
                    {getCurrencySymbol(accounts[0]?.currency)}
                    {formatMoney(totalBalance)}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {accounts.length} accounts
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {accounts.length === 0 && (
                  <p className="py-4 text-center text-sm text-slate-400">
                    No bank accounts
                  </p>
                )}
                {accounts.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {a.name}
                      </p>
                      <p className="text-[11px] text-slate-400 capitalize">
                        {a.type} &bull; •••• {a.number.slice(-4)} &bull;{" "}
                        {a.currency || "—"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 shrink-0">
                      {getCurrencySymbol(a.currency)}
                      {formatMoney(a.balance ?? 0)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Modal>
      )}

      {modal === "ims" && (
        <Modal title="IMS code" onClose={() => setModal(null)}>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 mx-auto">
              <RiIcon className="ri-lock-password-line text-xl" />
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">
              Current IMS code
            </p>
            {user.imsCode ? (
              <p className="mt-2 text-2xl font-mono font-semibold tracking-[0.25em] text-slate-900">
                {user.imsCode}
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Not set yet</p>
            )}
            {user.imsCode && (
              <button
                type="button"
                onClick={() => copyCode("ims")}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                <RiIcon
                  className={
                    copied === "ims" ? "ri-check-line" : "ri-file-copy-line"
                  }
                />
                {copied === "ims" ? "Copied" : "Copy code"}
              </button>
            )}
            <p className="mt-4 text-[11px] text-slate-400">
              The code is regenerated each time the user requests a transfer.
            </p>
          </div>
        </Modal>
      )}

      {modal === "otp" && (
        <Modal title="OTP code" onClose={() => setModal(null)}>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 mx-auto">
              <RiIcon className="ri-shield-check-line text-xl" />
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">
              Current OTP code
            </p>
            {user.otpCode ? (
              <p className="mt-2 text-2xl font-mono font-semibold tracking-[0.25em] text-slate-900">
                {user.otpCode}
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Not set yet</p>
            )}
            {user.otpCode && (
              <button
                type="button"
                onClick={() => copyCode("otp")}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                <RiIcon
                  className={
                    copied === "otp" ? "ri-check-line" : "ri-file-copy-line"
                  }
                />
                {copied === "otp" ? "Copied" : "Copy code"}
              </button>
            )}
            <p className="mt-4 text-[11px] text-slate-400">
              The code is regenerated after IMS verification on each transfer.
            </p>
          </div>
        </Modal>
      )}

      {modal === "transaction" && (
        <Modal title="New transaction" onClose={() => setModal(null)}>
          {details === undefined ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : (
            <AdminTransactionForm
              user={user}
              accounts={accounts}
              onClose={() => setModal(null)}
            />
          )}
        </Modal>
      )}

      {modal === "transfer" && (
        <Modal title="New transfer" onClose={() => setModal(null)}>
          {details === undefined ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : (
            <AdminTransferForm
              user={user}
              accounts={accounts}
              onClose={() => setModal(null)}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
