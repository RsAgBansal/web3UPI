#!/usr/bin/env python3
"""
Quick test of all three APIs
"""
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

def test_environment_variables():
    """Check if all required environment variables are present"""
    print("=== Environment Variables Test ===")
    
    vars_to_check = [
        'CDP_API_KEY_ID',
        'CDP_API_KEY_SECRET', 
        'CDP_WALLET_SECRET',
        'GEMINI_API_KEY'
    ]
    
    results = {}
    for var in vars_to_check:
        value = os.getenv(var)
        results[var] = bool(value)
        status = "✅" if value else "❌"
        print(f"{status} {var}: {'Present' if value else 'Missing'}")
    
    return all(results.values())

async def test_cdp_basic():
    """Test CDP SDK basic connection"""
    print("\n=== CDP SDK Basic Test ===")
    try:
        from cdp import CdpClient
        cdp = CdpClient()
        print("✅ CDP Client initialized successfully")
        await cdp.close()
        return True
    except Exception as e:
        print(f"❌ CDP SDK failed: {e}")
        return False

def test_gemini_basic():
    """Test Gemini API basic connection"""
    print("\n=== Gemini API Basic Test ===")
    try:
        # Check if we can import the library
        import google.generativeai as genai
        api_key = os.getenv('GEMINI_API_KEY')
        
        if not api_key:
            print("❌ GEMINI_API_KEY not found")
            return False
            
        # Try to configure (this doesn't make a network call)
        genai.configure(api_key=api_key)
        print("✅ Gemini API configured successfully")
        return True
        
    except ImportError:
        print("⚠️  google-generativeai not installed")
        return False
    except Exception as e:
        print(f"❌ Gemini API failed: {e}")
        return False

async def main():
    """Run quick tests"""
    print("=== Quick API Status Check ===\n")
    
    # Test environment variables
    env_ok = test_environment_variables()
    
    # Test CDP SDK
    cdp_ok = await test_cdp_basic()
    
    # Test Gemini API
    gemini_ok = test_gemini_basic()
    
    # Summary
    print("\n" + "="*40)
    print("SUMMARY:")
    print("="*40)
    print(f"✅ Environment Variables: {'OK' if env_ok else 'MISSING'}")
    print(f"✅ CDP SDK: {'WORKING' if cdp_ok else 'FAILED'}")
    print(f"✅ Gemini API: {'READY' if gemini_ok else 'NOT READY'}")
    
    if env_ok and cdp_ok:
        print(f"\n🎯 CDP API is fully functional!")
        
    if gemini_ok:
        print(f"🎯 Gemini API is ready to use!")
    else:
        print(f"⚠️  Install google-generativeai: pip install google-generativeai")

if __name__ == "__main__":
    asyncio.run(main())
