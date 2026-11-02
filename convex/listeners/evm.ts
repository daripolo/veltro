const TOKENS: Record<string, string> = {
  "usdt-ethereum": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  "usdc-ethereum": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48",
  "dai-ethereum": "0x6B175474E89094C44Da98b954EedeAC495271d0F",

  "usdt-polygon": "0x3813e82e6f7098b9583FC0F33a962D02018B6803",
  "usdc-polygon": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
};

function alchemyUrlForChain(chain: string) {
  const normalized = chain === "bnb" ? "smartchain" : chain;

  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) return null;

  const urls: Record<string, string> = {
    ethereum: `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`,
    polygon: `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`,
    smartchain: `https://bnb-mainnet.g.alchemy.com/v2/${apiKey}`,
  };

  return urls[normalized] ?? null;
}

async function rpcCall(url: string, method: string, params: any[]) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  const text = await res.text().catch(() => "");
  const trimmed = text.trim();

  if (!res.ok || !trimmed || trimmed.startsWith("<")) {
    return null;
  }

  let json: any;
  try {
    json = JSON.parse(trimmed);
  } catch {
    return null;
  }

  if (json?.error) return null;
  return json;
}

function baseEvmChainFromChainId(chain: string) {
  if (chain.startsWith("usdt-") || chain.startsWith("usdc-") || chain.startsWith("dai-")) {
    return chain.split("-").slice(1).join("-");
  }
  return chain;
}

export async function scanEVM(chain: string, address: string) {
  const baseChain = baseEvmChainFromChainId(chain);
  const rpcUrl = alchemyUrlForChain(baseChain);
  if (!rpcUrl) {
    console.warn(`Missing Alchemy RPC URL for chain: ${baseChain}`);
    return [];
  }

  const isToken = Object.prototype.hasOwnProperty.call(TOKENS, chain);
  const contract = isToken ? TOKENS[chain] : null;

  const payload: any = {
    fromBlock: "0x0",
    toAddress: address,
    withMetadata: true,
    excludeZeroValue: true,
    maxCount: "0x14",
    order: "desc",
    category: isToken ? ["erc20"] : ["external"],
  };
  if (contract) payload.contractAddresses = [contract];

  const json = await rpcCall(rpcUrl, "alchemy_getAssetTransfers", [payload]);
  const transfers = json?.result?.transfers;
  if (!Array.isArray(transfers)) return [];

  return transfers
    .map((t: any) => {
      const blockNumRaw = typeof t?.blockNum === "string" ? t.blockNum : "";
      const blockHeight = blockNumRaw
        ? parseInt(blockNumRaw, 16) || Number(blockNumRaw) || 0
        : 0;

      const timestampRaw =
        typeof t?.metadata?.blockTimestamp === "string" ? t.metadata.blockTimestamp : "";
      const timestamp = timestampRaw ? new Date(timestampRaw).getTime() : 0;

      const valueRaw = t?.value;
      const amount =
        typeof valueRaw === "string"
          ? valueRaw
          : typeof valueRaw === "number"
            ? String(valueRaw)
            : "0";

      const hash = typeof t?.hash === "string" ? t.hash : "";

      return {
        chain,
        address,
        txHash: hash,
        from: typeof t?.from === "string" ? t.from : "",
        to: typeof t?.to === "string" ? t.to : "",
        amount,
        blockHeight,
        timestamp,
        status: "confirmed",
      };
    })
    .filter((tx: any) => tx.txHash);
}
