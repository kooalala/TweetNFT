
import React, { useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { verifyTweetData } from '../services/geminiService';
import { VerificationResult, TweetNFT, XUser } from '../types';
import { TWEET_NFT_ADDRESS } from '../config';
import TweetNFTABI from '../abis/TweetNFTABI.json';

interface MintSectionProps {
  onMintSuccess: (nft: TweetNFT) => void;
  walletAddress: string | null;
  xUser: XUser | null;
  onConnectX: () => void;
}

const MintSection: React.FC<MintSectionProps> = ({ onMintSuccess, walletAddress, xUser, onConnectX }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!walletAddress || !xUser) {
      alert("Please connect wallet and X first.");
      return;
    }
    setVerifying(true);
    setResult(null);
    try {
      const verifyInput = previewImage ? { base64: previewImage.split(',')[1], mimeType: 'image/jpeg' } : input;
      const data = await verifyTweetData(verifyInput, { id: xUser.id, username: xUser.username });
      if (data.error) alert(data.error);
      setResult(data);
    } catch (err) { alert("Verification failed."); } finally { setVerifying(false); }
  };

  const handleMint = async () => {
    if (!result?.isValid || !walletAddress) return;
    setLoading(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(TWEET_NFT_ADDRESS, TweetNFTABI, signer);

      const metadata = {
        name: `Tweet by ${result.author}`,
        description: result.content,
        image: previewImage || `https://picsum.photos/seed/${Date.now()}/600/400`,
        attributes: [
          { trait_type: "Author", value: result.author },
          { trait_type: "Handle", value: result.handle },
          { trait_type: "Views", value: result.viewCount }
        ],
        tweet_details: { id: input.split('/').pop() || "unknown" }
      };

      const metadataURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
      const tx = await contract.mintTweetNFT(metadata.tweet_details.id, metadataURI, walletAddress);
      setTxHash(tx.hash);
      const receipt = await tx.wait();

      alert(`Success! Tweet tokenized on Base Sepolia.`);
      onMintSuccess({
        id: receipt.logs[0]?.topics[3] || Math.random().toString(),
        tweetId: metadata.tweet_details.id,
        content: result.content, author: result.author, handle: result.handle,
        viewCount: result.viewCount, mintDate: new Date().toLocaleDateString(),
        owner: walletAddress, isListed: false, imageUrl: metadata.image, metadataURI
      });
    } catch (error: any) {
      alert(`Minting failed: ${error.reason || error.message}`);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="glass-card rounded-3xl p-8 shadow-2xl">
        <h2 className="text-3xl font-black mb-6">Tokenize Tweet</h2>
        {!xUser ? (
          <button onClick={onConnectX} className="w-full py-4 bg-white text-black font-bold rounded-xl">Connect X to Start</button>
        ) : (
          <div className="space-y-6">
            <textarea className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white h-24 outline-none" placeholder="Tweet URL or ID" value={input} onChange={(e) => setInput(e.target.value)} />
            <button onClick={handleVerify} disabled={verifying || loading} className="w-full py-4 bg-blue-600 rounded-xl font-bold">
              {verifying ? "Verifying..." : "Verify Ownership"}
            </button>
            {result?.isValid && (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <p className="text-emerald-400 font-bold mb-2">Verified: {result.viewCount.toLocaleString()} Views</p>
                <button onClick={handleMint} disabled={loading} className="w-full py-4 bg-blue-600 rounded-xl font-black">
                  {loading ? "Confirming..." : "Mint NFT on Base Sepolia"}
                </button>
                {txHash && <p className="text-[10px] mt-2 text-slate-500 truncate">Tx: {txHash}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MintSection;
