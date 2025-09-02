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
        return 'text-white bg-white/20';
      case 'pending':
        return 'text-white bg-white/10';
      case 'failed':
        return 'text-white bg-white/5';
      default:
        return 'text-white/60 bg-white/5';
    }
  };

  const getTransactionIcon = (type) => {
    if (type === 'UPI_SEND') {
      return (
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden text-white">
      <div className="relative mt-20 z-10 overflow-auto h-screen space-y-6 p-4">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-3xl p-8 border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-0 mt-0 pt-0 pb-0">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl text-left font-bold text-white">
                  Web3 UPI Wallet</h1>
                <p className="text-white/70 text-lg">
                  Bridge the gap between crypto and traditional payments
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wallet Connection */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
            <WalletConnect />
          </div>

          {/* UPI Transfer */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
            <UPITransfer />
          </div>
        </div>

        {/* Transaction History */}
        {isConnected && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Transactions</h2>
              <button className="text-sm text-white/60 hover:text-white border border-white/20 px-4 py-2 rounded-full hover:bg-white/10 transition">
                View All
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-white/70 text-lg font-medium">No transactions yet</p>
                <p className="text-white/50">Your UPI transfers will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-lg">
                          {tx.type === 'UPI_SEND' ? 'Sent to' : 'Received from'} {tx.upiId}
                        </p>
                        <p className="text-white/60">{formatDate(tx.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white text-lg">
                        {tx.type === 'UPI_SEND' ? '-' : '+'}{tx.amount} ETH
                      </p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
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
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-8">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2 text-lg">Instant Transfers</h3>
              <p className="text-white/60">Send crypto to any UPI ID instantly</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl flex items-center justify-center group-hover:from-green-500/30 group-hover:to-green-600/30 transition">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2 text-lg">Secure Bridge</h3>
              <p className="text-white/60">Blockchain security meets UPI convenience</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2 text-lg">AI Powered</h3>
              <p className="text-white/60">Smart routing and optimization</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;
