"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that powers offline support.
 *
 * Two deliberate choices here:
 *
 * 1. Registration is skipped in development. A cached service worker will
 *    happily serve stale bundles while you're editing, which is far more
 *    confusing than it is helpful. Build and `npm start` to test it, or set
 *    NEXT_PUBLIC_PWA_ENABLED=true in a dev build.
 *
 * 2. Updates are never forced. The worker does not call skipWaiting() during
 *    install, and we never reload the page on update. A new version takes over
 *    the next time the app is opened fresh, so nobody gets yanked out of a
 *    half-finished transfer.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const isDev = process.env.NODE_ENV === "development";
    const forced = process.env.NEXT_PUBLIC_PWA_ENABLED === "true";
    if (isDev && !forced) {
      console.info("[pwa] Service worker disabled in development.");
      return;
    }

    let registration: ServiceWorkerRegistration | undefined;

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        registration.addEventListener("updatefound", () => {
          const installing = registration?.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              console.info(
                "[pwa] Update downloaded — it will be used the next time the app opens."
              );
            }
          });
        });
      } catch (error) {
        console.warn("[pwa] Service worker registration failed:", error);
      }
    };

    // Check for a new version when the tab returns to the foreground, so a
    // deploy is picked up even if the app stays open all day.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void registration?.update();
    };

    // Registering during page load competes with the app's own requests.
    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("load", register);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}