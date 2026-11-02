"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { CHAIN_GROUP} from "./constants";

import { scanUTXO } from "./utxo";
import { scanEVM } from "./evm";
import { scanSolana } from "./solana";
import { scanTron } from "./tron";
import { scanXRP } from "./xrp";
import { scanCosmos } from "./cosmos";
import { scanTON } from "./ton";
import { scanPolkadot } from "./polkadot";

const scanByGroup = {
  utxo: scanUTXO,
  evm: scanEVM,
  solana: scanSolana,
  tron: scanTron,
  xrp: scanXRP,
  cosmos: scanCosmos,
  ton: scanTON,
  polkadot: scanPolkadot,
} as const;

type ScanGroup = keyof typeof scanByGroup;

function normalizeToMainnetChain(chain: string): string {
  const trimmed = String(chain ?? "").trim();
  if (!trimmed) return "";
  return trimmed.replace(/-(testnet|devnet)$/i, "");
}

const CONCURRENCY_BY_GROUP: Record<ScanGroup, number> = {
  utxo: 3,
  evm: 5,
  solana: 5,
  tron: 4,
  xrp: 4,
  cosmos: 4,
  ton: 4,
  polkadot: 4,
};

function groupAddressesByScanGroup(addresses: any[]) {
  const grouped: Record<ScanGroup, any[]> = {
    utxo: [],
    evm: [],
    solana: [],
    tron: [],
    xrp: [],
    cosmos: [],
    ton: [],
    polkadot: [],
  };

  for (const row of addresses) {
    const chain = normalizeToMainnetChain(String(row?.chain ?? ""));
    const group = CHAIN_GROUP[chain as keyof typeof CHAIN_GROUP] as ScanGroup | undefined;
    if (!group) {
      console.warn(`Unsupported chain in poller: ${chain}`);
      continue;
    }
    const bucket = grouped[group];
    if (!bucket) {
      console.warn(`Unsupported chain group in poller: ${chain} -> ${String(group)}`);
      continue;
    }
    bucket.push({ ...row, chain });
  }

  return grouped;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
) {
  const cap = Number.isFinite(concurrency) && concurrency > 0 ? Math.floor(concurrency) : 1;
  const executing = new Set<Promise<void>>();

  for (const item of items) {
    const p = worker(item);
    executing.add(p);
    const cleanup = () => executing.delete(p);
    p.then(cleanup, cleanup);

    if (executing.size >= cap) {
      await Promise.race(Array.from(executing));
    }
  }

  await Promise.all(Array.from(executing));
}

function coinMarketCapSymbolForChain(chain: string): string | null {
  const raw = String(chain ?? "").trim().toLowerCase();
  if (!raw) return null;

  if (raw === "bitcoin") return "BTC";
  if (raw === "doge") return "DOGE";
  if (raw === "litecoin") return "LTC";

  if (raw === "ethereum") return "ETH";
  if (raw === "smartchain" || raw === "bnb") return "BNB";
  if (raw === "polygon") return "MATIC";

  if (raw === "solana") return "SOL";
  if (raw === "tron") return "TRX";
  if (raw === "xrp") return "XRP";

  if (raw === "atom") return "ATOM";
  if (raw === "sei") return "SEI";
  if (raw === "inj") return "INJ";

  if (raw === "ton") return "TON";
  if (raw === "polkadot") return "DOT";

  const base = raw.split("-")[0];
  if (base === "usdt") return "USDT";
  if (base === "usdc") return "USDC";
  if (base === "dai") return "DAI";

  return null;
}

function extractCmcPrice(
  payload: unknown,
  symbol: string,
  convertCurrency: string
): number {
  if (!payload || typeof payload !== "object") return 0;
  const data = (payload as any).data?.[symbol];
  const item = Array.isArray(data) ? data[0] : data;
  const price = item?.quote?.[convertCurrency]?.price;
  return typeof price === "number" && Number.isFinite(price) ? price : 0;
}

