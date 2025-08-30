import React, { useState, useEffect } from 'react';
import metamaskService from '../../services/metamask';

const WalletConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkConnection();
    setupEventListeners();
    
    return () => {
      // Cleanup event listeners
      window.removeEventListener('metamask:accountChanged', handleAccountChanged);
      window.removeEventListener('metamask:networkChanged', handleNetworkChanged);
    };
  }, []);

  const checkConnection = async () => {
    try {
      const currentAccount = await metamaskService.getCurrentAccount();
      if (currentAccount) {
        setAccount(currentAccount);
        setIsConnected(true);
        await loadAccountData(currentAccount);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const setupEventListeners = () => {
    window.addEventListener('metamask:accountChanged', handleAccountChanged);
    window.addEventListener('metamask:networkChanged', handleNetworkChanged);
  };

  const handleAccountChanged = (event) => {
    const { account } = event.detail;
    if (account) {
      setAccount(account);
      setIsConnected(true);
      loadAccountData(account);
    } else {
      handleDisconnect();
    }
  };

  const handleNetworkChanged = (event) => {
    const { chainId } = event.detail;
    setChainId(chainId);
    if (account) {
      loadAccountData(account);
    }
  };

  const loadAccountData = async (accountAddress) => {
    try {
      const [balance, chainId] = await Promise.all([
        metamaskService.getBalance(accountAddress),
        window.ethereum.request({ method: 'eth_chainId' })
      ]);
      setBalance(balance);
      setChainId(chainId);
    } catch (error) {
      console.error('Error loading account data:', error);
      setError('Failed to load account data');
    }
  };

  const handleConnect = async () => {
    if (!metamaskService.isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask extension.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { account, chainId } = await metamaskService.connectWallet();
      setAccount(account);
      setChainId(chainId);
      setIsConnected(true);
      await loadAccountData(account);
    } catch (error) {
      console.error('Connection error:', error);
      setError(error.message || 'Failed to connect to MetaMask');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await metamaskService.disconnectWallet();
    setIsConnected(false);
    setAccount(null);
    setBalance(null);
    setChainId(null);
    setError(null);
  };

  const switchToBase = async () => {
    try {
      await metamaskService.switchNetwork('0x2105'); // Base mainnet
    } catch (error) {
      console.error('Error switching to Base:', error);
      setError('Failed to switch to Base network');
    }
  };

  const switchToBaseSepolia = async () => {
    try {
      await metamaskService.switchNetwork('0x14a34'); // Base Sepolia testnet
    } catch (error) {
      console.error('Error switching to Base Sepolia:', error);
      setError('Failed to switch to Base Sepolia network');
    }
  };

  if (!metamaskService.isMetaMaskInstalled()) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">MetaMask Required</h3>
          <p className="text-gray-600 mb-4">
            Please install MetaMask extension to connect your wallet and use Web3 UPI features.
          </p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Install MetaMask
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Wallet Connection</h2>
        {isConnected && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
            Connected
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600 mb-4">
            Connect your MetaMask wallet to start using Web3 UPI features.
          </p>
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                </svg>
                Connect MetaMask
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Account Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Account</span>
              <button
                onClick={handleDisconnect}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Disconnect
              </button>
            </div>
            <p className="text-sm font-mono text-gray-900 break-all">{account}</p>
          </div>

          {/* Balance */}
          {balance && (
            <div className="bg-gray-50 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-700">Balance</span>
              <p className="text-lg font-semibold text-gray-900">{balance} ETH</p>
            </div>
          )}

          {/* Network */}
          {chainId && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Network</span>
                <span className="text-sm text-gray-500">{chainId}</span>
              </div>
              <p className="text-sm text-gray-900">{metamaskService.getNetworkName(chainId)}</p>
            </div>
          )}

          {/* Network Switch Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={switchToBase}
              className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Switch to Base
            </button>
            <button
              onClick={switchToBaseSepolia}
              className="flex-1 px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              Base Sepolia
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
