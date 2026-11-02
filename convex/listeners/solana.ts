function decimalStringFromBaseUnits(value: string, decimals: number) {
  const trimmed = value.trim();
  if (!trimmed) return "0";
  if (!/^-?\d+$/.test(trimmed)) return trimmed;

  const negative = trimmed.startsWith("-");
  const digits = negative ? trimmed.slice(1) : trimmed;

  const padded = digits.padStart(decimals + 1, "0");
  const split = padded.length - decimals;
  const whole = padded.slice(0, split);
  const fraction = padded.slice(split);

  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

async function rpcCall(url: string, method: string, params: any[]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal,
    });

    const text = await res.text().catch(() => "");
    const trimmed = text.trim();

    if (!res.ok || !trimmed || trimmed.startsWith("<")) return null;

    let json: any;
    try {
      json = JSON.parse(trimmed);
    } catch {
      return null;
    }

    if (json?.error) return null;
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

function rpcUrlForChain(chain: string) {
  if (chain === "solana") {
    const apiKey = process.env.ALCHEMY_API_KEY;
    if (!apiKey) return null;
    return `https://solana-mainnet.g.alchemy.com/v2/${apiKey}`;
  }
  return null;
}

function extractLamportDeltaForAddress(tx: any, address: string) {
  const keys = tx?.transaction?.message?.accountKeys;
  const pre = tx?.meta?.preBalances;
  const post = tx?.meta?.postBalances;

  if (!Array.isArray(keys) || !Array.isArray(pre) || !Array.isArray(post)) return null;

  const addressLower = address.toLowerCase();
  let index = -1;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const pubkey = typeof k === "string" ? k : typeof k?.pubkey === "string" ? k.pubkey : "";
    if (pubkey.toLowerCase() === addressLower) {
      index = i;
      break;
    }
  }
  if (index < 0) return null;

  const preLamports = typeof pre[index] === "number" ? pre[index] : Number(pre[index] ?? NaN);
  const postLamports = typeof post[index] === "number" ? post[index] : Number(post[index] ?? NaN);
  if (!Number.isFinite(preLamports) || !Number.isFinite(postLamports)) return null;

  return postLamports - preLamports;
}

export async function scanSolana(chain: string, address: string) {
  const rpcUrl = rpcUrlForChain(chain);
  if (!rpcUrl) {
    console.warn(`Missing Solana RPC URL for chain: ${chain}`);
    return [];
  }

  try {
    const sigsJson = await rpcCall(rpcUrl, "getSignaturesForAddress", [
      address,
      { limit: 20 },
    ]);

    const sigs = sigsJson?.result;
    if (!Array.isArray(sigs)) return [];

    const results: any[] = [];
    for (const s of sigs) {
      const signature = typeof s?.signature === "string" ? s.signature : "";
      if (!signature) continue;
      if (s?.err) continue;

      const txJson = await rpcCall(rpcUrl, "getTransaction", [
        signature,
        { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
      ]);

      const tx = txJson?.result;
      if (!tx || tx?.meta?.err) continue;

      const deltaLamports = extractLamportDeltaForAddress(tx, address);
      if (typeof deltaLamports !== "number" || deltaLamports <= 0) continue;

      const blockHeight = typeof tx?.slot === "number" ? tx.slot : Number(tx?.slot ?? 0) || 0;

      const blockTime =
        typeof tx?.blockTime === "number"
          ? tx.blockTime
          : typeof s?.blockTime === "number"
            ? s.blockTime
            : 0;

      results.push({
        chain,
        address,
        txHash: signature,
        amount: decimalStringFromBaseUnits(String(deltaLamports), 9),
        blockHeight,
        timestamp: blockTime ? blockTime * 1000 : 0,
        status: "confirmed",
      });
    }

    return results;
  } catch (error) {
    console.error(`Error scanning Solana ${chain} address ${address}:`, error);
    return [];
  }
}
