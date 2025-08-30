import React, { useState } from 'react'

const CodeBlock = ({ code, language = 'solidity', showLineNumbers = false }) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden my-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-300 text-sm">
        <span className="font-medium">{language === 'json' ? 'JSON Response' : language}</span>
        <button
          onClick={copyToClipboard}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm text-gray-100 font-mono leading-relaxed">
          <code className={showLineNumbers ? 'line-numbers' : ''}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  )
}

export default CodeBlock
