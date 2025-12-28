
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MintSection from './components/MintSection';
import Marketplace from './components/Marketplace';
import MyNFTs from './components/MyNFTs';
import { AppView, TweetNFT, XUser, EIP6963ProviderDetail } from './types';
import { BASE_SEPOLIA_CHAIN_ID, NETWORK_CONFIG } from './config';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.MARKETPLACE);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<any>(null);
  const [xUser, setXUser] = useState<XUser | null>(null);
  
  const [discoveredProviders, setDiscoveredProviders] = useState<EIP6963ProviderDetail[]>([]);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  useEffect(() => {
    const onAnnouncement = (event: any) => {
      const detail = event.detail as EIP6963ProviderDetail;
      setDiscoveredProviders(prev => {
        if (prev.find(p => p.info.uuid === detail.info.uuid)) return prev;
        return [...prev, detail];
      });
    };
    window.addEventListener("eip6963:announceProvider", onAnnouncement);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    const timer = setTimeout(() => {
      if ((window as any).ethereum && discoveredProviders.length === 0) {
         setDiscoveredProviders([{
            info: { uuid: 'injected', name: 'MetaMask', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg', rdns: 'io.metamask' },
            provider: (window as any).ethereum
         }]);
      }
    }, 1000);

    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnouncement);
      clearTimeout(timer);
    };
  }, [discoveredProviders.length]);

  const checkNetwork = useCallback(async (provider: any) => {
    if (!provider) return false;
    try {
      const chainId = await provider.request({ method: 'eth_chainId' });
      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
          });
          return true;
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            try {
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: BASE_SEPOLIA_CHAIN_ID,
                  chainName: NETWORK_CONFIG.chainName,
                  nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                  rpcUrls: NETWORK_CONFIG.rpcUrls,
                  blockExplorerUrls: NETWORK_CONFIG.blockExplorerUrls,
                }],
              });
              return true;
            } catch (addError) { return false; }
          }
          return false;
        }
      }
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  const connectWallet = async (walletDetail: EIP6963ProviderDetail) => {
    setIsConnectingWallet(true);
    try {
      const { provider } = walletDetail;
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const isCorrectNetwork = await checkNetwork(provider);
      if (isCorrectNetwork) {
        setWalletAddress(accounts[0]);
        setActiveProvider(provider);
        setShowWalletModal(false);
        (window as any).ethereum = provider;
        provider.on('accountsChanged', (accs: string[]) => setWalletAddress(accs[0] || null));
        provider.on('chainChanged', () => window.location.reload());
      } else {
        alert("Please switch to Base Sepolia Testnet.");
      }
    } catch (err: any) {
      if (err.code !== 4001) alert(`Error: ${err.message}`);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const connectX = async () => {
    if (xUser) { setXUser(null); return; }
    const popup = window.open('https://twitter.com/i/oauth2/authorize?client_id=demo', 'X Auth', 'width=600,height=600');
    const poll = setInterval(() => {
      if (popup?.closed) {
        clearInterval(poll);
        setXUser({
          id: "x_user_999",
          username: "base_creator",
          displayName: "Base Enthusiast",
          profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=base"
        });
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-['Inter']">
      <Header 
        currentView={currentView} setView={setCurrentView} 
        walletAddress={walletAddress} onConnectWallet={() => walletAddress ? setWalletAddress(null) : setShowWalletModal(true)}
        xUser={xUser} onConnectX={connectX}
      />
      
      <main className="flex-grow">
        {currentView === AppView.MARKETPLACE && <Marketplace walletAddress={walletAddress} />}
        {currentView === AppView.MINT && <MintSection onMintSuccess={() => setCurrentView(AppView.MY_NFTS)} walletAddress={walletAddress} xUser={xUser} onConnectX={connectX} />}
        {currentView === AppView.MY_NFTS && <MyNFTs walletAddress={walletAddress} />}
      </main>

      {showWalletModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass-card w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
            <button onClick={() => setShowWalletModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
            <h3 className="text-2xl font-black mb-6 text-center">Connect Wallet</h3>
            <div className="space-y-3">
              {discoveredProviders.map((wallet) => (
                <button key={wallet.info.uuid} onClick={() => connectWallet(wallet)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700 transition-all">
                  <div className="flex items-center space-x-3">
                    <img src={wallet.info.icon} className="w-8 h-8 rounded-lg" alt={wallet.info.name} />
                    <span className="font-bold">{wallet.info.name}</span>
                  </div>
                  <i className="fa-solid fa-chevron-right text-slate-600"></i>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="py-8 px-6 border-t border-slate-900 text-center text-slate-600 text-sm">
        Built on Base Sepolia • Testing Environment
      </footer>
    </div>
  );
};

export default App;
