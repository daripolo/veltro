import { internalQuery } from "./_generated/server";

export const getAll = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("crypto_vaults").collect().then(vaults => {
        // Map vaults to a structure compatible with the listener
        // The listener expects { chain, address }
        // crypto_vaults has addresses: v.record(v.string(), v.string()) where key is chain/symbol and value is address
        
        const result = [];
        for (const vault of vaults) {
            for (const [chain, address] of Object.entries(vault.addresses)) {
                // Normalize chain names if necessary to match CHAIN_GROUP keys in index.ts
                // Assuming vault.addresses keys match CHAIN_GROUP keys for now
                result.push({
                    userId: vault.userId,
                    chain: chain.toLowerCase(),
                    address: address
                });
            }
        }
        return result;
    });
  },
});
