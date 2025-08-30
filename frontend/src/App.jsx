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
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Tech Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse"></div>
        
        {/* Cyber Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        
        {/* Scanning Lines */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-2 animate-scan"></div>
        
        <div className="relative z-10">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chat" element={<ChatInterface />} />
              <Route path="/wallet" element={<WalletDashboard />} />
              <Route path="/test" element={<TestBlockchain />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App
