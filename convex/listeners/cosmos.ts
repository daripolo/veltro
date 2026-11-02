const BASES: Record<string, string[]> = {
  atom: ["https://cosmos-rest.publicnode.com"],
  sei: ["https://sei-rest.publicnode.com"],
  inj: ["https://injective-rest.publicnode.com", "https://lcd.injective.network"],
};

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

async function rpcCall(url: string, method: string, params: any) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: controller.signal,
      });
    } catch (error) {
      if (isAbortError(error)) return null;
      return null;
    }

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

async function scanViaTendermintTxSearch(base: string, chain: string, address: string) {
  const query = `transfer.recipient='${address}'`;
  const json = await rpcCall(base, "tx_search", {
    query,
    prove: false,
    page: "1",
    per_page: "20",
    order_by: "desc",
  });

  const txs = json?.result?.txs;
  if (!Array.isArray(txs)) return [];

  const timeByHeight = new Map<number, number>();

  const out: any[] = [];
  for (const t of txs) {
    const txHash = typeof t?.hash === "string" ? t.hash : "";
    const height = typeof t?.height === "string" ? Number(t.height) : Number(t?.height ?? 0) || 0;
    if (!txHash) continue;

    let timestamp = 0;
    if (height > 0) {
      const cached = timeByHeight.get(height);
      if (typeof cached === "number") {
        timestamp = cached;
      } else {
        const blockJson = await rpcCall(base, "block", { height: String(height) });
        const timeStr = blockJson?.result?.block?.header?.time;
        if (typeof timeStr === "string" && timeStr) {
          const ms = new Date(timeStr).getTime();
          if (Number.isFinite(ms) && ms > 0) {
            timestamp = ms;
            timeByHeight.set(height, ms);
          }
        }
      }
    }

    out.push({
      chain,
      address,
      txHash,
      amount: "0",
      blockHeight: height,
      timestamp,
      status: "confirmed",
    });
  }

  return out;
}

export async function scanCosmos(chain: string, address: string) {
  const bases = BASES[chain];
  if (!bases) {
      console.warn(`No REST API for Cosmos chain: ${chain}`);
      return [];
  }

  try {
    const event = `transfer.recipient='${address}'`;

    for (const base of bases) {
      if (base.includes(".g.alchemy.com")) {
        const tendermint = await scanViaTendermintTxSearch(base, chain, address);
        if (Array.isArray(tendermint) && tendermint.length > 0) return tendermint;
        continue;
      }

      const timeoutMs = 20_000;
      const maxAttempts = 2;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const params = new URLSearchParams();
          params.append("events", event);
          params.set("query", event);
          params.set("pagination.limit", "20");
          params.set("order_by", "2");

          let res: Response;
          try {
            res = await fetch(`${base}/cosmos/tx/v1beta1/txs?${params.toString()}`, {
              signal: controller.signal,
            });
          } catch (error) {
            if (isAbortError(error)) {
              console.warn(
                `Cosmos scan timed out for ${chain} (${base}) after ${timeoutMs}ms (attempt ${attempt}/${maxAttempts})`
              );
              if (attempt < maxAttempts) {
                await sleep(400 * attempt);
                continue;
              }
              break;
            }
            throw error;
          }

          if (!res.ok) {
            const body = await res.text().catch(() => "");
            const trimmed = body.trim();
            const extra = trimmed
              ? ` ${trimmed.startsWith("<") ? "[html]" : ""} ${trimmed.substring(0, 120)}`
              : "";

            console.warn(
              `Cosmos scan failed for ${chain} (${base}): ${res.status} ${res.statusText || "<none>"}${extra}`
            );

            if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts) {
              await sleep(400 * attempt);
              continue;
            }

            break;
          }

          const text = await res.text();
          const trimmed = text.trim();
          if (!trimmed) return [];

          if (trimmed.startsWith("<")) {
            console.warn(
              `Cosmos API returned HTML for ${chain} (${base}): ${trimmed.substring(0, 120)}`
            );
            break;
          }

          const json = JSON.parse(trimmed);

          if (!json.tx_responses || !Array.isArray(json.tx_responses)) return [];

          return json.tx_responses.map((tx: any) => ({
            chain,
            address,
            txHash: tx.txhash,
            amount:
              tx.logs?.[0]?.events?.[0]?.attributes?.find((a: any) => a.key === "amount")?.value ||
              "0",
            blockHeight: Number(tx.height),
            timestamp: new Date(tx.timestamp).getTime(),
            status: "confirmed",
          }));
        } finally {
          clearTimeout(timeout);
        }
      }
    }

    return [];
  } catch (error) {
      console.error(`Error scanning Cosmos ${chain} address ${address}:`, error);
      return [];
  }
}
