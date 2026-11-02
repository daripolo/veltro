"use client";

export function useSmartsupp() {
  const open = () => window.smartsupp?.("chat:open");
  const close = () => window.smartsupp?.("chat:close");
  const hide = () => window.smartsupp?.("chat:hide");
  const show = () => window.smartsupp?.("chat:show");

  return { open, close, hide, show };
}
