"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import RiIcon from "@/components/ui/RiIcon";
import { currencies } from "@/src/data/currencies";

interface AdminTransferFormProps {
  user: Doc<"user">;
  accounts: Doc<"bank_accounts">[];
  onClose: () => void;
}

type TransferKind = "local" | "email" | "international";
type Step = "type" | "form" | "success";

const getCurrencySymbol = (code?: string) =>
  currencies.find((c) => c.code === code)?.symbol || "$";

const formatMoney = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const accountLabel = (a: Doc<"bank_accounts">) =>
  `${a.name} •••• ${a.number.slice(-4)} • ${formatMoney(a.balance ?? 0)} ${a.currency || "USD"}`;

const kinds: { id: TransferKind; label: string; desc: string; icon: string }[] =
  [
    {
      id: "local",
      label: "Local Transfer",
      desc: "Transfer to a local bank account",
      icon: "ri-bank-card-line",
    },
    {
      id: "email",
      label: "Send to Email",
      desc: "Transfer funds via email address",
      icon: "ri-mail-send-line",
    },
    {
      id: "international",
      label: "International Transfer",
      desc: "Send money abroad",
      icon: "ri-global-line",
    },
  ];

const inputClass =
  "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-colors";

export default function AdminTransferForm({
  user,
  accounts,
  onClose,
}: AdminTransferFormProps) {
  const [step, setStep] = useState<Step>("type");
  const [kind, setKind] = useState<TransferKind | null>(null);
  const [fromAccountInput, setFromAccountInput] = useState<string>(() =>
    accounts[0] ? accountLabel(accounts[0]) : "",
  );
  const [recipient, setRecipient] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const adminCreateTransfer = useMutation(api.admin.adminCreateTransfer);
  const createTransaction = useMutation(api.transactions.createTransaction);

  const fromAccount = useMemo(() => {
    const q = fromAccountInput.trim().toLowerCase();
    if (!q) return undefined;
    const byId = accounts.find((a) => a._id === fromAccountInput);
    if (byId) return byId;
    return accounts.find(
      (a) =>
        a.name.toLowerCase() === q ||
        a.number.toLowerCase() === q ||
        a.number.replace(/\s/g, "").slice(-4) === q ||
        accountLabel(a).toLowerCase() === q,
    );
  }, [accounts, fromAccountInput]);
  const symbol = getCurrencySymbol(fromAccount?.currency);

  const isEmailKind = kind === "email";
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.trim());
  const amountNum = parseFloat(amount);
  const amountValid =
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    (!fromAccount || amountNum <= (fromAccount.balance ?? 0));
  const canContinue =
    !!fromAccount &&
    recipient.trim().length > 0 &&
    (isEmailKind ? isEmailValid : true) &&
    amountValid;

  const resetForm = () => {
    setKind(null);
    setFromAccountInput(accounts[0] ? accountLabel(accounts[0]) : "");
    setRecipient("");
    setAccountName("");
    setAmount("");
    setNote("");
    setError(null);
  };

  const submit = async () => {
    if (!kind || !fromAccount || !canContinue || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const numAmount = parseFloat(amount);
      const result = await adminCreateTransfer({
        targetUserId: user.userId!,
        type: kind === "international" ? "currency" : kind,
        recipient: recipient.trim(),
        amount: numAmount,
        note: note.trim(),
        fromAccountId: fromAccount._id,
      });

      const merchant = accountName.trim() || recipient.trim();

      await createTransaction({
        userId: user.userId!,
        bankAccountId: fromAccount._id,
        description: `Transfer to ${merchant}`,
        amount: -numAmount,
        date: new Date().toISOString(),
        category: "Transfer",
        status: "completed",
        merchant,
        location: "Admin",
      });

      if (kind === "email" && result && "recipientUserId" in result) {
        const r = result as {
          recipientUserId?: string;
          recipientAccountId?: string;
          senderName?: string;
          senderEmail?: string;
        };
        if (r.recipientUserId && r.recipientAccountId) {
          await createTransaction({
            userId: r.recipientUserId,
            bankAccountId: r.recipientAccountId as Id<"bank_accounts">,
            description: `Transfer from ${r.senderEmail || "Sender"}`,
            amount: numAmount,
            date: new Date().toISOString(),
            category: "Transfer",
            status: "completed",
            merchant: r.senderName || "Sender",
            location: "Admin",
          });
        }
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {step === "type" && (
        <div className="space-y-3">
          {kinds.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => {
                setKind(k.id);
                setStep("form");
              }}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 transition-colors hover:border-slate-300 hover:bg-slate-50 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                <RiIcon className={`${k.icon} text-lg`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{k.label}</p>
                <p className="text-xs text-slate-400 truncate">{k.desc}</p>
              </div>
              <RiIcon className="ri-arrow-right-s-line text-slate-300 text-lg shrink-0" />
            </button>
          ))}
        </div>
      )}

      {step === "form" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setStep("type");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <RiIcon className="ri-arrow-left-line text-sm" />
              Change type
            </button>
            <span className="text-xs font-medium text-slate-500 capitalize">
              {kinds.find((k) => k.id === kind)?.label}
            </span>
          </div>

          {accounts.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm font-medium text-slate-900">
                No bank accounts
              </p>
              <p className="mt-1 text-xs text-slate-500">
                This user doesn&apos;t have any accounts to transfer from.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Source account
                </label>
                <input
                  type="text"
                  list="transfer-from-accounts"
                  value={fromAccountInput}
                  onChange={(e) => setFromAccountInput(e.target.value)}
                  onBlur={() =>
                    setFromAccountInput(
                      fromAccount
                        ? accountLabel(fromAccount)
                        : fromAccountInput.trim(),
                    )
                  }
                  placeholder="Search or pick an account"
                  className={`${inputClass} mt-1.5`}
                />
                <datalist id="transfer-from-accounts">
                  {accounts.map((a) => (
                    <option key={a._id} value={accountLabel(a)} />
                  ))}
                </datalist>
                {fromAccountInput.trim().length > 0 && !fromAccount && (
                  <p className="mt-1.5 text-xs text-red-500">
                    No matching account — pick one from the list
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  {isEmailKind ? "Recipient email" : "Recipient account"}
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder={
                    isEmailKind ? "name@example.com" : "Account number"
                  }
                  className={`${inputClass} mt-1.5 font-mono`}
                />
                {isEmailKind &&
                  recipient.trim().length > 0 &&
                  !isEmailValid && (
                    <p className="mt-1.5 text-xs text-red-500">
                      Enter a valid email address
                    </p>
                  )}
              </div>

              {!isEmailKind && (
                <div>
                  <label className="text-xs font-medium text-slate-500">
                    Account name
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Amount
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    {symbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={`${inputClass} pl-8 font-mono`}
                  />
                </div>
                {fromAccount && (
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Available: {symbol}
                    {formatMoney(fromAccount.balance ?? 0)}{" "}
                    {fromAccount.currency}
                  </p>
                )}
                {amountNum > 0 && !amountValid && (
                  <p className="mt-1.5 text-xs text-red-500">
                    Amount exceeds available balance
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={18}
                  placeholder="Add a note"
                  className={`${inputClass} mt-1.5`}
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={!canContinue || isSubmitting}
                onClick={submit}
                className="w-full py-3.5 bg-primary text-white font-medium rounded-xl transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RiIcon className="ri-loader-4-line animate-spin text-lg" />{" "}
                    Processing...
                  </>
                ) : (
                  <>
                    <span>Send transfer</span>
                    <RiIcon className="ri-arrow-right-line text-base" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <RiIcon className="ri-check-line text-2xl" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-900">
            Transfer complete
          </p>
          <p className="mt-1 text-xs text-slate-400 break-words">
            {symbol}
            {amount} sent from {user.firstName || user.email}&apos;s account.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
