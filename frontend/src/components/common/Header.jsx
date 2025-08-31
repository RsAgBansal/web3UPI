import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import MetaMaskConnect from '../wallet/MetaMaskConnect'

const Header = () => {
  const location = useLocation()

  return (
    <header className="bg-black border-b border-white/10 shadow-sm relative z-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">N</span>
            </div>
            <span className="text-2xl font-extrabold text-white">Neo Pay</span>
          </Link>

          {/* Navigation */}
          <nav className="flex space-x-6">
            {['/', '/wallet', '/chat', '/test'].map((path, idx) => {
              const labels = ['Dashboard', 'Web3 Wallet', 'AI Chat', '🧪 Test']
              const isActive = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className={`relative px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'text-white'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {labels[idx]}
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-full"></span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            <MetaMaskConnect className="text-black" />
            <Link
              to="/new-contract"
              className="relative inline-flex items-center px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition"
            >
              New Contract
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
