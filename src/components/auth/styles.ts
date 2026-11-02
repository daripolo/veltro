/**
 * Shared class strings for the auth surfaces (sign in, sign up, reset password,
 * verify email). Keeping them here means every field and button stays in sync.
 */

export const AUTH_FIELD_CLASS =
  "w-full rounded-2xl border border-night/20 bg-white px-4 py-3.5 text-sm font-medium text-night shadow-[0_1px_0_rgba(11,11,11,0.03)] outline-none transition placeholder:text-night/50 focus:border-signal focus:ring-2 focus:ring-signal/25 disabled:cursor-not-allowed disabled:opacity-60"

export const AUTH_LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-[0.16em] text-night/60"

export const AUTH_TEXT_LINK_CLASS =
  "rounded-sm font-semibold text-night underline decoration-signal decoration-2 underline-offset-4 outline-none transition-colors hover:text-signal focus-visible:ring-2 focus-visible:ring-signal"

export const AUTH_PRIMARY_BUTTON_CLASS =
  "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-signal px-4 py-3.5 text-sm font-semibold text-night outline-none transition-colors hover:bg-signal-bright focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50"

export const AUTH_SECONDARY_BUTTON_CLASS =
  "inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-night/20 bg-white px-4 py-3.5 text-sm font-semibold text-night outline-none transition-colors hover:border-night/35 hover:bg-paper-deep/50 focus-visible:ring-2 focus-visible:ring-signal disabled:cursor-not-allowed disabled:opacity-50"
