#!/usr/bin/env python3
"""
Debug CDP credentials formatting
"""
import os
import json
from dotenv import load_dotenv

# Load environment variables from parent directory
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

print("=== CDP Credentials Debug ===")

api_key_id = os.getenv('CDP_API_KEY_ID')
api_key_secret = os.getenv('CDP_API_KEY_SECRET')
wallet_secret = os.getenv('CDP_WALLET_SECRET')

print(f"API Key ID: {api_key_id}")
print(f"API Secret loaded: {bool(api_key_secret)}")
print(f"Wallet Secret loaded: {bool(wallet_secret)}")

if api_key_secret:
    print(f"\nAPI Secret preview: {api_key_secret[:50]}...")
    print(f"API Secret length: {len(api_key_secret)}")
    
    # Try to parse as JSON
    try:
        secret_data = json.loads(api_key_secret)
        print("✅ JSON parsing successful")
        
        private_key = secret_data.get('privateKey', '')
        key_id = secret_data.get('keyId', '')
        
        print(f"Private key starts with: {private_key[:30]}...")
        print(f"Key ID: {key_id}")
        
        # Check for double escaping issue
        if '\\\\n' in private_key:
            print("❌ FOUND DOUBLE ESCAPING ISSUE: \\\\n detected")
            print("This needs to be fixed to \\n")
            
            # Show corrected version
            corrected_key = private_key.replace('\\\\n', '\\n')
            corrected_secret = {
                "privateKey": corrected_key,
                "keyId": key_id
            }
            print(f"\nCorrected format:")
            print(json.dumps(corrected_secret, indent=2))
            
        elif '\\n' in private_key:
            print("✅ Correct escaping found: \\n")
        else:
            print("⚠️  No newline escaping found")
            
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing failed: {e}")
        print(f"Raw secret: {api_key_secret}")

print("\n=== Debug Complete ===")
