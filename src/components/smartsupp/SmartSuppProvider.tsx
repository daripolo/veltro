"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    _smartsupp: any;
    smartsupp: (...args: any[]) => void;
  }
}

const KEY = "220bfd42a3287e0287321cdb36bae08fb9d0f0c2";

export default function SmartsuppProvider() {
  useEffect(() => {
    if (typeof window.smartsupp === "function") {
      window.smartsupp("chat:hide");
      return;
    }

     window._smartsupp = window._smartsupp || {};
    window._smartsupp.key = KEY;

    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.smartsuppchat.com/loader.js?";
    s.onload = () => {
      // hide immediately when ready
      window.smartsupp?.("chat:hide");
    };

    document.body.appendChild(s);
  }, []);


  return null;
}
