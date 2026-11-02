export async function scanTON(chain: string, address: string) {
  const baseUrl = "https://tonapi.io";

  const res = await fetch(`${baseUrl}/v2/accounts/${address}/events`);
  const json = await res.json();

  if (!json.events || !Array.isArray(json.events)) return [];

  return json.events.map((e: any) => ({
    chain,
    address,
    txHash: e.event_id,
    amount: e.actions?.[0]?.amount?.toString() || "0",
    blockHeight: e.lt,
    timestamp: e.timestamp * 1000,
    status: "confirmed",
  }));
}
