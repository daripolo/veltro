import { NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

type VaultAddress = { userId: string; chain: string; address: string };

type BlockCypherTxRef = {
  tx_hash?: string;
  value?: number;
  confirmations?: number;
  confirmed?: string;
  tx_input_n?: number;
};

type BlockCypherAddressResponse = {
  txrefs?: BlockCypherTxRef[];
  unconfirmed_txrefs?: BlockCypherTxRef[];
};

function decimalFromBaseUnits(raw: string, decimals: number) {
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  const neg = trimmed.startsWith("-");
  const digits = neg ? trimmed.slice(1) : trimmed;
  const padded = digits.padStart(decimals + 1, "0");
  const intPart = padded.slice(0, -decimals);
  const fracPart = padded.slice(-decimals).replace(/0+$/, "");
  const normalized = fracPart ? `${intPart}.${fracPart.slice(0, 8)}` : intPart;
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

function coingeckoIdForAsset(asset: string) {
  switch (asset.trim().toUpperCase()) {
    case "BTC":
      return "bitcoin";
    case "LTC":
      return "litecoin";
    case "DOGE":
      return "dogecoin";
    default:
      return null;
  }
}

async function fetchPrice(coinId: string, vsCurrency: string) {
  const vs = vsCurrency.trim().toLowerCase();
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
    coinId,
  )}&vs_currencies=${encodeURIComponent(vs)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, Record<string, number>>;
  const price = data?.[coinId]?.[vs];
  return typeof price === "number" && Number.isFinite(price) ? price : null;
}

function baseUrlForChain(chain: string) {
  switch (chain) {
    case "bitcoin":
      return "https://api.blockcypher.com/v1/btc/main";
    case "litecoin":
      return "https://api.blockcypher.com/v1/ltc/main";
    case "doge":
      return "https://api.blockcypher.com/v1/doge/main";
    default:
      return null;
  }
}

function assetForChain(chain: string) {
  switch (chain) {
    case "bitcoin":
      return "BTC";
    case "litecoin":
      return "LTC";
    case "doge":
      return "DOGE";
    default:
      return chain.toUpperCase();
  }
}

function parseConfirmedMs(confirmed?: string) {
  if (!confirmed) return null;
  const ms = Date.parse(confirmed);
  return Number.isFinite(ms) ? ms : null;
}

export async function GET() {
  const secret = process.env.WEBHOOK_SHARED_SECRET;
  if (!secret) return NextResponse.json({ ok: false }, { status: 500 });

  const token = process.env.BLOCKCYPHER_TOKEN;
  if (!token) return NextResponse.json({ ok: false }, { status: 500 });

  const vaultAddresses = (await fetchQuery(api.wallet.listVaultAddressesForChains, {
    chains: ["bitcoin", "litecoin", "doge"],
    secret,
  })) as VaultAddress[];

  for (const { userId, chain, address } of vaultAddresses) {
    const baseUrl = baseUrlForChain(chain);
    if (!baseUrl) continue;

    const url = `${baseUrl}/addrs/${encodeURIComponent(address)}?limit=50&token=${encodeURIComponent(
      token,
    )}`;

    const res = await fetch(url);
    if (!res.ok) continue;

    const data = (await res.json()) as BlockCypherAddressResponse;
    const refs = [...(data.txrefs ?? []), ...(data.unconfirmed_txrefs ?? [])];

    const byHash = new Map<
      string,
      { value: number; confirmations: number; timestamp: number }
    >();

    for (const ref of refs) {
      if (!ref.tx_hash) continue;
      if (ref.tx_input_n !== -1) continue;
      const value = typeof ref.value === "number" ? ref.value : 0;
      const confirmations = typeof ref.confirmations === "number" ? ref.confirmations : 0;
      const ts = parseConfirmedMs(ref.confirmed) ?? Date.now();

      const prev = byHash.get(ref.tx_hash);
      if (!prev) {
        byHash.set(ref.tx_hash, { value, confirmations, timestamp: ts });
      } else {
        prev.value += value;
        prev.confirmations = Math.max(prev.confirmations, confirmations);
        prev.timestamp = Math.min(prev.timestamp, ts);
      }
    }

    for (const [hash, tx] of byHash) {
      const asset = assetForChain(chain);
      const fiatCurrency = await fetchQuery(api.user.getUserCurrencyForWebhook, {
        userId,
        secret,
      });

      const amount = decimalFromBaseUnits(String(tx.value), 8);
      const coinId = coingeckoIdForAsset(asset);
      const price = coinId ? await fetchPrice(coinId, fiatCurrency) : null;
      const fiatAmount =
        typeof amount === "number" &&
        Number.isFinite(amount) &&
        typeof price === "number" &&
        Number.isFinite(price)
          ? amount * price
          : null;

      if (fiatAmount !== null) {
        await fetchMutation(api.cryptoTransactions.ingestAndCreditLocal, {
          secret,
          userId,
          chain,
          network: "mainnet",
          asset,
          hash,
          from: "unknown",
          to: address,
          value: String(tx.value),
          timestamp: tx.timestamp,
          fiatAmount,
          fiatCurrency,
          confirmations: tx.confirmations,
        });
      } else {
        await fetchMutation(api.cryptoTransactions.ingest, {
          userId,
          chain,
          network: "mainnet",
          asset,
          hash,
          from: "unknown",
          to: address,
          value: String(tx.value),
          timestamp: tx.timestamp,
        });
      }

      await fetchMutation(api.cryptoTransactions.updateConfirmations, {
        hash,
        confirmations: tx.confirmations,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
