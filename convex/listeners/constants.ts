export const CHAIN_GROUP = {
  bitcoin: "utxo",
  doge: "utxo",
  litecoin: "utxo",

  ethereum: "evm",
  smartchain: "evm",
  bnb: "evm",
  polygon: "evm",

  "usdt-ethereum": "evm",
  "usdc-ethereum": "evm",
  "dai-ethereum": "evm",
  "usdt-polygon": "evm",
  "usdc-polygon": "evm",

  solana: "solana",
  tron: "tron",
  xrp: "xrp",
  atom: "cosmos",
  sei: "cosmos",
  inj: "cosmos",

  ton: "ton",
  polkadot: "polkadot",
} as const;
