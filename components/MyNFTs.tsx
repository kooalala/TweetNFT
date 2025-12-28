
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract, parseEther } from 'ethers';
import { TweetNFT } from '../types';
import { fetchUserNFTs } from '../services/mockData';
import { MARKETPLACE_ADDRESS, TWEET_NFT_ADDRESS } from '../config';
import MarketplaceABI from '../abis/MarketplaceABI.json';
import TweetNFTABI from '../abis/TweetNFTABI.json';

interface MyNFTsProps {
  walletAddress: string | null;
}

const MyNFTs: React.FC<MyNFTsProps> = ({ walletAddress }) => {
  const [myNfts, setMyNfts] = useState<TweetNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [listingId, setListingId] = useState<string | null>(null);
  const [price, setPrice] = useState('0.01');
  const [isApproved, setIsApproved] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const data = await fetchUserNFTs(walletAddress);
      setMyNfts(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [walletAddress]);

  useEffect(() => { loadData(); }, [loadData]);

  const checkApproval = async () => {
    if (!walletAddress) return;
    const provider = new BrowserProvider((window as any).ethereum);
    const contract = new Contract(TWEET_NFT_ADDRESS, TweetNFTABI, provider);
    const approved = await contract.isApprovedForAll(walletAddress, MARKETPLACE_ADDRESS);
    setIsApproved(approved);
  };

  useEffect(() => { if (listingId) checkApproval(); }, [listingId]);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(TWEET_NFT_ADDRESS, TweetNFTABI, signer);
      const tx = await contract.setApprovalForAll(MARKETPLACE_ADDRESS, true);
      await tx.wait();
      setIsApproved(true);
      alert("Marketplace Approved!");
    } catch (err: any) { alert("Approval failed."); } finally { setProcessing(false); }
  };

  const handleList = async () => {
    if (!listingId) return;
    setProcessing(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const marketContract = new Contract(MARKETPLACE_ADDRESS, MarketplaceABI, signer);
      const tx = await marketContract.listNFT(BigInt(listingId), parseEther(price));
      await tx.wait();
      alert("Listed on Marketplace!");
      setListingId(null);
      loadData();
    } catch (err: any) { alert("Listing failed."); } finally { setProcessing(false); }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <h2 className="text-4xl font-black mb-8">My Vault</h2>
      {loading ? <div className="text-center py-20">Accessing Vault...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {myNfts.map(nft => (
            <div key={nft.id} className="glass-card rounded-3xl p-6 border border-slate-700">
              <img src={nft.imageUrl} className="w-full h-40 object-cover rounded-xl mb-4" alt="NFT" />
              <p className="font-bold mb-1">{nft.author}</p>
              <div className="flex justify-between items-center mb-6">
                 <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${nft.isListed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                   {nft.isListed ? 'Listed' : 'Vaulted'}
                 </span>
                 <p className="text-xs text-slate-500">{nft.viewCount.toLocaleString()} Views</p>
              </div>
              <button onClick={() => setListingId(nft.id)} className="w-full py-3 bg-blue-600 font-bold rounded-xl">Manage Asset</button>
            </div>
          ))}
        </div>
      )}

      {listingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="glass-card max-w-sm w-full p-8 rounded-3xl relative">
            <h3 className="text-2xl font-black mb-6">List for Sale</h3>
            {!isApproved ? (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">You must approve the Marketplace contract to list this asset.</p>
                <button onClick={handleApprove} disabled={processing} className="w-full py-4 bg-white text-black font-bold rounded-xl">
                   {processing ? "Approving..." : "Approve Marketplace"}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white text-2xl font-bold" value={price} onChange={e => setPrice(e.target.value)} />
                <div className="flex space-x-4">
                  <button onClick={() => setListingId(null)} className="flex-1 py-4 bg-slate-800 rounded-xl">Cancel</button>
                  <button onClick={handleList} disabled={processing} className="flex-1 py-4 bg-blue-600 rounded-xl font-bold">List NFT</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyNFTs;
