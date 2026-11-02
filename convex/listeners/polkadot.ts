let warnedMissingSubscanKey = false;

export async function scanPolkadot(chain: string, address: string) {
  const subdomain = "westend";
  try {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const url = `https://${subdomain}.api.subscan.io/api/scan/transfers`;
    const apiKey =process.env.SUBSCAN_API_KEY

    if (!apiKey) {
      if (!warnedMissingSubscanKey) {
        warnedMissingSubscanKey = true;
        console.warn("Subscan API key missing. Set SUBSCAN_API_KEY to enable Polkadot scanning.");
      }
      return [];
    }

    const init = {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ address, row: 20 }),
    } as const;

    let res: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(url, init);
      if (res.status !== 429) break;

      const retryAfter = res.headers.get("retry-after");
      const retryAfterSeconds = retryAfter ? Number(retryAfter) : NaN;
      const base = Number.isFinite(retryAfterSeconds)
        ? Math.max(0, retryAfterSeconds * 1000)
        : 1000 * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * 250);
      await sleep(base + jitter);
    }

    if (!res) return [];

    if (!res.ok) {
      if (res.status === 429) {
        console.warn(`Polkadot rate limited (429). Skipping this poll.`);
        return [];
      }
      if (res.status === 404) {
        console.warn("Subscan returned 404. Check SUBSCAN_API_KEY and network endpoint.");
        return [];
      }
      console.error(`Polkadot scan failed: ${res.status} ${res.statusText}`);
      return [];
    }

    const text = await res.text();
    // API might return rate limit HTML or non-JSON if over limit
    if (text.startsWith('<')) {
      console.warn(`Polkadot API returned non-JSON response. Skipping this poll.`);
      return [];
    }
    
    const json = JSON.parse(text);

    if (!json.data?.transfers || !Array.isArray(json.data.transfers)) return [];

    return json.data.transfers.map((tx: any) => ({
      chain,
      address,
      txHash: tx.hash,
      amount: tx.amount,
      blockHeight: tx.block_num,
      timestamp: tx.block_timestamp * 1000,
      status: "confirmed",
    }));
  } catch (error) {
      console.error(`Error scanning Polkadot ${chain} address ${address}:`, error);
      return [];
  }
}
