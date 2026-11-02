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

export const verifyChainMessage = action({
  args: {
    mnemonic: v.string(),
    chain: supportedChainValidator,
    message: v.string(),
    signature: v.string(),
  },
  returns: v.object({
    address: v.string(),
    valid: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const wc = await getWalletCore();
    const wallet = wc.HDWallet.createWithMnemonic(args.mnemonic, "");
    const coinType = coinTypeForChain(wc, args.chain);
    const address = wallet.getAddressForCoin(coinType);

    let valid: boolean;
    if (args.chain === "bitcoin") {
      valid = wc.BitcoinMessageSigner.verifyMessage(address, args.message, args.signature);
      wallet.delete();
      return { address, valid };
    }

    const privateKey = wallet.getKeyForCoin(coinType);
    const pubKey = privateKey.getPublicKey(coinType);

    switch (args.chain) {
      case "ethereum":
      case "smartchain":
      case "bnb":
      case "polygon":
      case "usdt-ethereum":
      case "usdc-ethereum":
      case "dai-ethereum":
      case "usdt-polygon":
      case "usdc-polygon":
        valid = wc.EthereumMessageSigner.verifyMessage(pubKey, args.message, args.signature);
        break;
      case "tron":
      case "usdt-tron":
        valid = wc.TronMessageSigner.verifyMessage(pubKey, args.message, args.signature);
        break;
      case "ton": {
        try {
          const sig = wc.Base64.decode(args.signature);
          const msg = Buffer.from(args.message, "utf8");
          valid = pubKey.verify(sig, msg);
        } catch {
          valid = false;
        }
        break;
      }
      default: {
        try {
          const sig = wc.Base64.decode(args.signature);
          const digest = wc.Hash.sha256(Buffer.from(args.message, "utf8"));
          valid = pubKey.verify(sig, digest);
        } catch {
          valid = false;
        }
      }
    }

    return { address, valid };
  },
});
