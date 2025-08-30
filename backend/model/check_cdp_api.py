#!/usr/bin/env python3
"""
Check CDP SDK API structure and find correct configuration method
"""
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Get credentials
api_key_id = os.getenv('CDP_API_KEY_ID')
api_key_secret = os.getenv('CDP_API_KEY_SECRET')

print("=== CDP SDK API Check ===")
print(f"API Key ID: {api_key_id}")
print(f"API Secret loaded: {bool(api_key_secret)}")

try:
    import cdp
    print("CDP imported successfully")
    
    # List all public attributes
    attrs = [x for x in dir(cdp) if not x.startswith('_')]
    print(f"Public attributes: {attrs}")
    
    # Check specific patterns based on coinbase-agentkit usage
    if hasattr(cdp, 'evm'):
        print("✅ cdp.evm module found")
        evm_attrs = [x for x in dir(cdp.evm) if not x.startswith('_')]
        print(f"EVM attributes: {evm_attrs}")
        
    # Try the pattern used by coinbase-agentkit
    if api_key_id and api_key_secret:
        try:
            # Parse JSON secret like coinbase-agentkit does
            secret_data = json.loads(api_key_secret)
            private_key = secret_data.get('privateKey')
            key_id = secret_data.get('keyId')
            
            print(f"Parsed private key preview: {private_key[:50]}...")
            print(f"Key ID: {key_id}")
            
            # Try the exact pattern from coinbase-agentkit source
            from cdp.auth.utils.jwt import generate_jwt
            from cdp.auth.utils.jwt import JwtOptions
            
            jwt_options = JwtOptions(
                api_key_id=api_key_id,
                api_key_secret=api_key_secret
            )
            
            jwt_token = generate_jwt(jwt_options)
            print("✅ JWT generation successful!")
            
        except Exception as e:
            print(f"JWT test failed: {e}")
            
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("=== Check Complete ===")
