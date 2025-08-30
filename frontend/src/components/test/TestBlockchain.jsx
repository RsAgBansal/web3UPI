import React, { useState } from 'react'
import BlockchainActionCard from '../blockchain/BlockchainActionCard'
import { useMetaMask } from '../../hooks/useMetaMask'

const TestBlockchain = () => {
  const { isConnected, account, connectWallet } = useMetaMask()
  const [testResult, setTestResult] = useState(null)

  // Sample blockchain actions for testing
  const sampleTransferAction = {
    action: 'transfer_eth',
    recipient: '0x742d35Cc6dB49532C747114C37f8D72A9C9E3bEf',
    amount: 0.001
  }

  const sampleBalanceAction = {
    action: 'get_balance',
    address: account || '0x742d35Cc6dB49532C747114C37f8D72A9C9E3bEf'
  }

  const handleTestResult = (result) => {
    setTestResult(result)
    console.log('Test result:', result)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🧪 Blockchain Integration Test</h1>
      
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Connection Status</h2>
        {isConnected ? (
          <div className="text-green-600">
            ✅ Connected: {account?.slice(0, 10)}...{account?.slice(-8)}
          </div>
        ) : (
          <div>
            <div className="text-red-600 mb-2">❌ Not connected</div>
            <button
              onClick={connectWallet}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Connect MetaMask
            </button>
          </div>
        )}
      </div>

      {/* Test Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Blockchain Actions</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Test Transfer ETH Action:</h3>
            <BlockchainActionCard
              actionData={sampleTransferAction}
              onResult={handleTestResult}
            />
          </div>

          <div>
            <h3 className="font-medium mb-2">Test Get Balance Action:</h3>
            <BlockchainActionCard
              actionData={sampleBalanceAction}
              onResult={handleTestResult}
            />
          </div>
        </div>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Last Test Result</h2>
          <div className={`p-3 rounded ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <div className="font-medium mb-1">
              {testResult.success ? '✅ Success' : '❌ Failed'}
            </div>
            <div className="text-sm">{testResult.message}</div>
            {testResult.txHash && (
              <div className="text-xs mt-1">
                TxHash: {testResult.txHash}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-4 mt-6">
        <h3 className="font-medium text-blue-900 mb-2">💡 Instructions:</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Make sure MetaMask is installed and connected</li>
          <li>2. Switch to a testnet (like Sepolia) to avoid real costs</li>
          <li>3. Ensure you have some test ETH for gas fees</li>
          <li>4. Click "Execute Transaction" on any action above</li>
          <li>5. Check browser console for detailed logs</li>
        </ol>
      </div>
    </div>
  )
}

export default TestBlockchain
