import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { internalAction, query } from "./_generated/server";
import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";
import { Resend } from "resend";
import { betterAuth, type BetterAuthOptions } from "better-auth/minimal";


// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
    verbose: false,
  },
);

const siteUrl = process.env.SITE_URL || "http://localhost:3001"

function baseEmailHtml(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:16px;background-color:#0f0f0f;font-family:Inter,system-ui,sans-serif;color:#ffffff">
  <table align="center" role="presentation" style="max-width:465px;margin:40px auto;background-color:#1a1a1a;border-radius:8px;padding:24px;border:1px solid rgba(255,255,255,0.1)">
    <tr><td style="text-align:center;padding-bottom:24px">
      <span style="font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:0.5px">Veltro</span>
    </td></tr>
    ${content}
    <tr><td><hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:20px 0"></td></tr>
    <tr><td style="color:#A1A1AA;font-size:12px;text-align:center">© ${new Date().getFullYear()} Veltro. All rights reserved.</td></tr>
  </table>
</body>
</html>`;
}

function verifyEmailHtml(name: string, url: string): string {
  return baseEmailHtml(`
    <tr><td style="font-size:24px;font-weight:400;text-align:center;padding:24px 0;color:#ffffff">Verify your email address</td></tr>
    <tr><td style="color:#A1A1AA;font-size:14px;padding-bottom:8px">Hello ${name},</td></tr>
    <tr><td style="color:#A1A1AA;font-size:14px;padding-bottom:24px">Thanks for starting the Veltro account creation process. Please verify your email to continue.</td></tr>
    <tr><td style="text-align:center;padding:32px 0">
      <a href="${url}" style="background-color:#ea580c;color:#0b0b0b;padding:12px 22px;border-radius:6px;font-size:14px;font-weight:500;text-decoration:none;display:inline-block">Verify Email Address</a>
    </td></tr>
    <tr><td style="color:#A1A1AA;font-size:12px">This email was intended for <span style="color:#ffffff">${name}</span>.</td></tr>
  `);
}

function resetPasswordHtml(name: string, url: string): string {
  return baseEmailHtml(`
    <tr><td style="font-size:24px;font-weight:400;text-align:center;padding:24px 0;color:#ffffff">Reset your password</td></tr>
    <tr><td style="color:#A1A1AA;font-size:14px;padding-bottom:8px">Hello ${name},</td></tr>
    <tr><td style="color:#A1A1AA;font-size:14px;padding-bottom:16px">Someone recently requested a password change for your Veltro account. If this was you, you can set a new password here:</td></tr>
    <tr><td style="text-align:center;padding:32px 0">
      <a href="${url}" style="background-color:#ea580c;color:#0b0b0b;padding:12px 22px;border-radius:6px;font-size:14px;font-weight:500;text-decoration:none;display:inline-block">Reset password</a>
    </td></tr>
    <tr><td style="color:#A1A1AA;font-size:14px;padding-bottom:16px">If you don't want to change your password or didn't request this, just ignore and delete this message.</td></tr>
    <tr><td style="color:#A1A1AA;font-size:12px">To keep your account secure, please don't forward this email to anyone.</td></tr>
  `);
}

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    baseURL: siteUrl,
    trustedOrigins: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "https://finguardonline.com",
    ],
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        const resend = new Resend(process.env.RESEND_API_KEY!);
        const html = resetPasswordHtml(user.name, url);
        await resend.emails.send({
          from: "Veltro <onboarding@arxforthdigital.com>",
          to: user.email,
          subject: "Reset your password",
          html,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        const resend = new Resend(process.env.RESEND_API_KEY!);
        const html = verifyEmailHtml(user.name, url);
        await resend.emails.send({
          from: "Veltro <onboarding@arxforthdigital.com>",
          to: user.email,
          subject: "Verify your email",
          html,
        });
      },
    },
    plugins: [
      convex({ authConfig }),
    ],
  }  satisfies BetterAuthOptions;
};


export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth(createAuthOptions(ctx));

export const { getAuthUser } = authComponent.clientApi();

export const rotateKeys = internalAction({
  args: {},
  handler: async (ctx) => {
    const auth = createAuth(ctx);
    return auth.api.rotateKeys();
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.safeGetAuthUser(ctx);
  },
});
