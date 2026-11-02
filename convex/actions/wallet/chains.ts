"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";

export const supportedChains = [
  "ethereum",
  "smartchain",
  "bnb",
  "bitcoin",
  "solana",
  "tron",
  "xrp",
  "atom",
  "sei",
  "inj",
  "ton",
  "polkadot",
  "doge",
  "litecoin",
  "polygon",
  "usdt-ethereum",
  "usdt-polygon",
  "usdt-tron",
  "usdc-ethereum",
  "usdc-polygon",
  "dai-ethereum",
] as const;

export type SupportedChain = (typeof supportedChains)[number];

export const supportedChainValidator = v.union(
  v.literal("ethereum"),
  v.literal("smartchain"),
  v.literal("bnb"),
  v.literal("bitcoin"),
  v.literal("solana"),
  v.literal("tron"),
  v.literal("xrp"),
  v.literal("atom"),
  v.literal("sei"),
  v.literal("inj"),
  v.literal("ton"),
  v.literal("polkadot"),
  v.literal("doge"),
  v.literal("litecoin"),
  v.literal("polygon"),
  v.literal("usdt-ethereum"),
  v.literal("usdt-polygon"),
  v.literal("usdt-tron"),
  v.literal("usdc-ethereum"),
  v.literal("usdc-polygon"),
  v.literal("dai-ethereum")
);

export const chainNetworkInfo: Record<
  SupportedChain,
  { network: string; chainId?: number; symbol: string }
> = {
  ethereum: { network: "mainnet", chainId: 1, symbol: "ETH" },
  smartchain: { network: "mainnet", chainId: 56, symbol: "BNB" },
  bnb: { network: "mainnet", chainId: 56, symbol: "BNB" },
  bitcoin: { network: "mainnet", symbol: "BTC" },
  solana: { network: "mainnet", symbol: "SOL" },
  tron: { network: "mainnet", symbol: "TRX" },
  xrp: { network: "mainnet", symbol: "XRP" },
  atom: { network: "mainnet", symbol: "ATOM" },
  sei: { network: "mainnet", symbol: "SEI" },
  inj: { network: "mainnet", symbol: "INJ" },
  ton: { network: "mainnet", symbol: "TON" },
  polkadot: { network: "mainnet", symbol: "DOT" },
  doge: { network: "mainnet", symbol: "DOGE" },
  litecoin: { network: "mainnet", symbol: "LTC" },
  polygon: { network: "mainnet", chainId: 137, symbol: "POL" },
  "usdt-ethereum": { network: "ERC20", chainId: 1, symbol: "USDT" },
  "usdt-polygon": { network: "Polygon", chainId: 137, symbol: "USDT" },
  "usdt-tron": { network: "TRC20", symbol: "USDT" },
  "usdc-ethereum": { network: "ERC20", chainId: 1, symbol: "USDC" },
  "usdc-polygon": { network: "Polygon", chainId: 137, symbol: "USDC" },
  "dai-ethereum": { network: "ERC20", chainId: 1, symbol: "DAI" },
};

export const getSupportedChains = action({
  args: {},
  returns: v.object({ chains: v.array(supportedChainValidator) }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return { chains: [...supportedChains] };
  },
});

