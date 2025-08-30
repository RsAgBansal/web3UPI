import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/common/Header'
import Dashboard from './components/features/Dashboard'
import ChatInterface from './components/chat/ChatInterface'
import WalletDashboard from './components/wallet/WalletDashboard'
import TestBlockchain from './components/test/TestBlockchain'
import './styles/globals.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/wallet" element={<WalletDashboard />} />
            <Route path="/test" element={<TestBlockchain />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
