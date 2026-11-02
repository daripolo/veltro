"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import RiIcon from "@/components/ui/RiIcon";
import { currencies } from "@/src/data/currencies";

interface AdminTransactionFormProps {
  user: Doc<"user">;
  accounts: Doc<"bank_accounts">[];
  onClose: () => void;
}

type Step = "form" | "success";
type TxType = "credit" | "debit";

const getCurrencySymbol = (code?: string) =>
  currencies.find((c) => c.code === code)?.symbol || "$";

const formatMoney = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const accountLabel = (a: Doc<"bank_accounts">) =>
  `${a.name} •••• ${a.number.slice(-4)} • ${formatMoney(a.balance ?? 0)} ${a.currency || "USD"}`;

const categories = [
  "Deposit",
  "Withdrawal",
  "Transfer",
  "Shopping",
  "Food",
  "Entertainment",
  "Utilities",
  "Salary",
  "Crypto",
  "Other",
];

const statuses = ["completed", "pending", "failed"];

const inputClass =
  "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-colors";

const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function AdminTransactionForm({
  user,
  accounts,
  onClose,
}: AdminTransactionFormProps) {
  const [step, setStep] = useState<Step>("form");
  const [type, setType] = useState<TxType>("credit");
  const [accountInput, setAccountInput] = useState<string>(() =>
    accounts[0] ? accountLabel(accounts[0]) : "",
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => toDateInput(new Date()));
  const [category, setCategory] = useState("Deposit");
  const [status, setStatus] = useState("completed");
  const [merchant, setMerchant] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const adminCreateTransaction = useMutation(api.admin.adminCreateTransaction);

  const account = useMemo(() => {
    const q = accountInput.trim().toLowerCase();
    if (!q) return undefined;
    const byId = accounts.find((a) => a._id === accountInput);
    if (byId) return byId;
    return accounts.find(
      (a) =>
        a.name.toLowerCase() === q ||
        a.number.toLowerCase() === q ||
        a.number.replace(/\s/g, "").slice(-4) === q ||
        accountLabel(a).toLowerCase() === q,
    );
  }, [accounts, accountInput]);
  const symbol = getCurrencySymbol(account?.currency);

  const amountNum = parseFloat(amount);
  const amountValid = Number.isFinite(amountNum) && amountNum > 0;
  const balanceValid =
    type === "credit" || !account || amountNum <= (account.balance ?? 0);
  const canSubmit =
    !!account &&
    description.trim().length > 0 &&
    amountValid &&
    balanceValid &&
    !isSubmitting;

  const resetForm = () => {
    setType("credit");
    setAccountInput(accounts[0] ? accountLabel(accounts[0]) : "");
    setAmount("");
    setDescription("");
    setDate(toDateInput(new Date()));
    setCategory("Deposit");
    setStatus("completed");
    setMerchant("");
    setLocation("");
    setError(null);
  };

  const submit = async () => {
    if (!account || !canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const numAmount = parseFloat(amount);
      await adminCreateTransaction({
        targetUserId: user.userId!,
        bankAccountId: account._id,
        amount: type === "credit" ? numAmount : -numAmount,
        description: description.trim(),
        date: new Date(date).toISOString(),
        category,
        status,
        merchant: merchant.trim(),
        location: location.trim(),
      });
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {step === "form" && (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-slate-500">Type</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(
                [
                  {
                    id: "credit",
                    label: "Credit",
                    icon: "ri-arrow-down-line",
                    tone: "text-emerald-600 bg-emerald-50",
                  },
                  {
                    id: "debit",
                    label: "Debit",
                    icon: "ri-arrow-up-line",
                    tone: "text-red-600 bg-red-50",
                  },
                ] as { id: TxType; label: string; icon: string; tone: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    type === t.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <RiIcon
                    className={`${t.icon} ${type === t.id ? "text-white" : t.tone}`}
                  />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {accounts.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm font-medium text-slate-900">
                No bank accounts
              </p>
              <p className="mt-1 text-xs text-slate-500">
                This user doesn&apos;t have any accounts to add a transaction
                to.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Account
                </label>
                <input
                  type="text"
                  list="transaction-accounts"
                  value={accountInput}
                  onChange={(e) => setAccountInput(e.target.value)}
                  onBlur={() =>
                    setAccountInput(
                      account ? accountLabel(account) : accountInput.trim(),
                    )
                  }
                  placeholder="Search or pick an account"
                  className={`${inputClass} mt-1.5`}
                />
                <datalist id="transaction-accounts">
                  {accounts.map((a) => (
                    <option key={a._id} value={accountLabel(a)} />
                  ))}
                </datalist>
                {accountInput.trim().length > 0 && !account && (
                  <p className="mt-1.5 text-xs text-red-500">
                    No matching account — pick one from the list
                  </p>
                )}
              </div>

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
                {account && (
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Available: {symbol}
                    {formatMoney(account.balance ?? 0)} {account.currency}
                  </p>
                )}
                {type === "debit" && amountNum > 0 && !balanceValid && (
                  <p className="mt-1.5 text-xs text-red-500">
                    Amount exceeds available balance
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Manual deposit"
                  className={`${inputClass} mt-1.5`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`${inputClass} mt-1.5`}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={`${inputClass} mt-1.5 capitalize`}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`${inputClass} mt-1.5 capitalize`}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="capitalize">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">
                    Merchant
                  </label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="e.g. Cash deposit"
                    className={`${inputClass} mt-1.5`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Branch, Admin"
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
                disabled={!canSubmit}
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
                    <span>Create transaction</span>
                    <RiIcon className="ri-arrow-right-line text-base" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="w-full py-2.5 text-xs font-medium text-slate-400 hover:text-slate-900 transition-colors"
              >
                Cancel
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
            Transaction created
          </p>
          <p className="mt-1 text-xs text-slate-400 break-words">
            {type === "credit" ? "+" : "-"}
            {symbol}
            {formatMoney(amountNum)} {account?.currency} on{" "}
            {account?.name || "account"}.
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
