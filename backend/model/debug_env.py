#!/usr/bin/env python3
import os
import json
from dotenv import load_dotenv

# Load .env from parent directory (backend/.env)
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
print(f"Looking for .env at: {env_path}")
print(f"File exists: {os.path.exists(env_path)}")

load_dotenv(env_path)

secret = os.getenv('CDP_API_KEY_SECRET')
print(f"\nCDP_API_KEY_SECRET loaded: {secret is not None}")

if secret:
    print(f"Length: {len(secret)}")
    print(f"First 100 chars: {repr(secret[:100])}")
    print(f"Starts with {{: {secret.startswith('{')}")
    
    try:
        parsed = json.loads(secret)
        print("✅ Valid JSON")
        print(f"Has privateKey: {'privateKey' in parsed}")
        print(f"Has keyId: {'keyId' in parsed}")
        if 'privateKey' in parsed:
            pk = parsed['privateKey']
            print(f"Private key starts with PEM header: {pk.startswith('-----BEGIN')}")
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
else:
    print("❌ CDP_API_KEY_SECRET not found")
