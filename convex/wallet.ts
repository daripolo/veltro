import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUserByAddress = query({
  args: { address: v.string(), secret: v.string() },
  handler: async (ctx, { address, secret }) => {
    if (!process.env.WEBHOOK_SHARED_SECRET) {
      throw new Error("Missing WEBHOOK_SHARED_SECRET");
    }
    if (secret !== process.env.WEBHOOK_SHARED_SECRET) return null;

    const needle = address.trim();
    const needleHexLower = needle.startsWith("0x") ? needle.toLowerCase() : null;
    const vaults = await ctx.db.query("crypto_vaults").collect();

    for (const vault of vaults) {
      const addresses = vault.addresses ?? {};
      for (const addr of Object.values(addresses)) {
        const stored = String(addr).trim();
        if (stored === needle) {
          return vault;
        }
        if (
          needleHexLower &&
          stored.startsWith("0x") &&
          stored.toLowerCase() === needleHexLower
        ) {
          return vault;
        }
      }
    }

    return null;
  },
});

export const listVaultAddressesForChains = query({
  args: { chains: v.array(v.string()), secret: v.string() },
  handler: async (ctx, { chains, secret }) => {
    if (!process.env.WEBHOOK_SHARED_SECRET) {
      throw new Error("Missing WEBHOOK_SHARED_SECRET");
    }
    if (secret !== process.env.WEBHOOK_SHARED_SECRET) return [];

    const wanted = new Set(chains.map((c) => c.trim()).filter(Boolean));
    const vaults = await ctx.db.query("crypto_vaults").collect();

    const out: Array<{ userId: string; chain: string; address: string }> = [];
    for (const vault of vaults) {
      const addresses = vault.addresses ?? {};
      for (const [chain, address] of Object.entries(addresses)) {
        if (!wanted.has(chain)) continue;
        out.push({ userId: vault.userId, chain, address });
      }
    }

    return out;
  },
});
