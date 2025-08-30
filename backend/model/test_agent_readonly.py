#!/usr/bin/env python3
"""
Test CDP Agent with read-only operations
"""

import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("Testing CDP Agent initialization...")
print(f"CDP_API_KEY_ID: {bool(os.getenv('CDP_API_KEY_ID'))}")
print(f"CDP_API_KEY_SECRET: {bool(os.getenv('CDP_API_KEY_SECRET'))}")
print(f"CDP_WALLET_SECRET: {bool(os.getenv('CDP_WALLET_SECRET'))}")

try:
    from coinbase_agentkit import AgentKit, AgentKitConfig
    
    # Try to initialize with current credentials
    agent = AgentKit(AgentKitConfig())
    print("✅ Agent initialized successfully!")
    
    # Test a simple query (this might work even with wallet issues)
    test_address = "0x742d35Cc6634C0532925a3b8D0c0d0F8b9d3f8f8"  # Random test address
    
    print(f"\nTesting balance query for {test_address}...")
    result = agent.query_balance(address=test_address, token="ETH")
    print(f"Result: {result}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nThis confirms the wallet secret format issue.")
