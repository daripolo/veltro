"use node";

import { initWasm } from "@trustwallet/wallet-core";
import { readFileSync } from "fs";
import { createRequire } from "module";
import path from "path";

let walletCorePromise: ReturnType<typeof initWasm> | null = null;

async function loadWalletCoreWasmBinary() {
  const require = createRequire(import.meta.url);

  try {
    const entryPath = require.resolve("@trustwallet/wallet-core/dist/index.js");
    const wasmPath = path.join(path.dirname(entryPath), "lib", "wallet-core.wasm");
    return new Uint8Array(readFileSync(wasmPath));
  } catch {
    let version = "4.5.0";
    try {
      const pkgJsonPath = require.resolve("@trustwallet/wallet-core/package.json");
      const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as { version?: string };
      if (pkg.version) version = pkg.version;
    } catch {}

    const urls = [
      `https://cdn.jsdelivr.net/npm/@trustwallet/wallet-core@${version}/dist/lib/wallet-core.wasm`,
      `https://unpkg.com/@trustwallet/wallet-core@${version}/dist/lib/wallet-core.wasm`,
    ];

    let lastError: unknown = null;
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch wallet-core.wasm: ${res.status} ${res.statusText}`);
        return new Uint8Array(await res.arrayBuffer());
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError;
  }
}

export function getWalletCore() {
  if (!walletCorePromise) {
    walletCorePromise = (async () => {
      const wasmBinary = await loadWalletCoreWasmBinary();
      return (initWasm as unknown as (options: { wasmBinary: Uint8Array }) => ReturnType<typeof initWasm>)({
        wasmBinary,
      });
    })();
  }
  return walletCorePromise;
}
