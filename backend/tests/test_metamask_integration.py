import asyncio
import sys
import os
from pathlib import Path

# Add the parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_defunct
from cdp_client import MetaMaskAccount

def test_sign_verify_message():
    try:
        # Initialize with a test private key
        test_private_key = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"  # Test key, never use in production!
        account = Account.from_key(test_private_key)
        
        # Create MetaMaskAccount instance
        mm_account = MetaMaskAccount()
        
        # Test message
        message = "Hello, Web3 UPI!"
        
        # Sign with private key
        signature = mm_account.sign_message(message, private_key=test_private_key)
        print(f"✅ Message signed successfully")
        print(f"Message: {message}")
        print(f"Account: {account.address}")
        print(f"Signature: {signature}")
        
        # Verify signature
        is_valid = mm_account.verify_signature(message, signature, account.address)
        print(f"\n🔍 Verifying signature...")
        print(f"Signature valid: {is_valid}")
        
        assert is_valid, "❌ Signature verification failed"
        print("\n✅ Test passed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        raise

if __name__ == "__main__":
    test_sign_verify_message()
    print("✅ Test completed successfully!")
