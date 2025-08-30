from flask import Flask, request, jsonify
from model.agent import execute_action

app = Flask(__name__)

@app.route("/api/agent", methods=["POST"])
def agent_action():
    try:
        action_json = request.get_data(as_text=True)
        result = execute_action(action_json)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Execution failed: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True)