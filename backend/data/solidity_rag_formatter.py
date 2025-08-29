import json
import google.generativeai as genai
import os
from dotenv import load_dotenv
from tqdm import tqdm
import time
import re

# STEP 1: Configure Gemini
load_dotenv(dotenv_path="../.env")  # Look for .env in backend directory
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set.")
genai.configure(api_key=api_key)

model = genai.GenerativeModel("models/gemini-2.0-flash")

# Paths for Solidity files
solidity_dir = "solidity_training_data"
output_path = "solidity_rag_dataset.jsonl"

def parse_solidity_file(file_path: str):
    """Parse a Solidity file and extract clean code."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove the header comments added by scraper
    lines = content.split('\n')
    code_lines = []
    skip_header = True
    
    for line in lines:
        if skip_header:
            if line.startswith('// Source:') or line.startswith('// Repository:') or line.startswith('// File:'):
                continue
            elif line.strip() and not line.startswith('//'):
                skip_header = False
        
        if not skip_header:
            code_lines.append(line)
    
    return '\n'.join(code_lines).strip()

def get_contract_name(code: str):
    """Extract the main contract name from Solidity code."""
    contract_match = re.search(r'contract\s+(\w+)', code)
    interface_match = re.search(r'interface\s+(\w+)', code)
    library_match = re.search(r'library\s+(\w+)', code)
    
    if contract_match:
        return contract_match.group(1)
    elif interface_match:
        return interface_match.group(1)
    elif library_match:
        return library_match.group(1)
    else:
        return "Unknown"

def generate_instruction(code_output: str, filename: str):
    """Generate instruction based on Solidity code using Gemini."""
    time.sleep(2)  # Rate limiting
    
    contract_name = get_contract_name(code_output)
    
    prompt = (
        f"Based on the Solidity smart contract code below, generate a clear instruction that describes what this contract does and what it's used for. "
        f"The contract name is '{contract_name}' and the filename is '{filename}'. "
        f"Focus on the functionality, purpose, and key features. Make it instructional like 'Create a Solidity contract that...' or 'Write a smart contract for...' "
        f"Here is the Solidity code:\n\n"
        f"{code_output[:2000]}..."  # Limit code length for API
    )
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error generating instruction for {filename}: {e}")
        return f"Write a Solidity contract similar to {contract_name}"

# STEP 3: Process Solidity files from directory
def process_solidity_files():
    """Process all Solidity files and create RAG dataset."""
    if not os.path.exists(solidity_dir):
        print(f"Directory {solidity_dir} not found!")
        return
    
    solidity_files = [f for f in os.listdir(solidity_dir) if f.endswith('.sol')]
    print(f"Found {len(solidity_files)} Solidity files to process")
    
    updated_records = []
    
    for filename in tqdm(solidity_files, desc="Processing Solidity files"):
        file_path = os.path.join(solidity_dir, filename)
        
        try:
            # Read and clean the Solidity code
            solidity_code = parse_solidity_file(file_path)
            
            if len(solidity_code.strip()) < 50:  # Skip very small files
                continue
            
            # Generate instruction using Gemini
            instruction = generate_instruction(solidity_code, filename)
            
            # Create the training record
            record = {
                "instruction": instruction,
                "input": f"Create this smart contract from the file: {filename}",
                "output": solidity_code,
                "metadata": {
                    "filename": filename,
                    "contract_name": get_contract_name(solidity_code),
                    "code_length": len(solidity_code)
                }
            }
            
            updated_records.append(record)
            print(f"✓ Processed: {filename} ({len(solidity_code)} chars)")
            
        except Exception as e:
            print(f"✗ Error processing {filename}: {e}")
            continue
    
    return updated_records
    
# STEP 4: Main execution
def main():
    print("🔄 Converting Solidity files to RAG training format using Gemini API")
    print("=" * 60)
    
    # Process all Solidity files
    records = process_solidity_files()
    
    if not records:
        print("No records generated!")
        return
    
    # Write to JSONL file
    print(f"\n💾 Writing {len(records)} records to {output_path}")
    with open(output_path, "w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    
    print(f"✅ RAG dataset created: {output_path}")
    
    # Show statistics
    print(f"\n📊 Dataset Statistics:")
    print(f"Total records: {len(records)}")
    avg_code_length = sum(r['metadata']['code_length'] for r in records) // len(records)
    print(f"Average code length: {avg_code_length} characters")
    
    # Show sample
    if records:
        sample = records[0]
        print(f"\n📝 Sample record:")
        print(f"Filename: {sample['metadata']['filename']}")
        print(f"Contract: {sample['metadata']['contract_name']}")
        print(f"Instruction: {sample['instruction'][:100]}...")
        print(f"Output (first 200 chars): {sample['output'][:200]}...")

if __name__ == "__main__":
    main()