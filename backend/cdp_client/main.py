from cdp import CdpClient
import asyncio
from dotenv import load_dotenv
import os

load_dotenv()

async def main():
    print("=== CDP SDK Wallet Test ===")
    
    # Initialize the CDP client
    cdp = CdpClient()
    
    try:
        # Check if we have the required environment variables
        api_key_id = os.getenv('CDP_API_KEY_ID')
        api_key_secret = os.getenv('CDP_API_KEY_SECRET')
        wallet_secret = os.getenv('CDP_WALLET_SECRET')
        
        print(f"API Key ID: {api_key_id}")
        print(f"API Secret loaded: {bool(api_key_secret)}")
        print(f"Wallet Secret loaded: {bool(wallet_secret)}")
        
        # Create an EVM account (this works on Base Sepolia by default)
        print("\n=== Creating EVM Account ===")
        account = await cdp.evm.create_account()
        print(f"✅ EVM Account created successfully")
        print(f"   Address: {account.address}")
        
        # Check balance
        print("\n=== Checking Balance ===")
        try:
            balance = await account.get_balance()
            print(f"   ETH Balance: {balance}")
            
            # Request faucet funds if balance is 0
            if float(balance) == 0:
                print("\n=== Requesting Faucet Funds ===")
                try:
                    faucet_tx = await account.faucet()
                    print(f"✅ Faucet request successful")
                    print(f"   Transaction: {faucet_tx}")
                except Exception as e:
                    print(f"⚠️  Faucet request failed: {e}")
        except Exception as e:
            print(f"⚠️  Balance check failed: {e}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await cdp.close()
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    asyncio.run(main())