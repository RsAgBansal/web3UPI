#!/usr/bin/env python3
"""
Debug script to identify available CDP SDK methods
"""
import os
from dotenv import load_dotenv

load_dotenv()

print("=== CDP SDK Method Discovery ===")

try:
    import cdp
    print("✅ CDP module imported")
    
    # Show all available attributes
    attrs = [attr for attr in dir(cdp) if not attr.startswith('_')]
    print(f"Available attributes: {attrs}")
    
    # Check for common configuration patterns
    config_methods = []
    
    if hasattr(cdp, 'configure'):
        config_methods.append('cdp.configure')
    if hasattr(cdp, 'Cdp'):
        config_methods.append('cdp.Cdp')
        if hasattr(cdp.Cdp, 'configure'):
            config_methods.append('cdp.Cdp.configure')
        if hasattr(cdp.Cdp, 'configure_from_json'):
            config_methods.append('cdp.Cdp.configure_from_json')
    if hasattr(cdp, 'Client'):
        config_methods.append('cdp.Client')
    if hasattr(cdp, 'configure_from_json'):
        config_methods.append('cdp.configure_from_json')
        
    print(f"Found configuration methods: {config_methods}")
    
    # Try to inspect the cdp module structure
    print("\nModule structure:")
    for attr in attrs[:10]:  # Show first 10 attributes
        obj = getattr(cdp, attr)
        print(f"  {attr}: {type(obj)}")
        
    # Check for wallet classes
    wallet_classes = []
    if hasattr(cdp, 'Wallet'):
        wallet_classes.append('cdp.Wallet')
    if hasattr(cdp, 'wallet'):
        wallet_classes.append('cdp.wallet')
        
    print(f"Found wallet classes: {wallet_classes}")
    
    # Try to get version info
    if hasattr(cdp, '__version__'):
        print(f"CDP SDK version: {cdp.__version__}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Discovery Complete ===")
