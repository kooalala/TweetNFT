// services/walletService.ts
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const connectWallet = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask or Coinbase Wallet!");
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    console.log("Connected wallet:", accounts[0]);
    return {
      address: accounts[0],
      signer,
      provider,
    };
  } catch (error) {
    console.error("Wallet connection failed:", error);
    alert("Failed to connect wallet. Check console for details.");
    return null;
  }
};
