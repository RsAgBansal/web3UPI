import React, { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import CodeBlock from './CodeBlock'
import BlockchainActionCard from '../blockchain/BlockchainActionCard'

const ChatInterface = () => {
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
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const regenerateResponse = async (userInput) => {
    setIsLoading(true)

    try {
      // Call the backend API again with the same input
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      let assistantContent = ''
      let assistantCode = ''
      let parsedResponse = null
      let isBlockchainAction = false
      
      if (data.success) {
        // Display the LLM response
        assistantContent = `Here's what I generated for you (regenerated):`
        
        // Parse the JSON response to check if it's a blockchain action
        if (data.response) {
          try {
            let responseText = typeof data.response === 'string' ? data.response : JSON.stringify(data.response)
            
            // Remove common prefixes that might break JSON parsing
            responseText = responseText
            responseText = responseText
            .replace(/^json\s*/i, '')       // Remove leading "json"
            .replace(/^```json\s*/i, '')    // Remove ```json
            .replace(/^```/, '')            // Remove opening ```
            .replace(/```$/, '')            // Remove trailing ```
            .trim();
            
            console.log('Cleaned response text (retry):', responseText)
            
            parsedResponse = JSON.parse(responseText)
            console.log('Parsed response (retry):', parsedResponse)
            
            // Check if this is a blockchain action
            if (parsedResponse && parsedResponse.action) {
              const blockchainActions = ['transfer_eth', 'deploy_contract', 'call_contract', 'get_balance', 'query_balance', 'create_contract']
              isBlockchainAction = blockchainActions.includes(parsedResponse.action)
              console.log('Is blockchain action (retry):', isBlockchainAction, 'Action:', parsedResponse.action)
            }
            
            assistantCode = JSON.stringify(parsedResponse, null, 2)
          } catch (error) {
            console.error('Failed to parse response (retry):', error)
            console.log('Raw response (retry):', data.response)
            
            // Try to extract JSON from text if parsing failed
            try {
              const jsonMatch = data.response.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                parsedResponse = JSON.parse(jsonMatch[0])
                if (parsedResponse && parsedResponse.action) {
                  const blockchainActions = ['transfer_eth', 'deploy_contract', 'call_contract', 'get_balance', 'query_balance', 'create_contract']
                  isBlockchainAction = blockchainActions.includes(parsedResponse.action)
                  console.log('Extracted blockchain action (retry):', isBlockchainAction, 'Action:', parsedResponse.action)
                }
                assistantCode = JSON.stringify(parsedResponse, null, 2)
              } else {
                assistantCode = data.response
              }
            } catch (secondError) {
              console.error('Second parse attempt failed (retry):', secondError)
              assistantCode = data.response
            }
          }
        }

        // Add context information if available
        if (data.context_chunks) {
          assistantContent += `\n\n📚 Context used from training data:\n${data.context_chunks}`
        }
      } else {
        assistantContent = `Error: ${data.error}`
      }

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: assistantContent,
        code: assistantCode,
        blockchainAction: isBlockchainAction ? parsedResponse : null,
        rawJson: data.raw_llm_output,
        timestamp: new Date()
      }

      console.log('Regenerated assistant message:', assistantMessage)
      console.log('Regenerated blockchain action will be shown:', !!assistantMessage.blockchainAction)

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Regenerate API call failed:', error)
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `❌ Regeneration Error: ${error.message}\n\nMake sure the backend server is running on http://localhost:8000`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setIsLoading(false)
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Call the backend API
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      let assistantContent = ''
      let assistantCode = ''
      let parsedResponse = null
      let isBlockchainAction = false
      
      if (data.success) {
        // Display the LLM response
        assistantContent = `Here's what I generated for you:`
        
        // Parse the JSON response to check if it's a blockchain action
        if (data.response) {
          try {
            let responseText = typeof data.response === 'string' ? data.response : JSON.stringify(data.response)
            
            // Remove common prefixes that might break JSON parsing
            responseText = responseText
            responseText = responseText
            .replace(/^json\s*/i, '')       // Remove leading "json"
  .replace(/^```json\s*/i, '')    // Remove ```json
  .replace(/^```/, '')            // Remove opening ```
  .replace(/```$/, '')            // Remove trailing ```
  .trim();
            console.log('Cleaned response text:', responseText)
            
            parsedResponse = JSON.parse(responseText)
            console.log('Parsed response:', parsedResponse)
            
            // Check if this is a blockchain action
            if (parsedResponse && parsedResponse.action) {
              const blockchainActions = ['transfer_eth', 'deploy_contract', 'call_contract', 'get_balance', 'query_balance', 'create_contract']
              isBlockchainAction = blockchainActions.includes(parsedResponse.action)
              console.log('Is blockchain action:', isBlockchainAction, 'Action:', parsedResponse.action)
            }
            
            assistantCode = JSON.stringify(parsedResponse, null, 2)
          } catch (error) {
            console.error('Failed to parse response:', error)
            console.log('Raw response:', data.response)
            
            // Try to extract JSON from text if parsing failed
            try {
              const jsonMatch = data.response.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                parsedResponse = JSON.parse(jsonMatch[0])
                if (parsedResponse && parsedResponse.action) {
                  const blockchainActions = ['transfer_eth', 'deploy_contract', 'call_contract', 'get_balance', 'query_balance', 'create_contract']
                  isBlockchainAction = blockchainActions.includes(parsedResponse.action)
                  console.log('Extracted blockchain action:', isBlockchainAction, 'Action:', parsedResponse.action)
                }
                assistantCode = JSON.stringify(parsedResponse, null, 2)
              } else {
                assistantCode = data.response
              }
            } catch (secondError) {
              console.error('Second parse attempt failed:', secondError)
              assistantCode = data.response
            }
          }
        }

        // Add context information if available
        if (data.context_chunks) {
          assistantContent += `\n\n📚 Context used from training data:\n${data.context_chunks}`
        }
      } else {
        assistantContent = `Error: ${data.error}`
      }

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: assistantContent,
        code: assistantCode,
        blockchainAction: isBlockchainAction ? parsedResponse : null,
        rawJson: data.raw_llm_output, // Store raw JSON for debugging
        timestamp: new Date()
      }

      console.log('Assistant message created:', assistantMessage)
      console.log('Blockchain action will be shown:', !!assistantMessage.blockchainAction)

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('API call failed:', error)
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `❌ Connection Error: ${error.message}\n\nMake sure the backend server is running on http://localhost:8000\n\nTo start the backend, run: python backend/api_server.py`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Chat Header */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  {/* Icon */}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Payment Assistant</h2>
                  <p className="text-sm text-white/60">Blockchain operations & crypto payments</p>
                </div>
              </div>
  
              {/* User Status */}
              {userStatus && (
                <div className="text-right">
                  <div className="text-xs text-white/60">
                    Requests: {userStatus.requests_made || 0} / {userStatus.free_limit || 5}
                  </div>
                  {paymentInfo && (
                    <div className="text-xs text-yellow-400">
                      Payment Required: {paymentInfo.amount_eth} ETH
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
  
          {/* Messages Container */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map(message => (
              <div key={message.id}>
                <MessageBubble message={message} />
                {message.blockchainAction && (
                  <div className="mt-4">
                    <BlockchainActionCard
                      actionData={message.blockchainAction}
                      onResult={result => {
                        /* handle result */
                      }}
                      onRetry={() => {
                        /* handle retry */
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center justify-start">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 max-w-xs">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-white/60 text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
  
          {/* Input Area */}
          <div className="p-6 border-t border-white/10 bg-black/20">
            {showPaymentModal && (
              <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                <div className="mb-2">
                  <label className="block text-sm text-yellow-400 mb-1">
                    Transaction Hash (after payment):
                  </label>
                  <input
                    type="text"
                    value={paymentTxHash}
                    onChange={e => setPaymentTxHash(e.target.value)}
                    placeholder="Paste your transaction hash here..."
                    className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <small className="text-yellow-400/80">
                    Enter the transaction hash from your payment
                  </small>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-xs text-white/60 hover:text-white px-2 py-1 rounded"
                  >
                    Hide
                  </button>
                </div>
              </div>
            )}
            <div className="flex space-x-3">
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to create a contract, explain code, or help debug..."
                rows="2"
                disabled={isLoading}
                className="flex-1 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl resize-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-white placeholder-white/50 min-h-[60px]"
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    )
  }
