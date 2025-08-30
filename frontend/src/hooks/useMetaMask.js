import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

export const useMetaMask = () => {
  const [account, setAccount] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chainId, setChainId] = useState(null)
  const [provider, setProvider] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkConnection()
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        setProvider(provider)
        
        const accounts = await provider.listAccounts()
        if (accounts.length > 0) {
          setAccount(accounts[0].address)
          setIsConnected(true)
          
          const network = await provider.getNetwork()
          setChainId(network.chainId.toString())
        }
      } catch (error) {
        console.error('Error checking connection:', error)
      }
    }
  }

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null)
      setIsConnected(false)
    } else {
      setAccount(accounts[0])
      setIsConnected(true)
    }
  }

  const handleChainChanged = (chainId) => {
    setChainId(parseInt(chainId, 16).toString())
    window.location.reload() // Reload to reset state
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }

    setIsLoading(true)
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      await checkConnection()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const executeBlockchainAction = async (actionJson) => {
    if (!provider || !isConnected) {
      throw new Error('Wallet not connected')
    }

    const signer = await provider.getSigner()
    
    switch (actionJson.action) {
      case 'transfer_eth':
        return await transferETH(signer, actionJson.recipient, actionJson.amount)
      
      case 'deploy_contract':
        return await deployContract(signer, actionJson.bytecode, actionJson.abi, actionJson.constructorArgs)
      
      case 'call_contract':
        return await callContract(signer, actionJson.contractAddress, actionJson.abi, actionJson.method, actionJson.params, actionJson.value)
      
      case 'get_balance':
      case 'query_balance':
        return await getBalance(actionJson.address || account)
      
      default:
        throw new Error(`Unsupported action: ${actionJson.action}`)
    }
  }

  const transferETH = async (signer, recipient, amount) => {
    try {
      const tx = await signer.sendTransaction({
        to: recipient,
        value: ethers.parseEther(amount.toString())
      })
      
      await tx.wait()
      return {
        success: true,
        txHash: tx.hash,
        message: `Successfully transferred ${amount} ETH to ${recipient}`
      }
    } catch (error) {
      console.error('ETH transfer failed:', error)
      throw new Error(`Transfer failed: ${error.message}`)
    }
  }

  const deployContract = async (signer, bytecode, abi, constructorArgs = []) => {
    try {
      const factory = new ethers.ContractFactory(abi, bytecode, signer)
      const contract = await factory.deploy(...constructorArgs)
      await contract.waitForDeployment()
      
      const address = await contract.getAddress()
      return {
        success: true,
        contractAddress: address,
        txHash: contract.deploymentTransaction().hash,
        message: `Contract deployed successfully at ${address}`
      }
    } catch (error) {
      console.error('Contract deployment failed:', error)
      throw new Error(`Deployment failed: ${error.message}`)
    }
  }

  const callContract = async (signer, contractAddress, abi, method, params = [], value = 0) => {
    try {
      const contract = new ethers.Contract(contractAddress, abi, signer)
      
      const options = value > 0 ? { value: ethers.parseEther(value.toString()) } : {}
      const tx = await contract[method](...params, options)
      
      const receipt = await tx.wait()
      return {
        success: true,
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        message: `Successfully called ${method} on contract ${contractAddress}`
      }
    } catch (error) {
      console.error('Contract call failed:', error)
      throw new Error(`Contract call failed: ${error.message}`)
    }
  }

  const getBalance = async (address) => {
    try {
      const balance = await provider.getBalance(address)
      const balanceInEther = ethers.formatEther(balance)
      
      return {
        success: true,
        balance: balanceInEther,
        address: address,
        message: `Balance: ${balanceInEther} ETH`
      }
    } catch (error) {
      console.error('Balance check failed:', error)
      throw new Error(`Balance check failed: ${error.message}`)
    }
  }

  const switchNetwork = async (targetChainId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
    } catch (error) {
      if (error.code === 4902) {
        throw new Error('Network not added to MetaMask')
      }
      throw error
    }
  }

  return {
    account,
    isConnected,
    chainId,
    provider,
    isLoading,
    connectWallet,
    executeBlockchainAction,
    switchNetwork,
    checkConnection
  }
}
