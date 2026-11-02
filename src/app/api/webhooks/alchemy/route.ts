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
    case "BNB":
      return "binancecoin";
    case "MATIC":
      return "polygon-pos";
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

function parseAssetAmount(chain: string, asset: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (trimmed.includes(".") || trimmed.includes("e") || trimmed.includes("E")) {
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }

  const upperAsset = asset.trim().toUpperCase();

  if (chain === "ethereum") {
    const decimals =
      upperAsset === "USDT" || upperAsset === "USDC" ? 6 : upperAsset === "DAI" ? 18 : upperAsset === "ETH" ? 18 : 18;
    return decimalFromBaseUnits(trimmed, decimals) ?? Number(trimmed);
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
  const activity: any[] = body?.event?.activity ?? [];

  for (const event of activity) {
    const toRaw = asString(event?.toAddress);
    if (!toRaw) continue;
    const to = toRaw.toLowerCase();

    const vault = await fetchQuery(api.wallet.getUserByAddress, { address: to, secret });
    const userId = (vault as any)?.userId as string | undefined;
    if (!userId) continue;

    const asset = asString(event?.asset) ?? asString(event?.tokenSymbol) ?? "ETH";
    const hash =
      asString(event?.hash) ??
      asString(event?.transactionHash) ??
      asString(event?.txHash);
    if (!hash) continue;

    const from = asString(event?.fromAddress) ?? asString(event?.from) ?? "unknown";
    const valueRaw = event?.value ?? event?.rawContract?.value ?? event?.amount ?? "0";
    const value = typeof valueRaw === "string" ? valueRaw : String(valueRaw);

    const fiatCurrency = await fetchQuery(api.user.getUserCurrencyForWebhook, {
      userId,
      secret,
    });

    const coinId = coingeckoIdForAsset(asset) ?? coingeckoIdForAsset("ETH");
    const amount = parseAssetAmount("ethereum", asset, value);
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
        chain: "ethereum",
        network: "ERC20",
        asset,
        hash,
        from,
        to,
        value,
        timestamp: asNumber(event?.timestamp) ?? Date.now(),
        fiatAmount,
        fiatCurrency,
      });
    } else {
      await fetchMutation(api.cryptoTransactions.ingest, {
        userId,
        chain: "ethereum",
        network: "ERC20",
        asset,
        hash,
        from,
        to,
        value,
        timestamp: asNumber(event?.timestamp) ?? Date.now(),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
