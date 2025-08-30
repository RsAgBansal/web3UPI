#!/usr/bin/env python3
"""
CDP Credentials Validation Script
Run this to check if your .env file has properly formatted CDP credentials
"""

import os
import json
from dotenv import load_dotenv

def validate_cdp_credentials():
    """Validate CDP API credentials format"""
    
    # Load environment variables
    load_dotenv()
    
    print("=== CDP Credentials Validation ===\n")
    
    # Check if variables exist
    api_key_name = os.getenv("CDP_API_KEY_NAME")
    api_key_secret = os.getenv("CDP_API_KEY_SECRET")
    wallet_secret = os.getenv("CDP_WALLET_SECRET")
    
    errors = []
    warnings = []
    
    # Check for correct variable names
    api_key_id = os.getenv("CDP_API_KEY_ID")
    
    # Validate CDP_API_KEY_ID
    if not api_key_id:
        errors.append("❌ CDP_API_KEY_ID is missing")
    else:
        print(f"✅ CDP_API_KEY_ID: {api_key_id[:50]}...")
        
    # Check for old variable name
    if api_key_name:
        warnings.append("⚠️  Found CDP_API_KEY_NAME - should be CDP_API_KEY_ID")
    
    # Validate CDP_API_KEY_SECRET
    if not api_key_secret:
        errors.append("❌ CDP_API_KEY_SECRET is missing")
    else:
        try:
            # Try to parse as JSON
            key_data = json.loads(api_key_secret)
            if "privateKey" in key_data and "keyId" in key_data:
                print("✅ CDP_API_KEY_SECRET: Valid JSON format with required fields")
                if key_data["privateKey"].startswith("-----BEGIN EC PRIVATE KEY-----"):
                    print("✅ Private key format looks correct")
                else:
                    warnings.append("⚠️  Private key should start with '-----BEGIN EC PRIVATE KEY-----'")
            else:
                errors.append("❌ CDP_API_KEY_SECRET JSON missing 'privateKey' or 'keyId' fields")
        except json.JSONDecodeError:
            errors.append("❌ CDP_API_KEY_SECRET is not valid JSON")
    
    # Validate CDP_WALLET_SECRET
    if not wallet_secret:
        errors.append("❌ CDP_WALLET_SECRET is missing")
    else:
        words = wallet_secret.strip().split()
        if len(words) == 12:
            print("✅ CDP_WALLET_SECRET: 12-word seed phrase format")
        elif len(words) == 24:
            print("✅ CDP_WALLET_SECRET: 24-word seed phrase format")
        else:
            warnings.append(f"⚠️  CDP_WALLET_SECRET has {len(words)} words (expected 12 or 24)")
    
    # Print results
    print("\n=== Validation Results ===")
    
    if errors:
        print("\n🚨 ERRORS (must fix):")
        for error in errors:
            print(f"  {error}")
    
    if warnings:
        print("\n⚠️  WARNINGS (should check):")
        for warning in warnings:
            print(f"  {warning}")
    
    if not errors and not warnings:
        print("\n🎉 All credentials look properly formatted!")
        print("You can now try running agent.py again.")
    elif not errors:
        print("\n✅ No critical errors found. You can try running agent.py.")
    else:
        print(f"\n❌ Found {len(errors)} error(s). Please fix them before running agent.py.")
    
    return len(errors) == 0

if __name__ == "__main__":
    validate_cdp_credentials()
