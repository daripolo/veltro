"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import { getWalletCore } from "../../walletcore";
import { supportedChainValidator, type SupportedChain } from "./chains";

function coinTypeForChain(wc: Awaited<ReturnType<typeof getWalletCore>>, chain: SupportedChain) {
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
    case "polygon":
    case "usdt-polygon":
    case "usdc-polygon":
      return wc.CoinType.polygon;
  }

  throw new Error(`Unsupported chain: ${chain}`);
}

export const signChainMessage = action({
  args: { mnemonic: v.string(), chain: supportedChainValidator, message: v.string() },
  returns: v.object({
    address: v.string(),
    signature: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const wc = await getWalletCore();
    const wallet = wc.HDWallet.createWithMnemonic(args.mnemonic, "");
    const coinType = coinTypeForChain(wc, args.chain);
    const address = wallet.getAddressForCoin(coinType);
    const privateKey = wallet.getKeyForCoin(coinType);

    let signature: string;
    switch (args.chain) {
      case "bitcoin":
        signature = wc.BitcoinMessageSigner.signMessage(privateKey, address, args.message);
        break;
      case "ethereum":
      case "smartchain":
      case "bnb":
      case "polygon":
      case "usdt-ethereum":
      case "usdc-ethereum":
      case "dai-ethereum":
      case "usdt-polygon":
      case "usdc-polygon":
        signature = wc.EthereumMessageSigner.signMessage(privateKey, args.message);
        break;
      case "tron":
      case "usdt-tron":
        signature = wc.TronMessageSigner.signMessage(privateKey, args.message);
        break;
      case "ton":
        signature = wc.TONMessageSigner.signMessage(privateKey, args.message);
        break;
      default: {
        const digest = wc.Hash.sha256(Buffer.from(args.message, "utf8"));
        const curve = wc.CoinTypeExt.curve(coinType);
        const sig = privateKey.sign(digest, curve);
        signature = wc.Base64.encode(sig);
      }
    }
  return { address, signature };
  },
});
