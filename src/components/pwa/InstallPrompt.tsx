"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  CloseCircle,
  DownloadMinimalistic,
  Share,
} from "@solar-icons/react-perf/Linear";

/** localStorage key so a dismissed banner stays dismissed. */
const DISMISSED_KEY = "veltro:pwa-install-dismissed";

/**
 * Routes where an install nudge is noise — the user is mid-signup or
 * mid-authentication and the last thing they need is a prompt.
 */
const EXCLUDED_PREFIXES = [
  "/auth",
  "/onboarding",
  "/verify-email",
  "/reset-password",
  "/admin",
];

type Platform = "native" | "ios" | null;

/** True when the app is already running as an installed PWA. */
function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari exposes standalone mode on navigator instead.
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as a Mac, so treat it as iOS when it claims touch support.
  const iPadOS = navigator.maxTouchPoints > 1 && /Macintosh/.test(ua);
  return iOSDevice || iPadOS;
}

/** iOS has no programmatic install, so we detect Safari and show instructions. */
function isIosSafari() {
  if (!isIos()) return false;
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
}

export default function InstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  // Tracked in state rather than read from localStorage during render, so the
  // server and client markup always agree.
  const [dismissed, setDismissed] = useState(false);

  const eligible =
    !!pathname && !EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Capture the install prompt so we can trigger it from our own UI, and pick
  // up the iOS case where no such event ever fires.
  useEffect(() => {
    if (isStandalone()) return;

    let cancelled = false;
    const stored = window.localStorage.getItem(DISMISSED_KEY) === "1";
    setDismissed(stored);

    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      // Stop Chrome showing its own mini-infobar.
      event.preventDefault();
      setDeferredPrompt(event);
      setPlatform("native");
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setPlatform(null);
      window.localStorage.setItem(DISMISSED_KEY, "1");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    let timer: number | undefined;
    if (isIosSafari() && !stored) {
      // Wait for the landing page to settle before nudging.
      timer = window.setTimeout(() => {
        if (!cancelled) setPlatform("ios");
      }, 4000);
    }

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
    setPlatform(null);
    setDeferredPrompt(null);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      setShowIosHelp(true);
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // Remember the decision either way — re-nagging someone who said no is rude.
    if (outcome !== "accepted") dismiss();
    setDeferredPrompt(null);
    setPlatform(null);
  }, [deferredPrompt, dismiss]);

  if (!eligible || dismissed || !platform || isStandalone()) return null;

  const isIosMode = platform === "ios";

  return (
    // Sits above the mobile bottom nav, which is roughly this tall plus the
    // home indicator inset.
    <div className="fixed inset-x-0 z-[60] flex justify-center px-4 pointer-events-none bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] lg:bottom-6">
      <div
        role="dialog"
        aria-label="Install Veltro"
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl"
      >
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-xl"
          />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">Add Veltro to your home screen</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {showIosHelp
                ? "Tap the Share button, then choose “Add to Home Screen”."
                : "Launch it full screen and get to your money faster, even on a bad connection."}
            </p>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <CloseCircle size={18} color="currentColor" />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={install}
            className="flex-1 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-700 active:scale-[0.98]"
          >
            {isIosMode && !showIosHelp ? "How to install" : "Install app"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            Not now
          </button>
        </div>

        {isIosMode && showIosHelp && (
          <ol className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <Share size={16} color="currentColor" className="shrink-0 text-orange-600" />
              Tap <strong className="font-semibold text-slate-800">Share</strong> in the Safari toolbar
            </li>
            <li className="flex items-center gap-2">
              <DownloadMinimalistic size={16} color="currentColor" className="shrink-0 text-orange-600" />
              Scroll to <strong className="font-semibold text-slate-800">“Add to Home Screen”</strong>
            </li>
            <li className="flex items-center gap-2">
              <span className="ml-0.5 h-4 w-4 shrink-0 rounded-full bg-orange-600 text-center text-[10px] leading-4 font-bold text-white">
                3
              </span>
              Tap <strong className="font-semibold text-slate-800">Add</strong>
            </li>
          </ol>
        )}
      </div>
    </div>
  );
}