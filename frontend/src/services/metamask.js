/**
 * MetaMask Web3 Integration Service
 */

class MetaMaskService {
  constructor() {
    this.ethereum = window.ethereum;
    this.web3 = null;
    this.account = null;
    this.chainId = null;
  }

  /**
   * Check if MetaMask is installed
   */
  isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
  }

  /**
   * Connect to MetaMask wallet
   */
  async connectWallet() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask extension.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      this.account = accounts[0];
      
      // Get chain ID
      this.chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      // Set up event listeners
      this.setupEventListeners();

      return {
        account: this.account,
        chainId: this.chainId
      };
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet() {
    this.account = null;
    this.chainId = null;
    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeAllListeners();
    }
  }

  /**
   * Get current account
   */
  async getCurrentAccount() {
    if (!this.isMetaMaskInstalled()) {
      return null;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Error getting current account:', error);
      return null;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address = null) {
    const account = address || this.account;
    if (!account) {
      throw new Error('No account connected');
    }

    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [account, 'latest']
      });

      // Convert from wei to ETH
      return parseFloat(parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  /**
   * Switch to specific network
   */
  async switchNetwork(chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }]
      });
      this.chainId = chainId;
    } catch (error) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        await this.addNetwork(chainId);
      } else {
        throw error;
      }
    }
  }

  /**
   * Add network to MetaMask
   */
  async addNetwork(chainId) {
    const networks = {
      '0x1': {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.infura.io/v3/'],
        blockExplorerUrls: ['https://etherscan.io/']
      },
      '0x89': {
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com/'],
        blockExplorerUrls: ['https://polygonscan.com/']
      },
      '0x2105': {
        chainId: '0x2105',
        chainName: 'Base',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://mainnet.base.org/'],
        blockExplorerUrls: ['https://basescan.org/']
      },
      '0x14a34': {
        chainId: '0x14a34',
        chainName: 'Base Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://sepolia.base.org/'],
        blockExplorerUrls: ['https://sepolia.basescan.org/']
      }
    };

    const networkConfig = networks[chainId];
    if (!networkConfig) {
      throw new Error(`Network ${chainId} not supported`);
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig]
      });
      this.chainId = chainId;
    } catch (error) {
      console.error('Error adding network:', error);
      throw error;
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(to, value, data = '0x') {
    if (!this.account) {
      throw new Error('No account connected');
    }

    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: this.account,
          to,
          value: `0x${parseInt(value * Math.pow(10, 18)).toString(16)}`, // Convert ETH to wei
          data
        }]
      });

      return txHash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  /**
   * Sign message
   */
  async signMessage(message) {
    if (!this.account) {
      throw new Error('No account connected');
    }

    try {
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, this.account]
      });

      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for account and network changes
   */
  setupEventListeners() {
    if (!window.ethereum) return;

    // Account changed
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnectWallet();
      } else {
        this.account = accounts[0];
      }
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('metamask:accountChanged', {
        detail: { account: this.account }
      }));
    });

    // Network changed
    window.ethereum.on('chainChanged', (chainId) => {
      this.chainId = chainId;
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('metamask:networkChanged', {
        detail: { chainId }
      }));
    });

    // Connection changed
    window.ethereum.on('connect', (connectInfo) => {
      console.log('MetaMask connected:', connectInfo);
    });

    window.ethereum.on('disconnect', (error) => {
      console.log('MetaMask disconnected:', error);
      this.disconnectWallet();
    });
  }

  /**
   * Get network name from chain ID
   */
  getNetworkName(chainId = null) {
    const id = chainId || this.chainId;
    const networks = {
      '0x1': 'Ethereum Mainnet',
      '0x89': 'Polygon',
      '0x2105': 'Base',
      '0x14a34': 'Base Sepolia',
      '0xaa36a7': 'Sepolia Testnet',
      '0x13881': 'Polygon Mumbai'
    };
    return networks[id] || 'Unknown Network';
  }

  /**
   * Format address for display
   */
  formatAddress(address, length = 6) {
    if (!address) return '';
    return `${address.slice(0, length)}...${address.slice(-4)}`;
  }
}

// Create singleton instance
const metamaskService = new MetaMaskService();

export default metamaskService;
