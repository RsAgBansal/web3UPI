import sys
import json
import os
import google.generativeai as genai
import re
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import numpy as np
from usage_tracker import usage_tracker
import hashlib

# Set default model globally
DEFAULT_EMBEDDING_MODEL = SentenceTransformer("all-MiniLM-L6-v2")

# Configure your API key
load_dotenv()  # Load environment variables from .env file

GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")

if not GOOGLE_API_KEY:
    print("Error: GEMINI_API_KEY environment variable not set", file=sys.stderr)
    json.dump({"error": "GEMINI_API_KEY environment variable not set"}, sys.stdout)
    sys.exit(1)

genai.configure(api_key=GOOGLE_API_KEY)

# --- Context Injection Setup ---
# Get the directory of the current script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLES_FILE = os.path.join(SCRIPT_DIR, ".\\data", "vector_samples.jsonl")
NUM_CONTEXT_SAMPLES = 5  # Number of top matching samples to include as context

def load_samples(filepath):
    """Loads instructions and outputs from a .jsonl file."""
    samples = []
    if not os.path.exists(filepath):
        
        print(f"Warning: Samples file not found at {filepath}. No context will be injected.", file=sys.stderr)
        return samples
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                samples.append(json.loads(line))
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON from line: {line.strip()} - {e}", file=sys.stderr)
    return samples

from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def find_matching_samples(user_instruction, samples, model=DEFAULT_EMBEDDING_MODEL, top_n=5, threshold=0.5):
    """
    Finds the top-N samples most similar to the user's instruction
    using cosine similarity of precomputed embeddings.

    Only returns samples with similarity >= `threshold`.

    Parameters:
        user_instruction (str): The input prompt or query.
        samples (list): List of dicts with 'embedding' keys.
        model: SentenceTransformer or similar embedding model.
        top_n (int): Max number of similar samples to return.
        threshold (float): Minimum similarity score to accept a sample.
    """
    # Step 1: Encode only the user instruction
    user_embedding = model.encode([user_instruction], normalize_embeddings=True)[0]
    user_embedding = np.array(user_embedding).reshape(1, -1)

    # Step 2: Load precomputed sample embeddings
    sample_embeddings = np.array([sample["embedding"] for sample in samples])

    # Step 3: Compute cosine similarities
    similarities = cosine_similarity(user_embedding, sample_embeddings)[0]

    # Step 4: Filter by threshold
    filtered = [(sim, sample) for sim, sample in zip(similarities, samples) if sim >= threshold]

    # Step 5: Sort and limit
    ranked_samples = sorted(filtered, key=lambda x: x[0], reverse=True)

    return [sample for _, sample in ranked_samples[:top_n]]


# Load all samples once
all_samples = load_samples(SAMPLES_FILE)

def generate_user_id(prompt: str, additional_data: str = "") -> str:
    """Generate a consistent user ID from prompt and additional data"""
    combined = f"{prompt}{additional_data}"
    return hashlib.md5(combined.encode()).hexdigest()[:12]

# === Read prompt from stdin ===
raw_input = sys.stdin.read()
try:
    data = json.loads(raw_input)
    prompt = data["prompt"]
    # Extract user identification data (you can modify this based on your needs)
    user_ip = data.get("user_ip", "unknown")
    user_session = data.get("user_session", "")
    payment_tx_hash = data.get("payment_tx_hash", "")  # For payment verification
    
    # Generate consistent user ID
    user_id = generate_user_id(prompt, f"{user_ip}_{user_session}")
    
except Exception as e:
    json.dump({"error": f"Invalid input format: {str(e)}"}, sys.stdout)
    sys.exit(1)

# === Handle Payment Verification (if provided) ===
if payment_tx_hash:
    payment_result = usage_tracker.verify_payment(user_id, payment_tx_hash)
    json.dump({
        "payment_verification": payment_result,
        "user_status": usage_tracker.get_user_status(user_id)
    }, sys.stdout)
    sys.exit(0)

# === Check Usage Limits (X402 Feature) ===
request_result = usage_tracker.record_request(user_id)

