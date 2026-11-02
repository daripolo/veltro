import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { fetchAuthQuery } from "@/src/lib/auth-server";
import { AuthShell } from "@/src/components/auth/AuthShell";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const identity = await fetchAuthQuery(api.auth.getCurrentUser, {});

  if (!identity || identity.emailVerified !== true) {
    return <AuthShell>{children}</AuthShell>;
  }

  // Verified users don't need auth pages — send them forward.
  // Unverified users are allowed to stay so they can switch accounts
  // via /auth/signin and /auth/signup instead of being trapped on /verify-email.
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
