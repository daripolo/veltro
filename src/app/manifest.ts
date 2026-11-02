import type { MetadataRoute } from "next";

const THEME_COLOR = "#F5F0E8";
const BG_COLOR = "#F5F0E8";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Veltro",
    short_name: "Veltro",
    description:
      "Banking, transfers and investments — your money, protected and in one place.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BG_COLOR,
    theme_color: THEME_COLOR,
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Transfers",
        short_name: "Transfer",
        description: "Send money to a local bank or contact",
        url: "/transfers",
      },
      {
        name: "Accounts",
        short_name: "Accounts",
        description: "Review your balances",
        url: "/accounts",
      },
      {
        name: "Transactions",
        short_name: "Activity",
        description: "See recent activity",
        url: "/transactions",
      },
    ],
  };
}