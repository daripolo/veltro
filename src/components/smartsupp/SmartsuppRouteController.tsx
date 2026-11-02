"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function SmartsuppRouteController() {
  const pathname = usePathname();

  useEffect(() => {
    // Every time the route changes, hide the chat
    if (window.smartsupp) {
      window.smartsupp("chat:hide");
      window.smartsupp("chat:close");
    }
  }, [pathname]);

  return null;
}
