'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { Mail } from 'lucide-react';
import { api } from '@convex/_generated/api';
import { authClient } from '@/src/lib/auth-client';
import { cn } from '@/lib/utils';
import { AuthShell } from '@/src/components/auth/AuthShell';
import {
  AUTH_SECONDARY_BUTTON_CLASS,
  AUTH_TEXT_LINK_CLASS,
} from '@/src/components/auth/styles';

export default function VerifyEmailPage() {
  const authUser = useQuery(api.auth.getCurrentUser)
  const user = useQuery(api.user.user)
  const router = useRouter()
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSigningOut, setIsSigningOut] = useState(false);

  const required = [
    "firstName",
    "lastName",
    "country",
    "city",
    "address",
    "zipCode",
    "occupation",
    "currency",
    "language",
  ] as const;

  const isOnboarded =
    !!user &&
    required.every((k) => {
      const value = user[k];
      return typeof value === "string" && value.trim().length > 0;
    });

  useEffect(() => {
    if (authUser?.emailVerified === true && user && !isOnboarded) {
      router.replace("/onboarding");
    }
  }, [authUser?.emailVerified, user, isOnboarded, router]);

  const handleSwitchAccount = async (destination: "/auth/signin" | "/auth/signup") => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      router.push(destination);
    }
  };

  const handleResendEmail = async () => {
    if (!authUser?.email) return;

    setIsResending(true);
    setResendStatus('idle');

    try {
      await authClient.sendVerificationEmail({
        email: authUser.email,
        callbackURL: "/onboarding"
      });
      setResendStatus('success');
    } catch {
      setResendStatus('error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell
      eyebrow="One more step"
      title="Check your inbox"
      subtitle={
        <>
          We&apos;ve sent a verification link to{" "}
          {user?.email ? (
            <span className="font-medium text-night">{user.email}</span>
          ) : (
            "your email address"
          )}
          .
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-full bg-signal/10 text-signal">
          <Mail className="size-7" aria-hidden />
        </span>

        <p className="mt-5 text-sm leading-6 text-night/60">
          Click the link in the email to verify your account. If you don&apos;t see it, check your
          spam folder.
        </p>

        <div className="mt-7 w-full space-y-3">
          {user?.email ? (
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={isResending || resendStatus === 'success'}
              className={AUTH_SECONDARY_BUTTON_CLASS}
            >
              {isResending ? 'Sending…' : resendStatus === 'success' ? 'Email sent' : 'Resend email'}
            </button>
          ) : null}

          {resendStatus === 'error' ? (
            <p role="alert" className="text-xs font-medium text-red-600">
              Failed to resend the email. Please try again.
            </p>
          ) : null}
        </div>

        <div className="mt-8 w-full border-t border-night/10 pt-6">
          <p className="text-xs text-night/60">
            Wrong email or want to use a different account?
          </p>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <button
              type="button"
              onClick={() => handleSwitchAccount("/auth/signin")}
              disabled={isSigningOut}
              className={cn(AUTH_TEXT_LINK_CLASS, "text-sm disabled:opacity-50")}
            >
              {isSigningOut ? 'Signing out…' : 'Back to sign in'}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchAccount("/auth/signup")}
              disabled={isSigningOut}
              className={cn(AUTH_TEXT_LINK_CLASS, "text-sm disabled:opacity-50")}
            >
              Create a new account
            </button>
          </div>
          <p className="mt-4 text-xs text-night/60">
            Or go straight to{" "}
            <Link href="/auth/signin" className="font-medium text-night underline decoration-signal decoration-2 underline-offset-4 hover:text-signal">
              sign in
            </Link>
            .
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
