import React from 'react'
import { useMetaMask } from '../../hooks/useMetaMask'

const MetaMaskConnect = () => {
  const { account, isConnected, chainId, connectWallet, isLoading } = useMetaMask()

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getChainName = (chainId) => {
    switch (chainId) {
      case '1':
        return 'Ethereum Mainnet'
      case '11155111':
        return 'Sepolia Testnet'
      case '137':
        return 'Polygon'
      case '80001':
        return 'Mumbai Testnet'
      default:
        return `Chain ${chainId}`
    }
  }

  const handleConnect = async () => {
    try {
      await connectWallet()
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  if (!window.ethereum) {
    return (
      <div className="text-center p-4">
        <p className="text-sm text-gray-600 mb-2">MetaMask not detected</p>
        <a
          href="https://metamask.io/download.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm underline"
        >
          Install MetaMask
        </a>
      </div>
    )
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            {formatAddress(account)}
          </div>
          <div className="text-xs text-gray-500">
            {getChainName(chainId)}
          </div>
        </div>
        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}

export default MetaMaskConnect
