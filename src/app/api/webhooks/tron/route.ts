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
    case "TRX":
      return "tron";
    case "USDT":
      return "tether";
    case "USDC":
      return "usd-coin";
    default:
      return null;
  }
}

function parseTronAmount(asset: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (trimmed.includes(".") || trimmed.includes("e") || trimmed.includes("E")) {
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }

  const upper = asset.trim().toUpperCase();
  if (upper === "TRX" && /^-?\d+$/.test(trimmed) && trimmed.replace(/^-/, "").length >= 7) {
    return decimalFromBaseUnits(trimmed, 6);
  }
  if ((upper === "USDT" || upper === "USDC") && /^-?\d+$/.test(trimmed) && trimmed.replace(/^-/, "").length >= 7) {
    return decimalFromBaseUnits(trimmed, 6);
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

function asString(v: unknown) {
  return typeof v === "string" ? v : undefined;
}

function asNumber(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export async function POST(req: NextRequest) {
  const secret = process.env.WEBHOOK_SHARED_SECRET;
  if (!secret) return NextResponse.json({ ok: false }, { status: 500 });

  const body = (await req.json()) as any;
  const data: any[] = body?.data ?? [];

  for (const tx of data ?? []) {
    const to = asString(tx?.to);
    const from = asString(tx?.from) ?? "unknown";
    const hash = asString(tx?.transaction_id) ?? asString(tx?.transactionHash);
    const tokenSymbol = asString(tx?.tokenSymbol) ?? "TRX";
    const valueRaw = tx?.value ?? tx?.amount ?? "0";
    const timestampMs = asNumber(tx?.block_timestamp) ?? Date.now();

    if (!to || !hash) continue;

    const vault = await fetchQuery(api.wallet.getUserByAddress, { address: to, secret });
    const userId = (vault as any)?.userId as string | undefined;
    if (!userId) continue;

    const value = typeof valueRaw === "string" ? valueRaw : String(valueRaw);
    const fiatCurrency = await fetchQuery(api.user.getUserCurrencyForWebhook, {
      userId,
      secret,
    });

    const coinId = coingeckoIdForAsset(tokenSymbol);
    const amount = parseTronAmount(tokenSymbol, value);
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
        chain: "tron",
        network: tokenSymbol === "TRX" ? "mainnet" : "TRC20",
        asset: tokenSymbol,
        hash,
        from,
        to,
        value,
        timestamp: timestampMs,
        fiatAmount,
        fiatCurrency,
      });
    } else {
      await fetchMutation(api.cryptoTransactions.ingest, {
        userId,
        chain: "tron",
        network: tokenSymbol === "TRX" ? "mainnet" : "TRC20",
        asset: tokenSymbol,
        hash,
        from,
        to,
        value,
        timestamp: timestampMs,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
