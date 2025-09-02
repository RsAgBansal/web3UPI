from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import sys
import os
from multiprocessing import Value
from functools import wraps

app = Flask(__name__)
CORS(app)

# ✅ Add request counter with thread-safe increment
request_counter = Value('i', 0)  # Integer counter starting at 0
FREE_LIMIT = 1

# Get the path to the model directory
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model')

def increment_request_count():
    """Thread-safe counter increment"""
    with request_counter.get_lock():
        request_counter.value += 1
        return request_counter.value

def get_request_count():
    """Get current request count safely"""
    with request_counter.get_lock():
        return request_counter.value

def track_requests(f):
    """Decorator to automatically track API requests"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Increment counter before processing request
        current_count = increment_request_count()
        print(f"🔢 Request #{current_count} to {request.endpoint}")
        
        # Execute the original function
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/chat', methods=['GET', 'POST'])
@track_requests  # ✅ This will increment counter automatically
def chat():
    """Handle chat requests from frontend and send to llm.py"""
    current_requests = get_request_count()
    
    # Check if user exceeded free limit
    if current_requests > FREE_LIMIT:
        return jsonify({
            "error": "Free limit exceeded. Payment required.",
            "requests_made": current_requests,
            "free_limit": FREE_LIMIT,
            "payment_required": True
        }), 402  # Payment Required
    
    try:
        # Get the message from frontend
        data = request.get_json()
        message = data.get('message', '')
        
        if not message:
            return jsonify({"error": "No message provided"}), 400
            
        # Prepare input for llm.py
        llm_input = {
            "prompt": message
        }
        
        # Call llm.py script
        result = subprocess.run(
            [sys.executable, 'llm.py'],
            input=json.dumps(llm_input),
            text=True,
            capture_output=True,
            cwd=MODEL_DIR
        )
        
        if result.returncode == 0:
            try:
                llm_response = json.loads(result.stdout)
                
                return jsonify({
                    "success": True,
                    "response": llm_response.get("response", ""),
                    "context_chunks": llm_response.get("context_chunks", ""),
                    "raw_llm_output": llm_response,
                    "requests_made": current_requests,  # ✅ Include current count
                    "free_limit": FREE_LIMIT
                })
            except json.JSONDecodeError:
                return jsonify({
                    "error": "Invalid JSON response from LLM",
                    "raw_output": result.stdout
                }), 500
        else:
            return jsonify({
                "error": "LLM execution failed",
                "stderr": result.stderr,
                "stdout": result.stdout
            }), 500
            
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/user/status', methods=['GET'])
def user_status():
    """Get user payment status and request limits"""
    try:
        current_requests = get_request_count()
        payment_required = current_requests >= FREE_LIMIT
        
        return jsonify({
            "requests_made": current_requests,  # ✅ Real dynamic count
            "free_limit": FREE_LIMIT,
            "user_id": "user123",
            "payment_required": payment_required,
            "remaining_requests": max(0, FREE_LIMIT - current_requests)
        })
    except Exception as e:
        return jsonify({"error": f"Status error: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    current_requests = get_request_count()
    return jsonify({
        "status": "healthy", 
        "message": "Backend is running",
        "total_requests": current_requests
    })

@app.route('/api/reset-counter', methods=['POST'])
def reset_counter():
    """Reset request counter (for testing)"""
    with request_counter.get_lock():
        request_counter.value = 0
    return jsonify({"message": "Counter reset", "requests_made": 0})

@app.route('/api/verify-payment', methods=['POST'])
def verify_payment():
    """Verify payment and reset user's request count"""
    try:
        data = request.get_json()
        tx_hash = data.get('tx_hash')
        
        if not tx_hash:
            return jsonify({"error": "Transaction hash required"}), 400
            
        # TODO: Add real payment verification logic here
        # For now, just reset the counter
        with request_counter.get_lock():
            request_counter.value = 0
            
        return jsonify({
            "success": True, 
            "message": "Payment verified and counter reset",
            "tx_hash": tx_hash
        })
    except Exception as e:
        return jsonify({"error": f"Payment verification error: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Starting Neo Pay Backend Server")
    print(f"📁 Model directory: {MODEL_DIR}")
    print("🌐 Server will run on http://localhost:8000")
    print(f"🔢 Request counter initialized at: {get_request_count()}")
    
    app.run(debug=True, host='0.0.0.0', port=8000)
