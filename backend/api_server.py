from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import sys
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Get the path to the model directory
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model')

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat requests from frontend and send to llm.py with X402 support"""
    try:
        # Get the message from frontend
        data = request.get_json()
        message = data.get('message', '')
        payment_tx_hash = data.get('payment_tx_hash', '')  # For payment verification
        
        if not message:
            return jsonify({"error": "No message provided"}), 400
            
        # Get user identification info
        user_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
        user_agent = request.headers.get('User-Agent', '')
        
        # Prepare input for llm.py with X402 data
        llm_input = {
            "prompt": message,
            "user_ip": user_ip,
            "user_session": user_agent[:50],  # Use part of user agent as session identifier
            "payment_tx_hash": payment_tx_hash
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
            # Parse the JSON response from llm.py
            try:
                llm_response = json.loads(result.stdout)
                
                # Return the response to frontend
                return jsonify({
                    "success": True,
                    "response": llm_response.get("response", ""),
                    "context_chunks": llm_response.get("context_chunks", ""),
                    "user_status": llm_response.get("user_status", {}),
                    "x402_info": llm_response.get("x402_info", {}),
                    "payment_verification": llm_response.get("payment_verification", {}),
                    "raw_llm_output": llm_response
                })
            except json.JSONDecodeError:
                return jsonify({
                    "error": "Invalid JSON response from LLM",
                    "raw_output": result.stdout
                }), 500
        else:
            # Handle X402 payment required error
            try:
                error_response = json.loads(result.stdout)
                if error_response.get("error_code") == 402:
                    return jsonify(error_response), 402
            except:
                pass
            
            return jsonify({
                "error": "LLM execution failed",
                "stderr": result.stderr,
                "stdout": result.stdout
            }), 500
            
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Backend is running"})

@app.route('/api/test-llm', methods=['POST'])
def test_llm():
    """Test endpoint to check if llm.py is working"""
    try:
        # Test with a simple prompt
        test_input = {"prompt": "create an ERC20 token"}
        
        result = subprocess.run(
            [sys.executable, 'llm.py'],
            input=json.dumps(test_input),
            text=True,
            capture_output=True,
            cwd=MODEL_DIR
        )
        
        return jsonify({
            "llm_available": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "return_code": result.returncode
        })
        
    except Exception as e:
        return jsonify({
            "llm_available": False,
            "error": str(e)
        })

@app.route('/api/usage/status', methods=['POST'])
def get_usage_status():
    """Get user usage status for X402 feature"""
    try:
        from model.usage_tracker import usage_tracker
        
        data = request.get_json()
        user_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
        user_agent = request.headers.get('User-Agent', '')
        
        # Generate user ID same way as llm.py
        import hashlib
        user_id = hashlib.md5(f"{user_ip}_{user_agent[:50]}".encode()).hexdigest()[:12]
        
        status = usage_tracker.get_user_status(user_id)
        
        return jsonify({
            "success": True,
            "user_id": user_id,
            "status": status
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to get usage status: {str(e)}"}), 500

@app.route('/api/payment/request', methods=['POST'])
def get_payment_request():
    """Get payment request details for X402"""
    try:
        from model.usage_tracker import usage_tracker
        
        data = request.get_json()
        user_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
        user_agent = request.headers.get('User-Agent', '')
        
        # Generate user ID same way as llm.py
        import hashlib
        user_id = hashlib.md5(f"{user_ip}_{user_agent[:50]}".encode()).hexdigest()[:12]
        
        payment_request = usage_tracker.get_payment_request(user_id)
        
        return jsonify({
            "success": True,
            "user_id": user_id,
            "payment_request": payment_request
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to get payment request: {str(e)}"}), 500

@app.route('/api/payment/verify', methods=['POST'])
def verify_payment():
    """Verify payment transaction for X402"""
    try:
        from model.usage_tracker import usage_tracker
        
        data = request.get_json()
        tx_hash = data.get('tx_hash', '')
        
        if not tx_hash:
            return jsonify({"error": "Transaction hash is required"}), 400
        
        user_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
        user_agent = request.headers.get('User-Agent', '')
        
        # Generate user ID same way as llm.py
        import hashlib
        user_id = hashlib.md5(f"{user_ip}_{user_agent[:50]}".encode()).hexdigest()[:12]
        
        verification_result = usage_tracker.verify_payment(user_id, tx_hash)
        
        return jsonify({
            "success": True,
            "user_id": user_id,
            "verification": verification_result
        })
        
    except Exception as e:
        return jsonify({"error": f"Payment verification failed: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Starting Neo Pay Backend Server")
    print(f"📁 Model directory: {MODEL_DIR}")
    print("🌐 Server will run on http://localhost:8000/api/chat")
    print("🔗 Frontend should connect to http://localhost:8000/api/chat")
    
    app.run(debug=True, host='0.0.0.0', port=8000)

# import requests
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import subprocess, json, sys, os

# app = Flask(__name__)
# CORS(app)

# MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model')

# # --- Simple free usage tracking ---
# user_usage = {}  # key: user_id, value: number of free requests used
# FREE_LIMIT = 3

# # Coinbase Commerce API setup
# COINBASE_API_KEY = os.getenv("COINBASE_API_KEY")
# COINBASE_API_URL = "https://api.commerce.coinbase.com/charges"
# COINBASE_HEADERS = {
#     "Content-Type": "application/json",
#     "X-CC-Api-Key": COINBASE_API_KEY,
#     "X-CC-Version": "2018-03-22"
# }

# @app.route('/api/chat', methods=['POST'])
# def chat():
#     data = request.get_json()
#     message = data.get('message', '')
#     user_id = data.get('user_id', 'guest')  # you’ll want JWT or session auth later

#     if not message:
#         return jsonify({"error": "No message provided"}), 400

#     # Check free usage
#     used = user_usage.get(user_id, 0)
#     if used >= FREE_LIMIT:
#         # Require payment via Coinbase
#         charge_data = {
#             "name": "LLM Access",
#             "description": "Unlock unlimited chat with our AI model",
#             "local_price": {"amount": "1.00", "currency": "USD"},
#             "pricing_type": "fixed_price",
#             "metadata": {"user_id": user_id}
#         }
#         response = requests.post(COINBASE_API_URL, headers=COINBASE_HEADERS, json=charge_data)
#         if response.status_code == 201:
#             charge = response.json()["data"]
#             return jsonify({
#                 "success": False,
#                 "payment_required": True,
#                 "payment_url": charge["hosted_url"]
#             })
#         else:
#             return jsonify({
#                 "error": "Payment system unavailable",
#                 "details": response.text
#             }), 500

#     # Otherwise, count usage and run LLM
#     user_usage[user_id] = used + 1

#     llm_input = {"prompt": message}
#     result = subprocess.run(
#         [sys.executable, 'llm.py'],
#         input=json.dumps(llm_input),
#         text=True,
#         capture_output=True,
#         cwd=MODEL_DIR
#     )
#     if result.returncode == 0:
#         try:
#             llm_response = json.loads(result.stdout)
#             return jsonify({
#                 "success": True,
#                 "response": llm_response.get("response", "")
#             })
#         except json.JSONDecodeError:
#             return jsonify({"error": "Invalid JSON from LLM"}), 500
#     else:
#         return jsonify({"error": "LLM execution failed"}), 500


# # Coinbase webhook endpoint
# @app.route('/api/webhook/coinbase', methods=['POST'])
# def coinbase_webhook():
#     event = request.get_json()
#     # TODO: verify signature with Coinbase webhook secret
#     if event and event.get("event", {}).get("type") == "charge:confirmed":
#         user_id = event["event"]["data"]["metadata"]["user_id"]
#         # Reset or extend their quota
#         user_usage[user_id] = 0
#     return jsonify({"status": "ok"})

