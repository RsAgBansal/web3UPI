import React, { useState, useEffect } from 'react';
import metamaskService from '../../services/metamask';

const UPITransfer = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [transferData, setTransferData] = useState({
    upiId: '',
    amount: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkWalletConnection();
    setupEventListeners();
    
    return () => {
      window.removeEventListener('metamask:accountChanged', handleAccountChanged);
    };
  }, []);

  const checkWalletConnection = async () => {
    const currentAccount = await metamaskService.getCurrentAccount();
    if (currentAccount) {
      setAccount(currentAccount);
      setIsConnected(true);
    }
  };

  const setupEventListeners = () => {
    window.addEventListener('metamask:accountChanged', handleAccountChanged);
  };

  const handleAccountChanged = (event) => {
    const { account } = event.detail;
    if (account) {
      setAccount(account);
      setIsConnected(true);
    } else {
      setAccount(null);
      setIsConnected(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTransferData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const validateUPIId = (upiId) => {
    // Basic UPI ID validation pattern
    const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiPattern.test(upiId);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!transferData.upiId || !transferData.amount) {
      setError('Please fill in all required fields');
      return;
    }

    if (!validateUPIId(transferData.upiId)) {
      setError('Please enter a valid UPI ID (e.g., user@paytm)');
      return;
    }

    if (parseFloat(transferData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // In a real implementation, you would:
      // 1. Convert UPI ID to blockchain address via your backend
      // 2. Create a smart contract transaction
      // 3. Handle the UPI bridge logic
      
      // For demo purposes, we'll simulate a transaction
      const simulatedRecipient = '0x742d35Cc6634C0532925a3b8D4C2C4e07c8b2b2f'; // Example address
      
      // Create transaction message with UPI details
      const transactionMessage = JSON.stringify({
        type: 'UPI_TRANSFER',
        upiId: transferData.upiId,
        amount: transferData.amount,
        message: transferData.message,
        timestamp: new Date().toISOString()
      });

      // Sign the message first (for verification)
      const signature = await metamaskService.signMessage(transactionMessage);
      console.log('Transaction signed:', signature);

      // Send the actual transaction
      const hash = await metamaskService.sendTransaction(
        simulatedRecipient,
        parseFloat(transferData.amount)
      );

      setTxHash(hash);
      
      // Reset form
      setTransferData({
        upiId: '',
        amount: '',
        message: ''
      });

      // In a real app, you would also:
      // - Send transaction details to your backend
      // - Trigger the UPI payment process
      // - Update transaction status

    } catch (error) {
      console.error('Transfer error:', error);
      setError(error.message || 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getExplorerUrl = (hash) => {
    // This would depend on the current network
    return `https://etherscan.io/tx/${hash}`;
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-2xl flex items-center justify-center">
          <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-3">Wallet Required</h3>
        <p className="text-white/70">
          Please connect your MetaMask wallet to make Bank Transfer
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl flex items-center justify-center">
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Web3 Bank Transfer</h2>
          <p className="text-white/70">Send crypto via Bank Transfer</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {txHash && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl backdrop-blur-sm">
          <p className="text-green-300 text-sm mb-2">✅ Transaction submitted successfully!</p>
          <a
            href={getExplorerUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 break-all font-mono"
          >
            {txHash}
          </a>
        </div>
      )}

      <form onSubmit={handleTransfer} className="space-y-6">
        <div>
          <label htmlFor="upiId" className="block text-sm font-medium text-white mb-2">
            BANK ADDRESS *
          </label>
          <input
            type="text"
            id="upiId"
            name="upiId"
            value={transferData.upiId}
            onChange={handleInputChange}
            placeholder="user@paytm"
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-transparent text-white placeholder-white/50 transition"
            required
          />
          <p className="text-xs text-white/60 mt-2">Enter the recipient's Bank Address</p>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-white mb-2">
            Amount (ETH) *
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={transferData.amount}
            onChange={handleInputChange}
            placeholder="0.01"
            step="0.001"
            min="0"
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-transparent text-white placeholder-white/50 transition"
            required
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
            Message (Optional)
          </label>
          <input
            type="text"
            id="message"
            name="message"
            value={transferData.message}
            onChange={handleInputChange}
            placeholder="Payment for..."
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-green-500/50 focus:border-transparent text-white placeholder-white/50 transition"
          />
        </div>

        

        <button
          type="submit"
          disabled={isLoading || !isConnected}
          className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl hover:from-green-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] shadow-xl"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send Payment
            </>
          )}
        </button>
      </form>

      <div className="text-xs text-white/50 text-center">
        Connected: {metamaskService.formatAddress && metamaskService.formatAddress(account)}
      </div>
    </div>
  );
};

export default UPITransfer;
