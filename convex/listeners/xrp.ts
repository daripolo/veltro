function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as any).name === "AbortError"
  );
}

function rippleEpochSecondsToMs(rippleEpochSeconds: number) {
  const rippleEpochMs = 946684800000;
  return rippleEpochMs + rippleEpochSeconds * 1000;
}

function decimalStringFromBaseUnits(raw: string, decimals: number) {
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) return "0";
  const neg = trimmed.startsWith("-");
  const digits = neg ? trimmed.slice(1) : trimmed;
  const padded = digits.padStart(decimals + 1, "0");
  const intPart = padded.slice(0, -decimals);
  const fracPart = padded.slice(-decimals).replace(/0+$/, "");
  const normalized = fracPart ? `${intPart}.${fracPart}` : intPart;
  return neg ? `-${normalized}` : normalized;
}

function rpcUrlsForChain(chain: string): string[] {
  return ["https://s2.ripple.com:51234/"];
}

async function rpcCall(url: string, method: string, params: Record<string, unknown>) {
  const controller = new AbortController();
  const timeoutMs = 15_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method,
        params: [params],
      }),
      signal: controller.signal,
    });

    const text = await res.text().catch(() => "");
    const trimmed = text.trim();
    if (!res.ok || !trimmed || trimmed.startsWith("<")) return null;

    try {
      return JSON.parse(trimmed) as any;
    } catch {
      return null;
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function scanXRP(chain: string, address: string) {
  const urls = rpcUrlsForChain(chain);

  for (const url of urls) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const params = {
          account: address,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: 20,
          binary: false,
          forward: false,
        };

        const json = await rpcCall(url, "account_tx", params);

        const txs = json?.result?.transactions;
        if (!Array.isArray(txs)) return [];

        const out: any[] = [];
        for (const entry of txs) {
          const tx = entry?.tx ?? entry?.tx_json ?? null;
          const meta = entry?.meta ?? entry?.metaData ?? null;
          if (!tx || typeof tx !== "object") continue;

          const validated =
            entry?.validated === true ||
            tx?.validated === true ||
            entry?.tx?.validated === true ||
            false;

          if (!validated) continue;

          const txType = String(tx?.TransactionType ?? "");
          if (txType !== "Payment") continue;

          const destination = String(tx?.Destination ?? "");
          if (!destination || destination !== address) continue;

          const resultCode = String(meta?.TransactionResult ?? meta?.transaction_result ?? "");
          if (resultCode && resultCode !== "tesSUCCESS") continue;

          const hash = String(tx?.hash ?? entry?.hash ?? "");
          if (!hash) continue;

          const from = String(tx?.Account ?? "");
          const to = destination;

          const delivered =
            meta?.delivered_amount ??
            meta?.DeliveredAmount ??
            meta?.deliveredAmount ??
            undefined;

          const amountRaw = delivered ?? tx?.Amount ?? "0";
          if (typeof amountRaw !== "string" || !/^\d+$/.test(amountRaw)) continue;

          const amount = decimalStringFromBaseUnits(amountRaw, 6);

          const ledgerIndex = Number(tx?.ledger_index ?? entry?.ledger_index ?? entry?.ledgerIndex ?? 0) || 0;
          const rippleSeconds = Number(tx?.date ?? 0) || 0;
          const timestamp = rippleSeconds > 0 ? rippleEpochSecondsToMs(rippleSeconds) : 0;

          out.push({
            chain,
            address,
            txHash: hash,
            from,
            to,
            amount,
            blockHeight: ledgerIndex,
            timestamp,
            status: "confirmed",
          });
        }

        return out;
      } catch (error) {
        if (isAbortError(error) && attempt < 2) continue;
        break;
      }
    }
  }

  return [];
}
