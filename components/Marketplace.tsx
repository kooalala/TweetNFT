
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract, parseEther } from 'ethers';
import { TweetNFT } from '../types';
import { fetchMarketplaceNFTs } from '../services/mockData';
import { MARKETPLACE_ADDRESS } from '../config';
import MarketplaceABI from '../abis/MarketplaceABI.json';

interface MarketplaceProps {
  walletAddress: string | null;
}

const Marketplace: React.FC<MarketplaceProps> = ({ walletAddress }) => {
  const [listedNfts, setListedNfts] = useState<TweetNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMarketplaceNFTs();
      setListedNfts(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleBuy = async (nft: TweetNFT) => {
    if (!walletAddress) { alert("Connect wallet first."); return; }
    setBuyingId(nft.id);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const marketContract = new Contract(MARKETPLACE_ADDRESS, MarketplaceABI, signer);
      const tx = await marketContract.buyNFT(BigInt(nft.id), { value: parseEther(nft.price?.toString() || '0') });
      await tx.wait();
      alert("Purchase Success!");
      loadData();
    } catch (err: any) { alert(`Purchase failed: ${err.reason || err.message}`); } finally { setBuyingId(null); }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <h2 className="text-4xl font-black mb-8">Base Sepolia Marketplace</h2>
      {loading ? <div className="text-center py-20 animate-pulse">Scanning blockchain...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {listedNfts.map(nft => (
            <div key={nft.id} className="glass-card rounded-3xl p-6 border border-slate-700">
              <img src={nft.imageUrl} className="w-full h-40 object-cover rounded-xl mb-4" alt="NFT" />
              <p className="font-bold text-blue-400 mb-1">{nft.handle}</p>
              <p className="text-slate-300 text-sm line-clamp-2 mb-4 h-10">"{nft.content}"</p>
              <div className="flex justify-between items-center mb-6">
                <div><p className="text-[10px] text-slate-500 uppercase font-bold">Price</p><p className="text-xl font-black">{nft.price} ETH</p></div>
                <div className="text-right"><p className="text-[10px] text-slate-500 uppercase font-bold">Views</p><p className="font-bold">{nft.viewCount.toLocaleString()}</p></div>
              </div>
              <button onClick={() => handleBuy(nft)} disabled={!!buyingId} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                {buyingId === nft.id ? "Processing..." : "Buy NFT"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
