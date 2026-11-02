/**
 * Type definitions for the PWA install flow.
 *
 * `BeforeInstallPromptEvent` is not part of lib.dom yet, so declare it here.
 */

interface BeforeInstallPromptEvent extends Event {
  /** Show the browser's native install dialog. */
  prompt(): Promise<void>;
  /** Whether the user has already dismissed the native prompt. */
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}