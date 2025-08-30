import React, { useState, useEffect } from 'react';
import WalletConnect from './WalletConnect';
import UPITransfer from './UPITransfer';
import metamaskService from '../../services/metamask';

const WalletDashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);

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
      loadTransactionHistory();
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
      loadTransactionHistory();
    } else {
      setAccount(null);
      setIsConnected(false);
      setTransactions([]);
    }
  };

  const loadTransactionHistory = () => {
    // In a real app, this would fetch from your backend
    // For now, we'll use mock data
    const mockTransactions = [
      {
        id: '1',
        type: 'UPI_SEND',
        upiId: 'john@paytm',
        amount: '0.05',
        status: 'completed',
        timestamp: '2024-08-30T10:30:00Z',
        txHash: '0x1234...5678'
      },
      {
        id: '2',
        type: 'UPI_RECEIVE',
        upiId: 'alice@gpay',
        amount: '0.02',
        status: 'completed',
        timestamp: '2024-08-29T15:45:00Z',
        txHash: '0x9876...5432'
      }
    ];
    setTransactions(mockTransactions);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTransactionIcon = (type) => {
    if (type === 'UPI_SEND') {
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Web3 UPI Wallet</h1>
        <p className="text-blue-100">
          Bridge the gap between crypto and traditional payments
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wallet Connection */}
        <div>
          <WalletConnect />
        </div>

        {/* UPI Transfer */}
        <div>
          <UPITransfer />
        </div>
      </div>

      {/* Transaction History */}
      {isConnected && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              View All
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400">Your UPI transfers will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {tx.type === 'UPI_SEND' ? 'Sent to' : 'Received from'} {tx.upiId}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(tx.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {tx.type === 'UPI_SEND' ? '-' : '+'}{tx.amount} ETH
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Features Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Instant Transfers</h3>
            <p className="text-sm text-gray-600">Send crypto to any UPI ID instantly</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Secure Bridge</h3>
            <p className="text-sm text-gray-600">Blockchain security meets UPI convenience</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M15 5l2 2" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">AI Powered</h3>
            <p className="text-sm text-gray-600">Smart routing and optimization</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;
