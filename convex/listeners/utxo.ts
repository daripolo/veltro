const BITCOIN_ALCHEMY_URLS: Record<string, string> = {
  bitcoin: "https://bitcoin-mainnet.g.alchemy.com/v2/",
};

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

async function scanBitcoinViaAlchemy(chain: string, address: string) {
  const rpcUrl = BITCOIN_ALCHEMY_URLS[chain];
  if (!rpcUrl) return null;
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) return null;

  const scan = await rpcCall(`${rpcUrl}${apiKey}`, "scantxoutset", ["start", [`addr(${address})`]]);
  const unspents = scan?.result?.unspents;
  if (!Array.isArray(unspents)) return [];

  const heightCache = new Map<number, number>();

  const rows = unspents.slice(0, 20);
  const out: any[] = [];

  for (const u of rows) {
    const txid = typeof u?.txid === "string" ? u.txid : "";
    if (!txid) continue;
    const amount =
      typeof u?.amount === "number"
        ? String(u.amount)
        : typeof u?.amount === "string"
          ? u.amount
          : "0";

    const blockHeight = typeof u?.height === "number" ? u.height : Number(u?.height ?? 0) || 0;

    let timestamp = 0;
    if (blockHeight > 0) {
      const cached = heightCache.get(blockHeight);
      if (typeof cached === "number") {
        timestamp = cached;
      } else {
        const hashJson = await rpcCall(rpcUrl, "getblockhash", [blockHeight]);
        const blockHash = typeof hashJson?.result === "string" ? hashJson.result : "";
        if (blockHash) {
          const headerJson = await rpcCall(rpcUrl, "getblockheader", [blockHash, true]);
          const t = headerJson?.result?.time;
          if (typeof t === "number" && t > 0) {
            timestamp = t * 1000;
            heightCache.set(blockHeight, timestamp);
          }
        }
      }
    }

    out.push({
      chain,
      address,
      txHash: txid,
      amount,
      blockHeight,
      timestamp,
      status: "confirmed",
    });
  }

  return out;
}

function isAbortError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const anyErr = error as { name?: unknown; message?: unknown; code?: unknown };
  const name = typeof anyErr.name === "string" ? anyErr.name : "";
  const message = typeof anyErr.message === "string" ? anyErr.message : "";
  const code = typeof anyErr.code === "string" ? anyErr.code : "";
  return (
    name === "AbortError" ||
    code === "ABORT_ERR" ||
    message.toLowerCase().includes("aborted") ||
    message.toLowerCase().includes("abort")
  );
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scanUTXO(chain: string, address: string) {
  try {
    if (chain === "bitcoin") {
      const viaAlchemy = await scanBitcoinViaAlchemy(chain, address);
      if (viaAlchemy) return viaAlchemy;
    }

    let url = "";

    if (chain === "bitcoin") url = `https://blockstream.info/api/address/${address}/txs`;

    if (chain === "litecoin")
      url = `https://litecoinspace.org/api/address/${address}/txs`;

    if (chain === "doge") url = `https://sochain.com/api/v2/address/DOGE/${address}`;

    if (!url) {
      console.warn(`No UTXO API URL for chain: ${chain}`);
      return [];
    }

    const timeoutMs = chain === "doge" ? 20_000 : 10_000;
    const maxAttempts = chain === "doge" ? 2 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url, { signal: controller.signal });
        const text = await res.text().catch(() => "");
        const trimmed = text.trim();

        if (!res.ok) {
          const extra = trimmed
            ? ` ${trimmed.startsWith("<") ? "[html]" : ""} ${trimmed.substring(0, 160)}`
            : "";
          console.warn(
            `UTXO scan failed for ${chain} (${url}): ${res.status} ${res.statusText || "<none>"}${extra}`
          );

          if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts) {
            await sleep(400 * attempt);
            continue;
          }

          return [];
        }

        if (!trimmed || trimmed.startsWith("<")) {
          console.warn(
            `UTXO API returned non-JSON for ${chain} (${url}): ${trimmed.substring(0, 160)}`
          );
          return [];
        }

        let data: any;
        try {
          data = JSON.parse(trimmed);
        } catch {
          console.warn(
            `UTXO API returned invalid JSON for ${chain} (${url}): ${trimmed.substring(0, 160)}`
          );
          return [];
        }

        let txs = data;
        if (chain === "doge") {
          txs = Array.isArray(data?.data?.txs) ? data.data.txs : [];
        }

        if (!Array.isArray(txs)) return [];

        return txs
          .map((tx: any) => ({
            chain,
            address,
            txHash: tx?.txid || tx?.tx_hash || tx?.hash,
            amount: extractUTXOAmount(tx, address),
            blockHeight:
              tx?.status?.block_height ?? tx?.block_height ?? tx?.block_no ?? tx?.block ?? 0,
            timestamp: (tx?.status?.block_time ?? tx?.time ?? tx?.block_time ?? 0) * 1000,
            status:
              tx?.status?.confirmed ||
              tx?.confirmations > 0 ||
              tx?.confirmations_required > 0
                ? "confirmed"
                : "pending",
          }))
          .filter((tx: any) => typeof tx.txHash === "string" && tx.txHash.length > 0);
      } catch (error) {
        if (isAbortError(error)) {
          console.warn(
            `UTXO scan timed out for ${chain} (${url}) after ${timeoutMs}ms (attempt ${attempt}/${maxAttempts})`
          );
          if (attempt < maxAttempts) {
            await sleep(400 * attempt);
            continue;
          }
          return [];
        }

        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    return [];
  } catch (error) {
    console.warn(`UTXO scan crashed for ${chain} address ${address}:`, error);
    return [];
  }
}

function extractUTXOAmount(tx: any, address: string) {
  let total = 0;
  const outs = tx?.vout ?? tx?.outputs;
  if (!Array.isArray(outs)) return "0";

  for (const o of outs) {
    if (o?.scriptpubkey_address === address || o?.address === address) {
      total += Number(o.value);
    }
  }

  return total.toString();
}
