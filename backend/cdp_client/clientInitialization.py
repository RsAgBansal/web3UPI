import asyncio
import os
from cdp import CdpClient
from dotenv import load_dotenv
from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_defunct

# Load environment variables
load_dotenv()

class CDPClientWithMetaMask:
    def __init__(self, provider_url=None):
        """
        Initialize CDP client with MetaMask support
        :param provider_url: Optional Web3 provider URL (for backend usage)
        """
        self.cdp = CdpClient()
        self.web3 = Web3(Web3.HTTPProvider(provider_url)) if provider_url else None
        self.account = None

    async def initialize(self):
        """Initialize the CDP client"""
        # Initialize CDP client
        await self.cdp.initialize()
        
        # If running in a frontend context, this would be handled by the frontend
        if not self.web3:
            return {
                'status': 'success',
                'message': 'Running in frontend context. Use connect_metamask() from the frontend.'
            }
            
        # For backend usage with a provider URL
        if not self.web3.isConnected():
            raise ConnectionError("Could not connect to Web3 provider")
            
        return {
            'status': 'success',
            'web3_connected': self.web3.isConnected(),
            'network': self.web3.net.version if self.web3 else None
        }

    def connect_metamask(self, provider):
        """
        Connect to MetaMask from frontend
        :param provider: The Web3 provider from MetaMask (window.ethereum)
        """
        self.web3 = Web3(provider)
        return self.web3.isConnected()

    async def get_accounts(self):
        """Get accounts from connected provider"""
        if not self.web3:
            raise Exception("Web3 provider not initialized")
            
        accounts = await self.web3.eth.requestAccounts()
        if accounts and len(accounts) > 0:
            self.account = accounts[0]
        return accounts

    def sign_message(self, message, private_key=None):
        """Sign a message with the current account or provided private key"""
        if private_key:
            message_hash = encode_defunct(text=message)
            signed_message = Account.sign_message(message_hash, private_key=private_key)
            return signed_message.signature.hex()
            
        if not self.web3 or not self.account:
            raise Exception("Web3 provider not initialized or no account connected")
            
        message_hash = self.web3.sha3(text=message)
        return self.web3.eth.sign(self.account, message_hash).hex()

# Initialize the client
async def initialize_client():
    provider_url = os.getenv('WEB3_PROVIDER_URL')
    client = CDPClientWithMetaMask(provider_url=provider_url)
    return await client.initialize()

# For testing
if __name__ == "__main__":
    # This will only work with a proper provider URL in .env
    result = asyncio.run(initialize_client())
    print(result)