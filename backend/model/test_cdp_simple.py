#!/usr/bin/env python3
"""
Simple test to check CDP SDK installation and basic functionality
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=== CDP SDK Test ===")

# Test 1: Check if cdp module can be imported
try:
    import cdp
    print("✅ CDP module imported successfully")
    
    # Show available attributes
    attrs = [attr for attr in dir(cdp) if not attr.startswith('_')]
    print(f"   Available attributes: {attrs[:5]}..." if len(attrs) > 5 else f"   Available attributes: {attrs}")
    
except ImportError as e:
    print(f"❌ Failed to import CDP: {e}")
    exit(1)

# Test 2: Check environment variables
api_key_id = os.getenv('CDP_API_KEY_ID')
api_key_secret = os.getenv('CDP_API_KEY_SECRET')

print(f"✅ CDP_API_KEY_ID loaded: {bool(api_key_id)}")
print(f"✅ CDP_API_KEY_SECRET loaded: {bool(api_key_secret)}")

if api_key_secret:
    print(f"   Secret preview: {api_key_secret[:50]}...")

# Test 3: Try basic CDP operations
try:
    print("\n=== Testing CDP Configuration ===")
    
    # Try different configuration methods
    if hasattr(cdp, 'configure'):
        print("✅ cdp.configure method exists")
    elif hasattr(cdp, 'Cdp'):
        print("✅ cdp.Cdp class exists")
    else:
        print("❌ No known configuration method found")
        
    # Check for wallet classes
    if hasattr(cdp, 'Wallet'):
        print("✅ cdp.Wallet class exists")
    elif hasattr(cdp, 'wallet'):
        print("✅ cdp.wallet module exists")
    else:
        print("❌ No wallet class found")
        
except Exception as e:
    print(f"❌ Error testing CDP: {e}")

print("\n=== Test Complete ===")
