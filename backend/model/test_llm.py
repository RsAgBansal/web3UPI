#!/usr/bin/env python3
"""
Test script for llm.py - Interactive and batch testing
"""
import json
import subprocess
import sys
import os

def test_llm_with_prompt(prompt, description="Test"):
    """Test the LLM with a given prompt."""
    print(f"\n🧪 {description}")
    print("-" * 50)
    print(f"Prompt: {prompt}")
    
    # Prepare input data
    test_data = {"prompt": prompt}
    input_json = json.dumps(test_data)
    
    try:
        # Run the LLM script
        result = subprocess.run(
            [sys.executable, "llm.py"],
            input=input_json,
            text=True,
            capture_output=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        if result.returncode == 0:
            try:
                response = json.loads(result.stdout)
                print("✅ Success!")
                print(f"Response: {response.get('response', 'No response')}")
                if response.get('context_chunks'):
                    print(f"\n📚 Context Used:")
                    print(response['context_chunks'])
            except json.JSONDecodeError:
                print("⚠️  Got response but not valid JSON:")
                print(result.stdout)
        else:
            print("❌ Error!")
            print(f"Error output: {result.stderr}")
            print(f"Stdout: {result.stdout}")
    
    except Exception as e:
        print(f"❌ Exception: {e}")

def interactive_test():
    """Interactive testing mode."""
    print("🤖 Interactive LLM Testing")
    print("Type 'quit' to exit, 'batch' to run batch tests")
    print("=" * 50)
    
    while True:
        try:
            prompt = input("\nEnter your prompt: ").strip()
            
            if prompt.lower() in ['quit', 'exit', 'q']:
                print("👋 Goodbye!")
                break
            elif prompt.lower() == 'batch':
                batch_test()
                continue
            elif not prompt:
                continue
            
            test_llm_with_prompt(prompt, "Interactive Test")
            
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")

def batch_test():
    """Run predefined batch tests."""
    print("\n🧪 Running Batch Tests...")
    
    test_cases = [
        {
            "prompt": "create an ERC20 token",
            "description": "ERC20 Token Creation"
        },
        {
            "prompt": "write a smart contract for NFT marketplace",
            "description": "NFT Marketplace Contract"
        },
        {
            "prompt": "generate a multisig wallet contract",
            "description": "Multi-signature Wallet"
        },
        {
            "prompt": "transfer 1 ETH to 0x123...",
            "description": "ETH Transfer"
        },
        {
            "prompt": "deploy a simple storage contract",
            "description": "Simple Storage Contract"
        }
    ]
    
    for test_case in test_cases:
        test_llm_with_prompt(test_case["prompt"], test_case["description"])
        
    print("\n✅ Batch testing completed!")

def check_environment():
    """Check if the environment is properly set up."""
    print("🔍 Environment Check")
    print("-" * 30)
    
    # Check if llm.py exists
    if os.path.exists("llm.py"):
        print("✅ llm.py found")
    else:
        print("❌ llm.py not found in current directory")
        return False
    
    # Check if vector_samples.jsonl exists
    samples_path = os.path.join(".", "data", "vector_samples.jsonl")
    if os.path.exists(samples_path):
        print("✅ vector_samples.jsonl found")
    else:
        print("⚠️  vector_samples.jsonl not found - RAG context will be empty")
    
    # Check environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    if os.getenv("GEMINI_API_KEY"):
        print("✅ GEMINI_API_KEY found")
    else:
        print("❌ GEMINI_API_KEY not set")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 LLM Testing Tool")
    print("=" * 50)
    
    if not check_environment():
        print("\n❌ Environment check failed. Please fix the issues above.")
        sys.exit(1)
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "batch":
            batch_test()
        elif sys.argv[1] == "test":
            # Single test with prompt
            prompt = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "create an ERC20 token"
            test_llm_with_prompt(prompt, "Command Line Test")
        else:
            print("Usage:")
            print("  python test_llm.py            # Interactive mode")
            print("  python test_llm.py batch      # Run batch tests")
            print("  python test_llm.py test <prompt>  # Single test")
    else:
        interactive_test()