# Add debug logging
print(f"DEBUG: User ID: {user_id}", file=sys.stderr)
print(f"DEBUG: Request result: {request_result}", file=sys.stderr)

if not request_result["success"]:
    # User exceeded free limit and needs to pay
    payment_request = usage_tracker.get_payment_request(user_id)
    
    print(f"DEBUG: Payment required for user {user_id}", file=sys.stderr)
    
    response_data = {
        "error": "Payment Required (X402)",
        "error_code": 402,
        "message": "You have exceeded the free request limit. Payment required to continue.",
        "user_status": request_result["status"],
        "payment_request": payment_request,
        "instructions": {
            "step1": "Send the required ETH amount to the payment address",
            "step2": "Copy the transaction hash from MetaMask",
            "step3": "Include the transaction hash in your next request as 'payment_tx_hash'",
            "step4": "Your access will be activated for 24 hours"
        }
    }
    
    json.dump(response_data, sys.stdout)
    sys.exit(1)

# === Build System Prompt and Full Prompt ===
system_prompt = """You are a helpful AI assistant that generates structured instructions for performing blockchain actions using Coinbase AgentKit.

- Always respond with valid JSON or Python code that can be executed with AgentKit.
- Never include explanations, comments, or extra text.
- Supported actions include:
  - transfer_eth
  - transfer_token
  - deploy_contract
  - query_balance
- If asked to perform an unsupported action, respond with a JSON error object: {"error": "Unsupported action"}.
- When splitting amounts among multiple recipients, output them in a "recipients" array with address and amount fields.
- When scheduling actions, use fields: {"interval": "<Xd>", "recipient": "...", "amount": N, "token": "..."}.
- Do use AgentKit actions only.

"""

instruction = prompt.lower().strip()
if not instruction.startswith('generate') and not instruction.startswith('write'):
    instruction = f'generate code to {instruction}'

# --- Context Injection ---
context_examples_str = ""
context_chunks = []
if all_samples:
    matching_samples = find_matching_samples(instruction, all_samples,DEFAULT_EMBEDDING_MODEL, NUM_CONTEXT_SAMPLES)
    if matching_samples:
        context_examples_str = "\n\nHere are some relevant examples:\n"
        for i, sample in enumerate(matching_samples):
            context_examples_str += f"\nContext Example {i+1}:\n"
            context_examples_str += f"Instruction: {sample.get('instruction', 'N/A')}\n"
            context_examples_str += f"Response:\n{sample.get('output', 'N/A')}\n"
            if i < 2:  # Store top two chunks
                context_chunks.append({
                    "instruction": sample.get("instruction", "N/A"),
                    "output": sample.get("output", "N/A")
                })
    else:
        print("No matching samples found for context injection.", file=sys.stderr)

# Combine system prompt, general examples, and context examples
full_prompt = f"{system_prompt}{context_examples_str}\n\nInstruction: {instruction}\nResponse:\n"

# === Call Gemini API ===
try:
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(full_prompt)
    completion = response.text.strip()
    match = re.search(r"```(?:[Pp]ython)?\s*([\s\S]+?)```", completion)
    if match:
        completion = match.group(1).strip()
    context_display = ""
    for i, chunk in enumerate(context_chunks[:2]):  # Only show top 2
        context_display += f"=== Example {i+1} ===\n"
        context_display += f"Instruction: {chunk['instruction']}\n"
        context_display += f"Code:\n{chunk['output']}\n\n"

    result = {
        "response": completion,
        "context_chunks": context_display.strip(),  # Now a formatted string
        "user_status": usage_tracker.get_user_status(user_id),
        "x402_info": {
            "requests_used": request_result["status"]["requests_used"],
            "free_requests_remaining": request_result["status"]["free_requests_remaining"],
            "has_paid_access": request_result["status"]["has_valid_payment"]
        }
    }
    json.dump(result, sys.stdout)

except Exception as e:
    error_msg = f"Inference error: {str(e)}"
    print(f"Error: {error_msg}", file=sys.stderr)
    json.dump({"error": error_msg}, sys.stdout)
    sys.exit(1)