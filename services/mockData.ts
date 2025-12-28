
import { BrowserProvider, JsonRpcProvider, Contract, formatEther, isAddress } from 'ethers';
import { TweetNFT } from '../types';
import { TWEET_NFT_ADDRESS, MARKETPLACE_ADDRESS, NETWORK_CONFIG } from '../config';
import TweetNFTABI from '../abis/TweetNFTABI.json';
import MarketplaceABI from '../abis/MarketplaceABI.json';

async function getProvider() {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return new BrowserProvider((window as any).ethereum);
  }
  return new JsonRpcProvider(NETWORK_CONFIG.rpcUrls[0]);
}

async function contractExists(address: string, provider: any): Promise<boolean> {
  try {
    const code = await provider.getCode(address);
    return code !== "0x" && code !== "0x0";
  } catch (e) { return false; }
}

async function parseMetadata(uri: string): Promise<any> {
  try {
    if (!uri) return {};
    if (uri.startsWith('data:application/json;base64,')) {
      return JSON.parse(atob(uri.split(',')[1]));
    }
    const response = await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/'));
    return await response.json();
  } catch (err) { return {}; }
}

export async function fetchMarketplaceNFTs(): Promise<TweetNFT[]> {
  try {
    const provider = await getProvider();
    if (!(await contractExists(MARKETPLACE_ADDRESS, provider))) return [];

    const nftContract = new Contract(TWEET_NFT_ADDRESS, TweetNFTABI, provider);
    const marketContract = new Contract(MARKETPLACE_ADDRESS, MarketplaceABI, provider);

    const activeIds: bigint[] = await marketContract.getActiveListings();
    const fetched: TweetNFT[] = [];

    for (const tokenId of activeIds) {
      try {
        const listing = await marketContract.getListing(tokenId);
        if (!listing.isListed) continue;

        const uri = await nftContract.tokenURI(tokenId);
        const metadata = await parseMetadata(uri);

        fetched.push({
          id: tokenId.toString(),
          tweetId: metadata.tweet_details?.id || 'unknown',
          content: metadata.description || '',
          author: metadata.attributes?.find((a: any) => a.trait_type === 'Author')?.value || 'Unknown',
          handle: metadata.attributes?.find((a: any) => a.trait_type === 'Handle')?.value || '@unknown',
          viewCount: metadata.attributes?.find((a: any) => a.trait_type === 'Views')?.value || 0,
          mintDate: "On-chain",
          owner: listing.seller,
          isListed: true,
          price: parseFloat(formatEther(listing.price)),
          imageUrl: metadata.image,
          metadataURI: uri
        });
      } catch (e) {}
    }
    return fetched;
  } catch (err) { return []; }
}

export async function fetchUserNFTs(walletAddress: string): Promise<TweetNFT[]> {
  if (!walletAddress || !isAddress(walletAddress)) return [];
  try {
    const provider = await getProvider();
    if (!(await contractExists(TWEET_NFT_ADDRESS, provider))) return [];

    const nftContract = new Contract(TWEET_NFT_ADDRESS, TweetNFTABI, provider);
    const marketContract = new Contract(MARKETPLACE_ADDRESS, MarketplaceABI, provider);

    const balance = await nftContract.balanceOf(walletAddress);
    const fetched: TweetNFT[] = [];

    for (let i = 0; i < Number(balance); i++) {
      try {
        const tokenId = await nftContract.tokenOfOwnerByIndex(walletAddress, i);
        const uri = await nftContract.tokenURI(tokenId);
        const metadata = await parseMetadata(uri);
        
        let listingData = { isListed: false, price: BigInt(0) };
        if (await contractExists(MARKETPLACE_ADDRESS, provider)) {
          listingData = await marketContract.getListing(tokenId);
        }

        fetched.push({
          id: tokenId.toString(),
          tweetId: metadata.tweet_details?.id || 'unknown',
          content: metadata.description || '',
          author: metadata.attributes?.find((a: any) => a.trait_type === 'Author')?.value || 'Unknown',
          handle: metadata.attributes?.find((a: any) => a.trait_type === 'Handle')?.value || '@unknown',
          viewCount: metadata.attributes?.find((a: any) => a.trait_type === 'Views')?.value || 0,
          mintDate: "On-chain",
          owner: walletAddress,
          isListed: listingData.isListed,
          price: listingData.isListed ? parseFloat(formatEther(listingData.price)) : undefined,
          imageUrl: metadata.image,
          metadataURI: uri
        });
      } catch (e) {}
    }
    return fetched;
  } catch (err) { return []; }
}
