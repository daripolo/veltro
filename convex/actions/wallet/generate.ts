"use node";
import { v } from "convex/values";
import { action } from "../../_generated/server";
import { getWalletCore } from "../../walletcore";
import { chainNetworkInfo, supportedChains, type SupportedChain } from "./chains";
import { createCipheriv, randomBytes } from "crypto";
import { anyApi } from "convex/server";

function requireVaultKey(): Buffer {
  const raw = process.env.WALLET_VAULT_KEY;
  if (!raw) {
    throw new Error("Missing WALLET_VAULT_KEY");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("WALLET_VAULT_KEY must be 32 bytes base64");
  }
  return key;
}

function encryptVaultJson(plaintextJson: string) {
  const key = requireVaultKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintextJson, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    alg: "A256GCM",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ct: ciphertext.toString("base64"),
  };
}

function privateKeyHexForChain(
  wc: Awaited<ReturnType<typeof getWalletCore>>,
  wallet: any,
  chain: SupportedChain
) {
  const coinType = coinTypeForChain(wc, chain);
  const privateKey = wallet.getKeyForCoin(coinType);
  return Buffer.from(privateKey.data()).toString("hex");
}
function coinTypeForChain(
  wc: Awaited<ReturnType<typeof getWalletCore>>,
  chain: SupportedChain
) {
  switch (chain) {
    case "ethereum":
    case "usdt-ethereum":
    case "usdc-ethereum":
    case "dai-ethereum":
      return wc.CoinType.ethereum;
    case "smartchain":
    case "bnb":
      return wc.CoinType.smartChain;
    case "bitcoin":
      return wc.CoinType.bitcoin;
    case "solana":
      return wc.CoinType.solana;
    case "tron":
    case "usdt-tron":
      return wc.CoinType.tron;
    case "xrp":
      return wc.CoinType.xrp;
    case "atom":
      return wc.CoinType.cosmos;
    case "sei":
      return wc.CoinType.sei;
    case "inj":
      return wc.CoinType.nativeInjective;
    case "ton":
      return wc.CoinType.ton;
    case "polkadot":
      return wc.CoinType.polkadot;
    case "doge":
      return wc.CoinType.dogecoin;
    case "litecoin":
      return wc.CoinType.litecoin;
    case "polygon":
    case "usdt-polygon":
    case "usdc-polygon":
      return wc.CoinType.polygon;
    default: {
      const _never: never = chain;
      throw new Error(`Unsupported chain: ${chain}`);
    }
  }
}

/* ─────────────────────────────────────────────────────────────
   Generate wallet (manual / debug use)
───────────────────────────────────────────────────────────── */

export const generateWallet = action({
  args: {
    words: v.optional(v.union(v.literal(12), v.literal(24))),
  },
  returns: v.object({
    mnemonic: v.string(),
    seedHex: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const wc = await getWalletCore();
    const strength = args.words === 24 ? 256 : 128;

    const wallet = wc.HDWallet.create(strength, "");
    try {
      const mnemonic = wallet.mnemonic();
      const seedHex = Buffer.from(wallet.seed()).toString("hex");
      return { mnemonic, seedHex };
    } finally {
      wallet.delete();
    }
  },
});

/* ─────────────────────────────────────────────────────────────
   Provision user crypto vault (PRODUCTION)
───────────────────────────────────────────────────────────── */

export const provisionUserCryptoVault = action({
  args: {},
  returns: v.object({
    created: v.boolean(),
    addresses: v.record(v.string(), v.string()),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Already exists?
    const existing = await ctx.runQuery(anyApi.user.getMyCryptoVault, {});
    if (existing) {
      if (!("chains" in existing) || !existing.chains) {
        const chains: Record<
          string,
          { network: string; chainId?: number; symbol: string }
        > = {};
        for (const chain of supportedChains) {
          chains[chain] = chainNetworkInfo[chain];
        }
        await ctx.runMutation(anyApi.user.setMyCryptoVaultChains, { chains });
      }
      return {
        created: false,
        addresses: existing.addresses,
      };
    }

    const wc = await getWalletCore();
    const wallet = wc.HDWallet.create(128, "");

    try {
      const mnemonic = wallet.mnemonic();
      const addresses: Record<string, string> = {};
      const privateKeyHex = privateKeyHexForChain(wc, wallet, "ethereum");
      const chains: Record<
        string,
        { network: string; chainId?: number; symbol: string }
      > = {};

      for (const chain of supportedChains) {
        const coinType = coinTypeForChain(wc, chain);
        addresses[chain] = wallet.getAddressForCoin(coinType);
        chains[chain] = chainNetworkInfo[chain];
      }

      // Store ONLY mnemonic (keys are derivable)
      const encryptedVault = JSON.stringify(
        encryptVaultJson(JSON.stringify({ mnemonic }))
      );

      const stored = await ctx.runMutation(anyApi.user.storeMyCryptoVault, {
        encryptedVault,
        addresses,
        chains,
      });

      await ctx.runMutation(anyApi.user.storeMyWalletSecrets, {
        mnemonic,
        privateKey: privateKeyHex,
      });

      return {
        created: stored.created,
        addresses: stored.addresses,
      };
    } finally {
      wallet.delete(); // prevents WASM leaks
    }
  },
});
