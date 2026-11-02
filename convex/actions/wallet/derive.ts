"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import { getWalletCore } from "../../walletcore";
import { supportedChainValidator, type SupportedChain } from "./chains";

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

export const deriveAddress = action({
  args: { mnemonic: v.string(), chain: supportedChainValidator },
  returns: v.object({ address: v.string() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const wc = await getWalletCore();

    const wallet = wc.HDWallet.createWithMnemonic(args.mnemonic, "");
    const coinType = coinTypeForChain(wc, args.chain);

    const address = wallet.getAddressForCoin(coinType);

    return { address };
  },
});
