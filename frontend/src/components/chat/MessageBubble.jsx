import React from 'react'
import CodeBlock from './CodeBlock'

const MessageBubble = ({ message }) => {
  const isUser = message.type === 'user'

  return (
    <div className={`message ${message.type}`}>
      <div className="flex items-start space-x-3">
        {!isUser && (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">AI</span>
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium">
              {isUser ? 'You' : 'AI Assistant'}
            </span>
            <span className="text-xs text-gray-500">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <p className="mb-2 whitespace-pre-wrap">{message.content}</p>
            
            {message.code && (
              <CodeBlock 
                code={message.code} 
                language={message.code.startsWith('{') || message.code.startsWith('[') ? 'json' : 'solidity'}
                showLineNumbers={true}
              />
            )}
          </div>
        </div>

        {isUser && (
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">U</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
