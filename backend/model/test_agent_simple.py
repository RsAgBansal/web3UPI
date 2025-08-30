#!/usr/bin/env python3
"""
Simplified agent.py to test AgentKit initialization without wallet dependencies
"""
import json
import sys
import os
from dotenv import load_dotenv

# Load .env from parent directory (backend/.env)
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

# Debug: Print what's loaded
print("DEBUG: CDP_API_KEY_ID is set?", bool(os.getenv("CDP_API_KEY_ID")))
print("DEBUG: CDP_API_KEY_SECRET is set?", bool(os.getenv("CDP_API_KEY_SECRET")))
secret = os.getenv("CDP_API_KEY_SECRET")
if secret:
    print("DEBUG: CDP_API_KEY_SECRET first 150 chars:", repr(secret[:150]))
    print("DEBUG: Contains \\\\n?", "\\\\n" in secret)
    print("DEBUG: Contains \\n?", "\\n" in secret)

# Test basic imports first
try:
    print("Testing imports...")
    from coinbase_agentkit import AgentKit, AgentKitConfig
    print("✅ AgentKit imports successful")
    
    # Try to create config without wallet
    print("Testing AgentKitConfig creation...")
    config = AgentKitConfig()
    print("✅ AgentKitConfig created successfully")
    
    # Try to initialize AgentKit
    print("Testing AgentKit initialization...")
    agent = AgentKit(config)
    print("✅ AgentKit initialized successfully!")
    
    print("\n🎉 All tests passed! AgentKit is working.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\nAgent is ready for testing basic functionality.")
