from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class MetaMaskAccount:
    def __init__(self, provider_url=None):
        """
        Initialize MetaMask account handler
        :param provider_url: Optional Web3 provider URL (default: None for MetaMask injected provider)
        """
        if provider_url:
            self.web3 = Web3(Web3.HTTPProvider(provider_url))
        else:
            # This will be used in the frontend with MetaMask's provider
            self.web3 = None
        self.account = None

    def connect_web3(self, provider):
        """
        Connect to Web3 using the provided provider (from MetaMask)
        :param provider: The Web3 provider from MetaMask (window.ethereum)
        """
        self.web3 = Web3(provider)
        return self.web3.isConnected()

    async def get_accounts(self):
        """
        Request accounts from MetaMask
        :return: List of accounts
        """
        if not self.web3:
            raise Exception("Web3 provider not initialized. Call connect_web3() first.")
        
        accounts = await self.web3.eth.requestAccounts()
        if accounts and len(accounts) > 0:
            self.account = accounts[0]
        return accounts

    def sign_message(self, message, private_key=None):
        """
        Sign a message with the current account or provided private key
        :param message: Message to sign
        :param private_key: Optional private key (will use account's key if not provided)
        :return: Signature
        """
        if private_key:
            message_hash = encode_defunct(text=message)
            signed_message = Account.sign_message(message_hash, private_key=private_key)
            return signed_message.signature.hex()
        
        if not self.web3 or not self.account:
            raise Exception("Web3 provider not initialized or no account connected.")
        
        message_hash = self.web3.sha3(text=message)
        return self.web3.eth.sign(self.account, message_hash).hex()

    def verify_signature(self, message, signature, address):
        """
        Verify a signature
        :param message: Original message
        :param signature: Signature to verify
        :param address: Address that should have signed the message
        :return: True if signature is valid, False otherwise
        """
        message_hash = encode_defunct(text=message)
        try:
            recovered_address = Account.recover_message(message_hash, signature=signature)
            return recovered_address.lower() == address.lower()
        except Exception as e:
            print(f"Signature verification error: {str(e)}")
            return False

# Example usage
if __name__ == "__main__":
    # This would typically be used in a frontend context
    # For backend usage, provide a provider URL
    account = MetaMaskAccount(provider_url=os.getenv('WEB3_PROVIDER_URL'))