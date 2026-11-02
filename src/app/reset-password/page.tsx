'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeClosed } from "@solar-icons/react-perf/Broken";
import { CheckCircle } from '@solar-icons/react-perf/Bold';
import { authClient } from "@/src/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { type } from "arktype";
import { cn } from "@/lib/utils";
import { AuthShell } from "@/src/components/auth/AuthShell";
import {
  AUTH_FIELD_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_TEXT_LINK_CLASS,
} from "@/src/components/auth/styles";

const ResetPasswordSchema = type({
  password: 'string',
  confirmPassword: 'string',
});

const EYE_BUTTON_CLASS =
  "absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-night/45 outline-none transition-colors hover:bg-night/5 hover:text-night focus-visible:ring-2 focus-visible:ring-signal";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setError(null);

      if (value.password !== value.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (!token) {
        setError("Invalid or missing reset token");
        return;
      }

      setIsLoading(true);
      await authClient.resetPassword(
        {
          newPassword: value.password,
          token: token,
        },
        {
          onSuccess: () => {
            setSuccess(true);
            setIsLoading(false);
            setTimeout(() => {
              router.push('/auth/signin');
            }, 2000);
          },
          onError: (ctx) => {
            setError(ctx.error.message);
            setIsLoading(false);
          }
        }
      );
    },
    validators: {
      onChange: ({ value }) => {
        const result = ResetPasswordSchema(value);
        const Errors = result instanceof type.errors
          ? result.summary.split("\n")
            .map((s) => s.replace(/^◦\s*/, "").trim())
          : [];
        return result instanceof type.errors ? Errors : undefined;
      },
    },
  });

  if (success) {
    return (
      <AuthShell
        eyebrow="Account recovery"
        title="Password updated"
        subtitle="Your new password is ready to use."
      >
        <div className="flex flex-col items-center py-4 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-signal/10 text-signal">
            <CheckCircle className="size-8" aria-hidden />
          </span>
          <p className="mt-5 text-sm leading-6 text-night/60">
            Redirecting you to sign in…
          </p>
          <Link href="/auth/signin" className={cn(AUTH_TEXT_LINK_CLASS, "mt-4 text-sm")}>
            Go to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Set a new password"
      subtitle="Choose a password you haven't used before."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col gap-5"
      >
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
          >
            <p>{error}</p>
          </div>
        ) : null}

        <form.Field
          name="password"
          children={(field) => (
            <div className="space-y-2">
              <label htmlFor="new-password" className={AUTH_LABEL_CLASS}>
                New password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={isVisible ? "text" : "password"}
                  autoComplete="new-password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="At least 8 characters"
                  className={cn(AUTH_FIELD_CLASS, "pr-12")}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setIsVisible((value) => !value)}
                  aria-label={isVisible ? "Hide password" : "Show password"}
                  className={EYE_BUTTON_CLASS}
                >
                  {isVisible ? (
                    <Eye className="size-5" aria-hidden />
                  ) : (
                    <EyeClosed className="size-5" aria-hidden />
                  )}
                </button>
              </div>
            </div>
          )}
        />

        <form.Field
          name="confirmPassword"
          children={(field) => {
            const mismatch =
              field.state.value.length > 0 &&
              field.state.value !== form.getFieldValue("password");

            return (
              <div className="space-y-2">
                <label htmlFor="confirm-password" className={AUTH_LABEL_CLASS}>
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={isConfirmVisible ? "text" : "password"}
                    autoComplete="new-password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Repeat your new password"
                    className={cn(AUTH_FIELD_CLASS, "pr-12")}
                    aria-invalid={mismatch ? true : undefined}
                    aria-describedby={mismatch ? "confirm-password-error" : undefined}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setIsConfirmVisible((value) => !value)}
                    aria-label={isConfirmVisible ? "Hide password" : "Show password"}
                    className={EYE_BUTTON_CLASS}
                  >
                    {isConfirmVisible ? (
                      <Eye className="size-5" aria-hidden />
                    ) : (
                      <EyeClosed className="size-5" aria-hidden />
                    )}
                  </button>
                </div>
                {mismatch ? (
                  <p id="confirm-password-error" className="text-xs font-medium text-red-600">
                    Passwords do not match
                  </p>
                ) : null}
              </div>
            );
          }}
        />

        <button
          type="submit"
          disabled={isLoading}
          className={cn(AUTH_PRIMARY_BUTTON_CLASS, "mt-1")}
        >
          {isLoading ? (
            <>
              <span
                aria-hidden
                className="size-4 animate-spin rounded-full border-2 border-night/40 border-t-transparent"
              />
              Resetting…
            </>
          ) : (
            "Reset password"
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell flex min-h-dvh items-center justify-center bg-night">
          <span
            aria-hidden
            className="size-8 animate-spin rounded-full border-2 border-signal border-t-transparent"
          />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
