import React, { useState } from 'react'
import { useMetaMask } from '../../hooks/useMetaMask'

const BlockchainActionCard = ({ actionData, onResult, onRetry }) => {
  const { executeBlockchainAction, isConnected, account } = useMetaMask()
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState(null)

  console.log('BlockchainActionCard rendered with actionData:', actionData)
  console.log('MetaMask connection status:', isConnected, 'Account:', account)

  const handleExecute = async () => {
    console.log('Execute button clicked!')
    if (!isConnected) {
      console.log('MetaMask not connected')
      onResult({
        success: false,
        message: 'Please connect your MetaMask wallet first'
      })
      return
    }

    setIsExecuting(true)
    try {
      console.log('Executing blockchain action:', actionData)
      const executionResult = await executeBlockchainAction(actionData)
      console.log('Execution result:', executionResult)
      setResult(executionResult)
      onResult(executionResult)
    } catch (error) {
      console.error('Execution failed:', error)
      const errorResult = {
        success: false,
        message: error.message
      }
      setResult(errorResult)
      onResult(errorResult)
    } finally {
      setIsExecuting(false)
    }
  }

  const getActionDescription = () => {
    switch (actionData.action) {
      case 'transfer_eth':
        return `Transfer ${actionData.amount} ETH to ${actionData.recipient}`
      case 'deploy_contract':
        return `Deploy smart contract${actionData.contractName ? ` (${actionData.contractName})` : ''}`
      case 'call_contract':
        return `Call ${actionData.method} on contract ${actionData.contractAddress}`
      case 'get_balance':
      case 'query_balance':
        return `Check balance of ${actionData.address || 'your account'}`
      default:
        return `Execute ${actionData.action}`
    }
  }

  const getActionIcon = () => {
    switch (actionData.action) {
      case 'transfer_eth':
        return '💸'
      case 'deploy_contract':
        return '📋'
      case 'call_contract':
        return '⚙️'
      case 'get_balance':
      case 'query_balance':
        return '💰'
      default:
        return '🔗'
    }
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getActionIcon()}</span>
          <div>
            <h4 className="font-semibold text-gray-900">Blockchain Action</h4>
            <p className="text-sm text-gray-600">{getActionDescription()}</p>
          </div>
        </div>
        
        {isConnected ? (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Connected: {formatAddress(account)}
          </span>
        ) : (
          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
            Wallet Not Connected
          </span>
        )}
      </div>

      {/* Action Details */}
      <div className="bg-white rounded p-3 mb-3 text-sm">
        <pre className="text-gray-700 whitespace-pre-wrap">
          {JSON.stringify(actionData, null, 2)}
        </pre>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`p-3 rounded mb-3 text-sm ${
          result.success 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2 mb-1">
            <span>{result.success ? '✅' : '❌'}</span>
            <span className="font-medium">
              {result.success ? 'Success' : 'Error'}
            </span>
          </div>
          <p>{result.message}</p>
          
          {result.success && result.txHash && (
            <div className="mt-2">
              <span className="font-medium">Transaction: </span>
              <a 
                href={`https://etherscan.io/tx/${result.txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {formatAddress(result.txHash)}
              </a>
            </div>
          )}
          
          {result.success && result.contractAddress && (
            <div className="mt-1">
              <span className="font-medium">Contract: </span>
              <a 
                href={`https://etherscan.io/address/${result.contractAddress}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {formatAddress(result.contractAddress)}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Execute and Retry Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={handleExecute}
          disabled={isExecuting || result?.success}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            isExecuting
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : result?.success
              ? 'bg-green-200 text-green-800 cursor-not-allowed'
              : isConnected
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isExecuting 
            ? 'Executing...' 
            : result?.success 
            ? 'Executed ✓' 
            : isConnected 
            ? 'Execute with MetaMask' 
            : 'Connect Wallet First'
          }
        </button>
        
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isExecuting}
            className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
              isExecuting
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
            title="Generate a new response"
          >
            🔄 Retry
          </button>
        )}
      </div>
    </div>
  )
}

export default BlockchainActionCard
