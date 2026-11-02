"use client";

import { JSX, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeClosed, DangerTriangle } from "@solar-icons/react-perf/Linear";
import { authClient } from "@/src/lib/auth-client";
import { brand } from "@/src/components/landing/landing-config";
import { cn } from "@/lib/utils";
import {
  AUTH_FIELD_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_SECONDARY_BUTTON_CLASS,
  AUTH_TEXT_LINK_CLASS,
} from "@/src/components/auth/styles";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "An unexpected error occurred."
}

function getNameFromEmail(email: string): string {
  const namePart = email.split("@")[0]
  return namePart?.trim() || "User"
}

export default function SignUpPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (loading) return
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name: getNameFromEmail(email),
      });

      if (result.error) {
        setError(result.error.message || "Failed to create account");
        setLoading(false);
      } else {
        router.push("/home");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async (): Promise<void> => {
    if (loading) return
    setError("");
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/home"
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="w-full motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-night/60">
        Get started
      </p>
      <h2 className="mt-3 text-[clamp(1.9rem,3.2vw,2.5rem)] font-medium leading-[1.05] tracking-[-0.035em] text-night">
        Create your {brand.name} account
      </h2>
      <p className="mt-3 text-sm leading-6 text-night/60">
        Open an account in minutes — no branch visit, no paperwork to post.
      </p>

      <div className="mt-7 h-px w-full bg-night/10" />

      {error ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          <DangerTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      ) : null}

      <form onSubmit={handleSignUp} className="mt-6 flex flex-col gap-5">
        <div className="space-y-2">
          <label htmlFor="signup-email" className={AUTH_LABEL_CLASS}>
            Email
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={AUTH_FIELD_CLASS}
            aria-invalid={error ? true : undefined}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-password" className={AUTH_LABEL_CLASS}>
            Create a password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={cn(AUTH_FIELD_CLASS, "pr-12")}
              aria-invalid={error ? true : undefined}
              aria-describedby="signup-password-hint"
              required
              disabled={loading}
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-night/45 outline-none transition-colors hover:bg-night/5 hover:text-night focus-visible:ring-2 focus-visible:ring-signal"
            >
              {showPassword ? (
                <EyeClosed className="size-5" aria-hidden />
              ) : (
                <Eye className="size-5" aria-hidden />
              )}
            </button>
          </div>
          <p id="signup-password-hint" className="text-xs leading-5 text-night/60">
            Use 8 characters or more.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className={cn(AUTH_PRIMARY_BUTTON_CLASS, "mt-1")}
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-night/10" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-night/60">
          or
        </span>
        <span className="h-px flex-1 bg-night/10" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={loading}
        className={cn(AUTH_SECONDARY_BUTTON_CLASS, "mt-5")}
      >
        <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>

      <p className="mt-7 text-center text-sm text-night/60">
        Already have an account?{" "}
        <Link href={brand.signInHref} className={AUTH_TEXT_LINK_CLASS}>
          Log in
        </Link>
      </p>
    </div>
  );
}
