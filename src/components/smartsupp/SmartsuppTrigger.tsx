"use client";

import { usePathname } from "next/navigation";
import { useSmartsupp } from "./useSmartsupp";

const ENABLED_ROUTES = [
    "/support",
];

export default function SmartsuppTrigger() {
    const pathname = usePathname();
    const { open } = useSmartsupp();

    const enabled = ENABLED_ROUTES.some(route =>
        pathname.startsWith(route)
    );

    if (!enabled) return null;

    return (
        <button
            onClick={open}
            className="w-full py-2 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            Start Chat
        </button>
    );
}
