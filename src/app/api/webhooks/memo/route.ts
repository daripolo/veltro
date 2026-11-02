import { NextRequest, NextResponse } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

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
    case "ETH":
      return "ethereum";
    case "SOL":
      return "solana";
    case "TRX":
      return "tron";
    case "LTC":
      return "litecoin";
    case "DOGE":
      return "dogecoin";
    case "XRP":
      return "ripple";
    case "ATOM":
      return "cosmos";
    case "SEI":
      return "sei-network";
    case "INJ":
      return "injective-protocol";
    case "TON":
      return "the-open-network";
    case "DOT":
      return "polkadot";
    case "USDT":
      return "tether";
    case "USDC":
      return "usd-coin";
    case "DAI":
      return "dai";
    default:
      return null;
  }
}

function decimalsForChain(chain: string, asset: string) {
  const sym = asset.trim().toUpperCase();
  switch (chain) {
    case "xrp":
      return 6;
    case "cosmos":
    case "atom":
    case "sei":
    case "inj":
      return 6;
    case "ton":
      return 9;
    case "polkadot":
      return 10;
    case "solana":
      return sym === "SOL" ? 9 : null;
    case "tron":
      return sym === "TRX" || sym === "USDT" || sym === "USDC" ? 6 : null;
    default:
      return null;
  }
}

function parseAmount(chain: string, asset: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (trimmed.includes(".") || trimmed.includes("e") || trimmed.includes("E")) {
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }

  const decimals = decimalsForChain(chain, asset);
  if (decimals !== null && /^-?\d+$/.test(trimmed) && trimmed.replace(/^-/, "").length >= 7) {
    return decimalFromBaseUnits(trimmed, decimals);
  }

  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
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

type IncomingTx = {
  chain?: string;
  hash?: string;
  from?: string;
  to?: string;
  memo?: string;
  value?: string | number;
  amount?: string | number;
  timestamp?: number;
  confirmations?: number;
};

function asString(v: unknown) {
  return typeof v === "string" ? v : undefined;
}

function asNumber(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function assetForChain(chain: string) {
  switch (chain) {
    case "xrp":
      return "XRP";
    case "cosmos":
      return "ATOM";
    case "sei":
      return "SEI";
    case "inj":
      return "INJ";
    case "ton":
      return "TON";
    case "polkadot":
      return "DOT";
    default:
      return chain.toUpperCase();
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.WEBHOOK_SHARED_SECRET;
  if (!secret) return NextResponse.json({ ok: false }, { status: 500 });

  const raw = await req.json();
  const txs: IncomingTx[] = Array.isArray(raw) ? raw : [raw];

  for (const tx of txs) {
    const chain = asString(tx?.chain)?.trim();
    const hash = asString(tx?.hash)?.trim();
    const to = asString(tx?.to)?.trim();
    if (!chain || !hash || !to) continue;

    const vault = await fetchQuery(api.wallet.getUserByAddress, { address: to, secret });
    const userId = (vault as any)?.userId as string | undefined;
    if (!userId) continue;

    const from = asString(tx?.from)?.trim() ?? "unknown";
    const memo = asString(tx?.memo)?.trim() || undefined;
    const valueRaw = tx?.value ?? tx?.amount ?? "0";
    const value = typeof valueRaw === "string" ? valueRaw : String(valueRaw);
    const timestamp = asNumber(tx?.timestamp) ?? Date.now();

    const asset = assetForChain(chain);
    const fiatCurrency = await fetchQuery(api.user.getUserCurrencyForWebhook, {
      userId,
      secret,
    });

    const coinId = coingeckoIdForAsset(asset);
    const amount = parseAmount(chain, asset, value);
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
        from,
        to,
        value,
        memo,
        timestamp,
        fiatAmount,
        fiatCurrency,
        confirmations: asNumber(tx?.confirmations),
      });
    } else {
      await fetchMutation(api.cryptoTransactions.ingest, {
        userId,
        chain,
        network: "mainnet",
        asset,
        hash,
        from,
        to,
        value,
        memo,
        timestamp,
      });
    }

    const confirmations = asNumber(tx?.confirmations);
    if (confirmations !== undefined) {
      await fetchMutation(api.cryptoTransactions.updateConfirmations, {
        hash,
        confirmations,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
