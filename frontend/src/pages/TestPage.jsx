import React from 'react'
import BlockchainActionCard from '../components/blockchain/BlockchainActionCard'
import MetaMaskConnect from '../components/wallet/MetaMaskConnect'

const TestPage = () => {
  // Example blockchain actions for testing
  const exampleActions = [
    {
      action: 'transfer_eth',
      recipient: '0x742d35Cc3Bf34CbC5598d66d3af3c3c4bF1C4470',
      amount: 0.01
    },
    {
      action: 'get_balance',
      address: '0x742d35Cc3Bf34CbC5598d66d3af3c3c4bF1C4470'
    },
    {
      action: 'deploy_contract',
      bytecode: '0x608060405234801561001057600080fd5b50',
      abi: [],
      contractName: 'SimpleStorage'
    }
  ]

  const handleActionResult = (result) => {
    console.log('Blockchain action result:', result)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">MetaMask Integration Test</h1>
        
        {/* MetaMask Connection Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>
          <MetaMaskConnect />
        </div>

        {/* Example Actions */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Example Blockchain Actions</h2>
          
          {exampleActions.map((action, index) => (
            <BlockchainActionCard
              key={index}
              actionData={action}
              onResult={handleActionResult}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Test:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Make sure you have MetaMask installed</li>
            <li>Connect your wallet using the button above</li>
            <li>Switch to a testnet (Sepolia recommended) for safe testing</li>
            <li>Try executing the blockchain actions above</li>
            <li>Check the transaction results in MetaMask and on Etherscan</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default TestPage
