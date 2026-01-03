// constants.tsx - CONFIGURATION FOR YOUR TWEETNFT APP
export const CONFIG = {
  NETWORK: {
    NAME: "Base Sepolia",                    // The blockchain we're using
    RPC_URL: "https://sepolia.base.org",     // Connection endpoint to Base
    CHAIN_ID: 84532,                         // Base Sepolia's ID number
  },
  CONTRACTS: {
    // ⚠️ IMPORTANT: You need to decide which is which!
    // Look at your two addresses and think:
    // Which one MINTs NFTs? Which one SELLS them?
    
    TWEET_NFT: "0xf713Ef91A80566247Ae59A8c17fD06f1e6fc4B41",    
    MARKETPLACE: "0x28Eb94897A49a3FEbe0890951939F0EA70bDdcfC"   // <-- Replace if wrong!
  }
};
