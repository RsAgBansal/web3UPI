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
              .replace(/^json\s*/i, '')     // Remove "json" prefix
              .replace(/^```json\s*/i, '')  // Remove "```json" prefix
              .replace(/```\s*$/, '')       // Remove trailing ```
              .trim()
            
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
              .replace(/^json\s*/i, '')     // Remove "json" prefix
              .replace(/^```json\s*/i, '')  // Remove "```json" prefix
              .replace(/```\s*$/, '')       // Remove trailing ```
              .trim()
            
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Chat Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Solidity AI Assistant</h2>
          <p className="text-sm text-gray-500">Ask me anything about Solidity smart contracts</p>
        </div>

        {/* Messages Container */}
        <div className="chat-container">
          <div className="messages-container">
            {messages.map((message) => (
              <div key={message.id}>
                <MessageBubble message={message} />
                {/* Show BlockchainActionCard directly if it's a blockchain action */}
                {message.blockchainAction && (
                  <div className="px-4 pb-4">
                    <BlockchainActionCard
                      actionData={message.blockchainAction}
                      onResult={(result) => {
                        console.log('Blockchain execution result:', result)
                        // Optionally update the message or show result
                      }}
                      onRetry={() => {
                        console.log('Retry requested for message:', message.id)
                        // Find the original user message that triggered this response
                        const userMessage = messages.find(m => 
                          m.type === 'user' && 
                          Math.abs(m.id - message.id) < 5 && 
                          m.id < message.id
                        )
                        if (userMessage) {
                          // Remove the current assistant message and regenerate
                          setMessages(prev => prev.filter(m => m.id !== message.id))
                          // Trigger a new API call with the original user message
                          regenerateResponse(userMessage.content)
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="flex items-center space-x-2">
                  <div className="loading-dots">Thinking</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex space-x-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to create a contract, explain code, or help debug..."
                className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="btn btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default ChatInterface
