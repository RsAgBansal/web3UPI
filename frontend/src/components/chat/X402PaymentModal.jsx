import React, { useState, useEffect } from 'react'
import { useMetaMask } from '../../hooks/useMetaMask'

const X402PaymentModal = ({ isOpen, onClose, paymentRequest, onPaymentSuccess }) => {
  const { account, isConnected, transferEth, isLoading } = useMetaMask()
  const [paymentStep, setPaymentStep] = useState('request') // request, processing, verifying, success, error
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPaymentStep('request')
      setTxHash('')
      setError('')
    }
  }, [isOpen])

  const handlePayment = async () => {
    if (!isConnected) {
      setError('Please connect your MetaMask wallet')
      return
    }

    if (!paymentRequest?.payment_required) {
      setError('No payment required')
      return
    }

    setIsProcessing(true)
    setPaymentStep('processing')
    setError('')

    try {
      // Execute ETH transaction
      const result = await transferEth(
        paymentRequest.payment_address,
        paymentRequest.amount_eth
      )

      if (result.success) {
        setTxHash(result.txHash)
        setPaymentStep('verifying')
        
        // Verify payment on backend
        await verifyPayment(result.txHash)
      } else {
        throw new Error(result.message || 'Payment transaction failed')
      }
    } catch (err) {
      setError(err.message || 'Payment failed')
      setPaymentStep('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const verifyPayment = async (txHash) => {
    try {
      const response = await fetch('http://localhost:8000/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_hash: txHash
        })
      })

      const data = await response.json()

      if (data.success && data.verification.success) {
        setPaymentStep('success')
        // Notify parent component
        if (onPaymentSuccess) {
          onPaymentSuccess(txHash, data.verification)
        }
      } else {
        throw new Error(data.verification?.error || 'Payment verification failed')
      }
    } catch (err) {
      setError(err.message || 'Verification failed')
      setPaymentStep('error')
    }
  }

  const handleRetry = () => {
    setPaymentStep('request')
    setError('')
    setTxHash('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Payment Required</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isProcessing}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Payment Request Step */}
        {paymentStep === 'request' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-blue-900">Free Requests Exhausted</h3>
              </div>
              <p className="text-sm text-blue-800">
                You've used all {paymentRequest?.user_status?.requests_used || 100} free requests. 
                Make a small payment to continue using the AI service.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Amount:</span>
                <span className="font-semibold">{paymentRequest?.amount_eth} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Access Duration:</span>
                <span className="font-semibold">{paymentRequest?.validity_hours} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Address:</span>
                <span className="font-mono text-sm break-all">{paymentRequest?.payment_address}</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Payment Instructions:</h4>
              <ol className="text-sm text-gray-700 space-y-1">
                {paymentRequest?.instructions?.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2 py-1 rounded-full min-w-[20px] text-center">
                      {index + 1}
                    </span>
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={!isConnected || isProcessing}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {!isConnected ? 'Connect Wallet First' : `Pay ${paymentRequest?.amount_eth} ETH`}
            </button>
          </div>
        )}

        {/* Processing Step */}
        {paymentStep === 'processing' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto mb-4">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Processing Payment...</h3>
            <p className="text-gray-600">Please confirm the transaction in MetaMask</p>
          </div>
        )}

        {/* Verifying Step */}
        {paymentStep === 'verifying' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto mb-4">
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Verifying Payment...</h3>
            <p className="text-gray-600">Transaction: {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}</p>
            <p className="text-sm text-gray-500">This may take a few moments</p>
          </div>
        )}

        {/* Success Step */}
        {paymentStep === 'success' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-900">Payment Successful!</h3>
            <p className="text-gray-600">
              Your access has been activated for {paymentRequest?.validity_hours} hours
            </p>
            <p className="text-sm text-gray-500">
              Transaction: {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
            </p>
            <button
              onClick={onClose}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700"
            >
              Continue to AI Chat
            </button>
          </div>
        )}

        {/* Error Step */}
        {paymentStep === 'error' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-900">Payment Failed</h3>
            <p className="text-gray-600">{error}</p>
            <div className="space-y-2">
              <button
                onClick={handleRetry}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default X402PaymentModal
