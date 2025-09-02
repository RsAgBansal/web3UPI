import React, { useState } from 'react';
import { ethers } from 'ethers';

const MetaMaskTest = () => {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [message, setMessage] = useState('Hello, Web3 UPI!');
  const [signature, setSignature] = useState('');
  const [verification, setVerification] = useState('');

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setAccount(accounts[0]);
        
        // Get balance
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(accounts[0]);
        setBalance(ethers.formatEther(balance));
        
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const signMessage = async () => {
    if (!window.ethereum) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);
      setSignature(signature);
      
      // Verify signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      setVerification(recoveredAddress === account ? '✅ Verified' : '❌ Verification failed');
      
    } catch (error) {
      console.error('Error signing message:', error);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">MetaMask Test</h2>
      
      <button 
        onClick={connectMetaMask}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 mb-4"
      >
        Connect MetaMask
      </button>
      
      {account && (
        <div className="mb-4">
          <p><strong>Account:</strong> {account}</p>
          <p><strong>Balance:</strong> {balance} ETH</p>
          
          <div className="mt-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded-md mb-2"
              placeholder="Enter message to sign"
            />
            <button
              onClick={signMessage}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
            >
              Sign Message
            </button>
            
            {signature && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <p><strong>Signature:</strong></p>
                <p className="break-words text-sm">{signature}</p>
                <p className="mt-2">{verification}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaMaskTest;