async function processRow(
  ctx: any,
  row: any,
  scanFn: (chain: string, address: string) => Promise<any[]>,
  priceCache: Map<string, number>
) {
  const chain = normalizeToMainnetChain(String(row?.chain ?? ""));
  const txs = await scanFn(chain, row.address);
  if (!Array.isArray(txs) || txs.length === 0) return;

  const localCurrency = await ctx.runQuery(internal.accounts.getUserLocalCurrency, {
    userId: row.userId,
  });
  const localCurrencyUpper = String(localCurrency).trim().toUpperCase();
  const cmcSymbol = coinMarketCapSymbolForChain(chain);
  let price = 0;

  if (cmcSymbol && localCurrencyUpper) {
    const cacheKey = `${cmcSymbol}:${localCurrencyUpper}`;
    const cached = priceCache.get(cacheKey);
    if (typeof cached === "number") {
      price = cached;
    } else {
      try {
        const apiKey = process.env.COINMARKETCAP_API_KEY;
        if (!apiKey) {
          priceCache.set(cacheKey, 0);
        } else {
          const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(
            cmcSymbol
          )}&convert=${encodeURIComponent(localCurrencyUpper)}`;
          const res = await fetch(url, {
            headers: {
              "X-CMC_PRO_API_KEY": apiKey,
              Accept: "application/json",
            },
          });
          if (!res.ok) {
            priceCache.set(cacheKey, 0);
          } else {
            const json = (await res.json()) as unknown;
            price = extractCmcPrice(json, cmcSymbol, localCurrencyUpper);
            priceCache.set(cacheKey, price);
          }
        }
      } catch (e) {
        console.error("Price fetch failed", e);
        priceCache.set(cacheKey, 0);
      }
    }
  }

  for (const tx of txs) {
    const numericAmount = parseFloat(String(tx.amount));
    const fiatAmount = price * (Number.isFinite(numericAmount) ? numericAmount : 0);

    await ctx.runMutation(internal.transactions.upsertTransaction, {
      ...tx,
      userId: row.userId,
      fiatAmount: price > 0 ? fiatAmount : undefined,
      fiatCurrency: price > 0 ? localCurrency : undefined,
      assetSymbol: chain.split("-")[0].toUpperCase(),
    });
  }
}

async function pollGroup(
  ctx: any,
  group: ScanGroup,
  addresses: any[],
  priceCache: Map<string, number>
) {
  const scanFn = scanByGroup[group];

  const concurrency = CONCURRENCY_BY_GROUP[group] ?? 3;
  await runWithConcurrency(addresses, concurrency, async (row) => {
    try {
      await processRow(ctx, row, scanFn, priceCache);
    } catch (error) {
      console.error(`Error scanning ${row.chain} address ${row.address}:`, error);
    }
  });
}

export const pollUtxo = internalAction({
  handler: async (ctx) => {
    const addresses = await ctx.runQuery(internal.depositAddresses.getAll, {});
    const grouped = groupAddressesByScanGroup(addresses);
    const priceCache = new Map<string, number>();
    await pollGroup(ctx, "utxo", grouped.utxo, priceCache);
  },
});

export const pollEvm = internalAction({
  handler: async (ctx) => {
    const addresses = await ctx.runQuery(internal.depositAddresses.getAll, {});
    const grouped = groupAddressesByScanGroup(addresses);
    const priceCache = new Map<string, number>();
    await pollGroup(ctx, "evm", grouped.evm, priceCache);
  },
});

export const pollSolana = internalAction({
  handler: async (ctx) => {
    const addresses = await ctx.runQuery(internal.depositAddresses.getAll, {});
    const grouped = groupAddressesByScanGroup(addresses);
    const priceCache = new Map<string, number>();
    await pollGroup(ctx, "solana", grouped.solana, priceCache);
  },
});

export const pollTron = internalAction({
  handler: async (ctx) => {
    const addresses = await ctx.runQuery(internal.depositAddresses.getAll, {});
    const grouped = groupAddressesByScanGroup(addresses);
    const priceCache = new Map<string, number>();
    await pollGroup(ctx, "tron", grouped.tron, priceCache);
  },
});

export const pollXrp = internalAction({
  handler: async (ctx) => {
    const addresses = await ctx.runQuery(internal.depositAddresses.getAll, {});
    const grouped = groupAddressesByScanGroup(addresses);
    const priceCache = new Map<string, number>();
    await pollGroup(ctx, "xrp", grouped.xrp, priceCache);
  },
});

export const pollCosmos = internalAction({
  handler: async (ctx) => {
    const addresses = await ctx.runQuery(internal.depositAddresses.getAll, {});
    const grouped = groupAddressesByScanGroup(addresses);
    const priceCache = new Map<string, number>();
    await pollGroup(ctx, "cosmos", grouped.cosmos, priceCache);
  },
});

export const pollTon = internalAction({
  handler: async (ctx) => {
    const addresses = await ctx.runQuery(internal.depositAddresses.getAll, {});
    const grouped = groupAddressesByScanGroup(addresses);
    const priceCache = new Map<string, number>();
    await pollGroup(ctx, "ton", grouped.ton, priceCache);
  },
});

export const pollPolkadot = internalAction({
  handler: async (ctx) => {
    const addresses = await ctx.runQuery(internal.depositAddresses.getAll, {});
    const grouped = groupAddressesByScanGroup(addresses);
    const priceCache = new Map<string, number>();
    await pollGroup(ctx, "polkadot", grouped.polkadot, priceCache);
  },
});

export const pollAllChains = internalAction({
  handler: async (ctx) => {
    const addresses = await ctx.runQuery(internal.depositAddresses.getAll, {});
    const grouped = groupAddressesByScanGroup(addresses);
    const groupOrder: ScanGroup[] = [
      "utxo",
      "evm",
      "solana",
      "tron",
      "xrp",
      "cosmos",
      "ton",
      "polkadot",
    ];

    const priceCache = new Map<string, number>();

    for (const group of groupOrder) {
      await pollGroup(ctx, group, grouped[group], priceCache);
    }
  },
});
