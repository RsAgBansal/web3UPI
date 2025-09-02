import React, { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import CodeBlock from './CodeBlock'
import BlockchainActionCard from '../blockchain/BlockchainActionCard'

const ChatInterface = () => {
  // ✅ All required state variables properly declared
  const [userStatus, setUserStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your Solidity AI assistant. I can help you write, understand, and debug smart contracts. What would you like to work on today?',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Fetch user status when component mounts
    const fetchUserStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/user/status');
        if (!response.ok) {
          throw new Error('Failed to fetch user status');
        }
        const data = await response.json();
        setUserStatus(data);
        
        // Check if payment is required
        if (data.payment_required) {
          setPaymentInfo({
            amount_eth: data.payment_amount || "0.001",
            required: true
          });
          setShowPaymentModal(true);
        }
      } catch (err) {
        console.error('Error fetching user status:', err);
        setError(err.message);
        // Set default user status if API fails
        setUserStatus({
          requests_made: 0,
          free_limit: 1,
          payment_required: false
        });
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchUserStatus();
  }, []);

  // ✅ x402 Compliant Wallet Connection
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
          console.log('🔗 Wallet connected:', accounts[0]);
          
          // Hide payment modal once wallet is connected
          setShowPaymentModal(false);
          setPaymentInfo(null);
        }
      } else {
        alert('Please install MetaMask or another Web3 wallet');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  // ✅ x402 Compliant Payment Authorization Creation
  const createPaymentAuthorization = async (paymentRequirements) => {
    try {
      if (!walletConnected || !window.ethereum) {
        throw new Error('Wallet not connected');
      }

      const provider = window.ethereum;
      const amount = paymentRequirements.amount || "100000"; // 0.10 USDC (6 decimals)
      const nonce = Date.now().toString();
      
      // EIP-712 Domain for USDC on Base
      const domain = {
        name: 'USD Coin',
        version: '2',
        chainId: 8453, // Base mainnet
        verifyingContract: paymentRequirements.asset || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
      };

      // EIP-712 Types for transferWithAuthorization
      const types = {
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' }
        ]
      };

      // Payment message
      const message = {
        from: walletAddress,
        to: paymentRequirements.payTo,
        value: amount,
        validAfter: Math.floor(Date.now() / 1000),
        validBefore: Math.floor(Date.now() / 1000) + 3600, // 1 hour validity
        nonce: `0x${nonce.padStart(64, '0')}`
      };

      // Sign the typed data
      const signature = await provider.request({
        method: 'eth_signTypedData_v4',
        params: [walletAddress, JSON.stringify({ domain, types, primaryType: 'TransferWithAuthorization', message })]
      });

      // Return x402 compliant payment payload
      return JSON.stringify({
        scheme: 'eip3009',
        network: paymentRequirements.network || 'base-mainnet',
        asset: paymentRequirements.asset || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        authorization: {
          from: walletAddress,
          to: paymentRequirements.payTo,
          value: amount,
          validAfter: message.validAfter,
          validBefore: message.validBefore,
          nonce: message.nonce,
          signature: signature
        }
      });

    } catch (error) {
      console.error('Payment authorization failed:', error);
      throw error;
    }
  };

  // ✅ x402 Compliant Automatic Payment Flow
  const makeX402Request = async (endpoint, data) => {
    try {
      // Step 1: Try initial request
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      // Step 2: Handle 402 Payment Required
      if (response.status === 402) {
        const paymentRequirements = await response.json();
        
        if (!walletConnected) {
          // Show wallet connection modal
          setPaymentInfo({
            amount_eth: "0.001",
            required: true,
            requirements: paymentRequirements
          });
          setShowPaymentModal(true);
          throw new Error('Wallet connection required for payment');
        }

        setIsProcessingPayment(true);

        try {
          // Step 3: Create payment authorization
          const paymentPayload = await createPaymentAuthorization(paymentRequirements.accepts[0]);

          // Step 4: Retry request with X-PAYMENT header
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-PAYMENT': paymentPayload
            },
            body: JSON.stringify(data)
          });

          // Step 5: Check for payment response
          const paymentResponseHeader = response.headers.get('X-PAYMENT-RESPONSE');
          if (paymentResponseHeader) {
            console.log('✅ Payment processed:', paymentResponseHeader);
            
            // Update user status after successful payment
            setUserStatus(prev => ({
              ...prev,
              requests_made: 0, // Reset counter after payment
              payment_required: false
            }));

            const successMessage = {
              id: Date.now(),
              type: 'assistant',
              content: '✅ Payment processed successfully! Your access has been restored.',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, successMessage]);
          }

        } catch (paymentError) {
          console.error('Payment processing failed:', paymentError);
          throw new Error('Payment authorization failed. Please try again.');
        } finally {
          setIsProcessingPayment(false);
        }
      }

      return response;

    } catch (error) {
      setIsProcessingPayment(false);
      throw error;
    }
  };

  const regenerateResponse = async (userInput) => {
    setIsLoading(true);

    try {
      const response = await makeX402Request('http://localhost:8000/api/chat', {
        message: userInput
      });

      const data = await response.json();

      // Update user status with counter from backend response
      if (data.requests_made !== undefined) {
        setUserStatus(prev => ({
          ...prev,
          requests_made: data.requests_made,
          free_limit: data.free_limit || 1,
          remaining_requests: data.remaining || 0
        }));
      }

      let assistantContent = '';
      let assistantCode = '';
      let parsedResponse = null;
      let isBlockchainAction = false;
      
      if (data.success) {
        assistantContent = `Here's what I generated for you (regenerated):`;
        
        if (data.response) {
          try {
            let responseText = typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
            
            responseText = responseText
              .replace(/^json\s*/i, '')
              .replace(/^```/, '')
              .replace(/^```/, '')
              .replace(/```/, '')
              .trim();
            
            console.log('Cleaned response text (retry):', responseText);
            
            parsedResponse = JSON.parse(responseText);
            console.log('Parsed response (retry):', parsedResponse);
            
            if (parsedResponse && parsedResponse.action) {
              const blockchainActions = ['transfer_eth', 'deploy_contract', 'call_contract', 'get_balance', 'query_balance', 'create_contract'];
              isBlockchainAction = blockchainActions.includes(parsedResponse.action);
              console.log('Is blockchain action (retry):', isBlockchainAction, 'Action:', parsedResponse.action);
            }
            
            assistantCode = JSON.stringify(parsedResponse, null, 2);
          } catch (error) {
            console.error('Failed to parse response (retry):', error);
            assistantCode = data.response;
          }
        }

        if (data.context_chunks) {
          assistantContent += `\n\n📚 Context used from training data:\n${data.context_chunks}`;
        }
      } else {
        assistantContent = `Error: ${data.error}`;
      }

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: assistantContent,
        code: assistantCode,
        blockchainAction: isBlockchainAction ? parsedResponse : null,
        rawJson: data.raw_llm_output,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Regenerate API call failed:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `❌ Regeneration Error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await makeX402Request('http://localhost:8000/api/chat', {
        message: currentInput
      });

      const data = await response.json();

      // Update user status with real counter from backend
      if (data.requests_made !== undefined) {
        setUserStatus(prev => ({
          ...prev,
          requests_made: data.requests_made,
          free_limit: data.free_limit || 1,
          remaining_requests: data.remaining || 0
        }));
      }

      let assistantContent = '';
      let assistantCode = '';
      let parsedResponse = null;
      let isBlockchainAction = false;
      
      if (data.success) {
        assistantContent = `Here's what I generated for you:`;
        
        if (data.response) {
          try {
            let responseText = typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
            
            responseText = responseText
              .replace(/^json\s*/i, '')
              .replace(/^```json\s*/i, '')
              .replace(/^```/, '')
              .replace(/```$/, '')
              .trim();
              
            console.log('Cleaned response text:', responseText);
            
            parsedResponse = JSON.parse(responseText);
            console.log('Parsed response:', parsedResponse);
            
            if (parsedResponse && parsedResponse.action) {
              const blockchainActions = ['transfer_eth', 'deploy_contract', 'call_contract', 'get_balance', 'query_balance', 'create_contract'];
              isBlockchainAction = blockchainActions.includes(parsedResponse.action);
              console.log('Is blockchain action:', isBlockchainAction, 'Action:', parsedResponse.action);
            }
            
            assistantCode = JSON.stringify(parsedResponse, null, 2);
          } catch (error) {
            console.error('Failed to parse response:', error);
            assistantCode = data.response;
          }
        }

        if (data.context_chunks) {
          assistantContent += `\n\n📚 Context used from training data:\n${data.context_chunks}`;
        }
      } else {
        assistantContent = `Error: ${data.error}`;
      }

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: assistantContent,
        code: assistantCode,
        blockchainAction: isBlockchainAction ? parsedResponse : null,
        rawJson: data.raw_llm_output,
        userInput: currentInput,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('API call failed:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `❌ Connection Error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden text-white">
     <div className="relative z-10 overflow-auto h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Chat Header */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold">💎</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-left text-white">Payment Assistant</h2>
                  <p className="text-sm text-white/60">Blockchain operations & crypto payments</p>
                </div>
              </div>
  
              {/* User Status */}
              <div className="text-right">
                {userStatus && (
                  <>
                    <div className="text-xs text-white/60">
                    Requests: {userStatus.requests_made || 0} / {userStatus.free_limit || 1}
                    </div>
                    {userStatus.remaining_requests !== undefined && (
                      <div className="text-xs text-green-400">
                        Remaining: {userStatus.remaining_requests}
                      </div>
                    )}
                  </>
                )}
                {walletConnected && (
                  <div className="text-xs text-blue-400 mt-1">
                    🔗 {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </div>
                )}
              </div>
            </div>
          </div>
  
          {/* Messages Container */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map(message => (
              <div key={message.id}>
                <MessageBubble 
                  message={message} 
                  onRegenerate={message.userInput ? () => regenerateResponse(message.userInput) : null}
                />
                {message.code && (
                  <div className="mt-2">
                    <CodeBlock 
                      code={message.code} 
                      language="json"
                    />
                  </div>
                )}
                {message.blockchainAction && (
                  <div className="mt-4">
                    <BlockchainActionCard
                      actionData={message.blockchainAction}
                      onResult={(result) => {
                        console.log('Blockchain action result:', result);
                      }}
                      onRetry={() => {
                        if (message.userInput) {
                          regenerateResponse(message.userInput);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
            {(isLoading || isProcessingPayment) && (
              <div className="flex items-center justify-start">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 max-w-xs">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-white/60 text-sm">
                      {isProcessingPayment ? 'Processing payment...' : 'Thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
  
          {/* Input Area */}
          <div className="p-6 border-t border-white/10 bg-black/20">
            {/* x402 Compliant Payment Modal - Wallet Connection Only */}
            {showPaymentModal && (
              <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                <div className="mb-3">
                  <h3 className="text-yellow-400 font-semibold mb-2">💳 Connect Wallet for Payments</h3>
                  <p className="text-white/80 text-sm mb-3">
                    You've reached your free limit of {userStatus?.free_limit || 1} requests. 
                    Connect your wallet to enable automatic crypto payments.
                  </p>
                  {paymentInfo && (
                    <p className="text-yellow-300 text-sm mb-3">
                      ⚡ Payments will be processed automatically (~$0.10 USDC per request)
                    </p>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <small className="text-yellow-400/80">
                    x402 protocol - seamless crypto payments
                  </small>
                  <div className="flex space-x-2">
                    <button
                      onClick={connectWallet}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center space-x-2"
                    >
                      <span>🦊</span>
                      <span>Connect Wallet</span>
                    </button>
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="text-xs text-white/60 hover:text-white px-2 py-1 rounded"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to create a contract, explain code, or help debug..."
                rows="2"
                disabled={isLoading || isProcessingPayment}
                className="flex-1 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl resize-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-white placeholder-white/50 min-h-[60px]"
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading || isProcessingPayment}
                className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {(isLoading || isProcessingPayment) ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default ChatInterface
