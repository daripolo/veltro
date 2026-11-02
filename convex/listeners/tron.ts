 "use node";

import { createHash } from "crypto";

const TRC20_CONTRACTS = {
  "usdt-tron": { contract: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", decimals: 6 },
} as const;

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

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function sha256(bytes: Uint8Array) {
  const hash = createHash("sha256");
  hash.update(bytes);
  return new Uint8Array(hash.digest());
}

function hexToBytes(hex: string) {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) return new Uint8Array();
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = normalized.slice(i * 2, i * 2 + 2);
    out[i] = parseInt(byte, 16);
  }
  return out;
}

function base58Encode(bytes: Uint8Array) {
  if (bytes.length === 0) return "";

  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;

  const digits: number[] = [];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      const x = digits[j] * 256 + carry;
      digits[j] = x % 58;
      carry = Math.floor(x / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  let out = "";
  for (let i = 0; i < zeros; i++) out += "1";
  for (let i = digits.length - 1; i >= 0; i--) out += BASE58_ALPHABET[digits[i]];
  return out;
}

function tronHexToBase58(hexAddress: string) {
  const bytes = hexToBytes(hexAddress);
  if (bytes.length !== 21) return null;
  const checksum = sha256(sha256(bytes)).slice(0, 4);
  const payload = new Uint8Array(bytes.length + checksum.length);
  payload.set(bytes, 0);
  payload.set(checksum, bytes.length);
  return base58Encode(payload);
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text().catch(() => "");
    const trimmed = text.trim();
    if (!res.ok || !trimmed || trimmed.startsWith("<")) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  } finally {
    clearTimeout(timeout);
  }
}

function tronAlchemyUrlForChain(chain: string) {
  if (chain === "tron") {
    const apiKey = process.env.ALCHEMY_API_KEY;
    if (!apiKey) return null;
    return `https://tron-mainnet.g.alchemy.com/v2/${apiKey}`;
  }
  return null;
}

export async function scanTron(chain: string, address: string) {
  const baseUrl = tronAlchemyUrlForChain(chain);
  if (!baseUrl) {
    console.warn(`Missing Tron RPC URL for chain: ${chain}`);
    return [];
  }

  if (Object.prototype.hasOwnProperty.call(TRC20_CONTRACTS, chain)) {
    const { contract, decimals: fallbackDecimals } =
      TRC20_CONTRACTS[chain as keyof typeof TRC20_CONTRACTS];

    const addressLower = address.toLowerCase();
    const url = `${baseUrl}/v1/accounts/${encodeURIComponent(
      address
    )}/transactions/trc20?limit=20&only_confirmed=true&contract_address=${encodeURIComponent(
      contract
    )}`;

    const json: any = await fetchJson(url);
    const transfers = Array.isArray(json?.data) ? json.data : [];
    if (!Array.isArray(transfers)) return [];

    return transfers
      .filter((tx: any) => String(tx?.to ?? tx?.to_address ?? "").toLowerCase() === addressLower)
      .map((tx: any) => {
        const tokenDecimals =
          typeof tx?.token_info?.decimals === "number"
            ? tx.token_info.decimals
            : typeof tx?.tokenInfo?.tokenDecimal === "number"
              ? tx.tokenInfo.tokenDecimal
            : fallbackDecimals;

        const rawAmount = String(tx?.value ?? tx?.amount ?? tx?.quant ?? "0");

        const blockHeight =
          typeof tx?.blockNumber === "number"
            ? tx.blockNumber
            : typeof tx?.block === "number"
              ? tx.block
              : Number(tx?.blockNumber ?? tx?.block ?? 0) || 0;

        const timestamp =
          typeof tx?.block_timestamp === "number"
            ? tx.block_timestamp
            : typeof tx?.block_ts === "number"
              ? tx.block_ts
              : typeof tx?.timestamp === "number"
                ? tx.timestamp
                : Date.now();

        const confirmed =
          tx?.confirmed === true ||
          tx?.finalResult === "SUCCESS" ||
          tx?.receipt?.result === "SUCCESS";

        return {
          chain,
          address,
          txHash: String(tx?.transaction_id ?? tx?.hash ?? tx?.transaction_id ?? tx?.txID ?? ""),
          from: String(tx?.from ?? tx?.from_address ?? ""),
          to: String(tx?.to ?? tx?.to_address ?? ""),
          amount: decimalStringFromBaseUnits(rawAmount, tokenDecimals),
          blockHeight,
          timestamp,
          status: confirmed ? "confirmed" : "pending",
        };
      })
      .filter((tx: any) => tx.txHash);
  }

  const url = `${baseUrl}/v1/accounts/${encodeURIComponent(
    address
  )}/transactions?limit=20&only_confirmed=true&only_to=true&order_by=block_timestamp,desc`;

  const json: any = await fetchJson(url);
  const data = Array.isArray(json?.data) ? json.data : [];
  if (!Array.isArray(data)) return [];

  const addressLower = address.toLowerCase();

  return data
    .map((tx: any) => {
      const txHash = String(tx?.txID ?? tx?.txid ?? tx?.transaction_id ?? "");
      const blockHeight =
        typeof tx?.blockNumber === "number" ? tx.blockNumber : Number(tx?.blockNumber ?? 0) || 0;
      const timestamp =
        typeof tx?.block_timestamp === "number" ? tx.block_timestamp : Number(tx?.block_timestamp ?? 0) || 0;

      const contract = tx?.raw_data?.contract?.[0];
      const value = contract?.parameter?.value;
      const ownerHex = typeof value?.owner_address === "string" ? value.owner_address : "";
      const toHex = typeof value?.to_address === "string" ? value.to_address : "";

      const owner =
        ownerHex && ownerHex.startsWith("41") ? tronHexToBase58(ownerHex) : typeof value?.owner_address === "string" ? value.owner_address : "";
      const to =
        toHex && toHex.startsWith("41") ? tronHexToBase58(toHex) : typeof value?.to_address === "string" ? value.to_address : "";

      const toAddr = typeof to === "string" ? to : "";
      if (toAddr.toLowerCase() !== addressLower) return null;

      const amountSun =
        typeof value?.amount === "number" ? value.amount : Number(value?.amount ?? 0) || 0;

      return {
        chain,
        address,
        txHash,
        from: typeof owner === "string" ? owner : "",
        to: toAddr,
        amount: decimalStringFromBaseUnits(String(amountSun), 6),
        blockHeight,
        timestamp,
        status: "confirmed",
      };
    })
    .filter((tx: any) => tx?.txHash);
}
