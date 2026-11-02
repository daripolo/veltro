
import type { Viewport } from "next";
import { api } from "@/convex/_generated/api";
import { fetchAuthQuery } from "@/src/lib/auth-server";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";

// The marketing page is a dark editorial canvas, unlike the light dashboard.
export const viewport: Viewport = {
  themeColor: "#0B0B0B",
};

export default async function LandingLayout({ children }: PropsWithChildren) {
  const identity = await fetchAuthQuery(api.auth.getCurrentUser, {});
  if (!identity) {
    return <>{children}</>;
  }

  if (identity.emailVerified !== true) {
    redirect("/verify-email");
  }
  const user = await fetchAuthQuery(api.user.user, {});
  const required = [
    "firstName",
    "lastName",
    "country",
    "city",
    "address",
    "zipCode",
    "occupation",
    "currency",
    "language",
  ] as const;

  const isOnboarded =
    !!user &&
    required.every((k) => {
      const value = user[k];
      return typeof value === "string" && value.trim().length > 0;
    });

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  redirect("/home");
}
