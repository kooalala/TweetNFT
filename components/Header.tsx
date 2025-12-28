
import React from 'react';
import { BaseLogo } from '../constants';
import { AppView, XUser } from '../types';

interface HeaderProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  walletAddress: string | null;
  onConnectWallet: () => void;
  xUser: XUser | null;
  onConnectX: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  setView, 
  walletAddress, 
  onConnectWallet,
  xUser,
  onConnectX
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView(AppView.MARKETPLACE)}>
          <BaseLogo />
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            TweetBase
          </h1>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => setView(AppView.MARKETPLACE)}
            className={`text-sm font-semibold transition-colors ${currentView === AppView.MARKETPLACE ? 'text-blue-500' : 'text-slate-400 hover:text-white'}`}
          >
            Marketplace
          </button>
          <button 
            onClick={() => setView(AppView.MINT)}
            className={`text-sm font-semibold transition-colors ${currentView === AppView.MINT ? 'text-blue-500' : 'text-slate-400 hover:text-white'}`}
          >
            Tokenize Tweet
          </button>
          <button 
            onClick={() => setView(AppView.MY_NFTS)}
            className={`text-sm font-semibold transition-colors ${currentView === AppView.MY_NFTS ? 'text-blue-500' : 'text-slate-400 hover:text-white'}`}
          >
            My Collection
          </button>
        </nav>

        <div className="flex items-center space-x-4">
          <button
            onClick={onConnectX}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full font-bold text-sm transition-all border ${
              xUser 
                ? 'bg-black border-slate-700 text-white hover:bg-slate-900' 
                : 'bg-white text-black border-white hover:bg-slate-200'
            }`}
          >
            <i className={`fa-brands ${xUser ? 'fa-x-twitter' : 'fa-x-twitter text-slate-500'}`}></i>
            <span className="max-w-[120px] truncate">
              {xUser ? `@${xUser.username}` : 'Connect X'}
            </span>
          </button>

          <button
            onClick={onConnectWallet}
            className={`px-5 py-2 rounded-full font-bold text-sm transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2 ${
              walletAddress 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
            }`}
          >
            {walletAddress && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>}
            <span>
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connect Wallet'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
