import React from 'react'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to MindUnits
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your AI-powered Solidity development assistant
        </p>
        <Link
          to="/chat"
          className="btn btn-primary text-lg px-8 py-3"
        >
          Start Building Smart Contracts
        </Link>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <span className="text-blue-600 text-xl">🤖</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">AI Code Generation</h3>
          <p className="text-gray-600">
            Generate Solidity contracts with natural language descriptions using advanced RAG technology.
          </p>
        </div>

       
      </div>

   

      {/* Quick Actions */}
      
    </div>
  )
}

export default Dashboard
