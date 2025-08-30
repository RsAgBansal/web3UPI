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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Wallet Required</h3>
          <p className="text-gray-600">
            Please connect your MetaMask wallet to make UPI transfers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Web3 UPI Transfer</h2>
          <p className="text-sm text-gray-600">Send crypto via UPI ID</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {txHash && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600 mb-2">✅ Transaction submitted successfully!</p>
          <a
            href={getExplorerUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 break-all"
          >
            {txHash}
          </a>
        </div>
      )}

      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">
            UPI ID *
          </label>
          <input
            type="text"
            id="upiId"
            name="upiId"
            value={transferData.upiId}
            onChange={handleInputChange}
            placeholder="user@paytm"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Enter the recipient's UPI ID</p>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message (Optional)
          </label>
          <input
            type="text"
            id="message"
            name="message"
            value={transferData.message}
            onChange={handleInputChange}
            placeholder="Payment for..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">How it works</p>
              <p className="text-xs text-blue-600 mt-1">
                Your crypto will be converted and sent to the UPI ID via our bridge system. 
                The recipient will receive INR in their UPI account.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !isConnected}
          className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      <div className="mt-4 text-xs text-gray-500 text-center">
        Connected: {metamaskService.formatAddress(account)}
      </div>
    </div>
  );
};

export default UPITransfer;
