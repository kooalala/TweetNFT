export interface XUser {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string;
}

export interface TweetNFT {
  id: string;
  tweetId: string;
  content: string;
  author: string;
  handle: string;
  viewCount: number;
  mintDate: string;
  owner: string;
  price?: number; // In ETH
  isListed: boolean;
  imageUrl?: string;
  metadataURI: string;
  transactionHash?: string;
}

export interface VerificationResult {
  isValid: boolean;
  viewCount: number;
  content: string;
  author: string;
  handle: string;
  error?: string;
  isOwner?: boolean;
  tweetId?: string;
  metadataURI?: string;
}

export interface MarketplaceListing {
  listingId: string;
  tokenId: string;
  seller: string; // wallet address
  price: number; // In ETH
  isActive: boolean;
  metadataURI: string;
}

export enum AppView {
  MINT = 'MINT',
  MARKETPLACE = 'MARKETPLACE',
  MY_NFTS = 'MY_NFTS'
}

// EIP-6963 Types for Multi-Wallet Support
export interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: any;
}
