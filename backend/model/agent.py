import json
import sys
import os
from coinbase_agentkit import AgentKit, AgentKitConfig
from coinbase_agentkit.wallet_providers import CdpEvmWalletProvider, CdpEvmWalletProviderConfig

# --- Load environment variables from .env ---
from dotenv import load_dotenv
import os
# Load .env from parent directory (backend/.env)
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)  # this will populate os.environ with variables from .env

# --- Debug: Print out what's being loaded ---
print("DEBUG: CDP_API_KEY_SECRET is set?", bool(os.getenv("CDP_API_KEY_SECRET")))
print("DEBUG: CDP_WALLET_SECRET is set?", bool(os.getenv("CDP_WALLET_SECRET")))
print("DEBUG: CDP_API_KEY_SECRET value:", repr(os.getenv("CDP_API_KEY_SECRET")[:100]))

# --- Initialize AgentKit ---
agent = AgentKit(AgentKitConfig())

def execute_action(action_json: str):
    """
    Takes a JSON string (from Gemini output) and executes the corresponding AgentKit action.
    """
    try:
        action = json.loads(action_json)

        # Handle array of actions (multiple transfers, etc.)
        if isinstance(action, list):
            results = []
            for single in action:
                results.append(execute_action(json.dumps(single)))
            return results

        action_type = action.get("action") or action.get("type")
        params = action.get("params") or {}

        if action_type == "transfer_eth":
            return agent.transfer_eth(
                recipient=params["recipient"],
                amount=params["amount"]
            )

        elif action_type == "transfer_token":
            return agent.transfer_token(
                recipient=params["recipient"],
                token=params["token"],
                amount=params["amount"]
            )

        elif action_type == "deploy_contract":
            return agent.deploy_contract(
                bytecode=params["bytecode"],
                constructor_args=params.get("constructor_args", [])
            )

        elif action_type == "query_balance":
            return agent.query_balance(
                address=params.get("address"),
                token=params.get("token", "ETH")
            )

        else:
            return {"error": f"Unsupported action: {action_type}"}

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    raw_input = sys.stdin.read()
    try:
        result = execute_action(raw_input)
        json.dump(result, sys.stdout)
    except Exception as e:
        json.dump({"error": f"Execution failed: {str(e)}"}, sys.stdout)
        sys.exit(1)
