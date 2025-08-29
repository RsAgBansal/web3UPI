import requests
import json
import time
import os
from typing import List, Dict
import re

class SolidityCodeScraper:
    def __init__(self, output_dir="solidity_training_data"):
        self.output_dir = output_dir
        self.ensure_output_dir()
        
    def ensure_output_dir(self):
        """Create output directory if it doesn't exist."""
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
    
    def scrape_github_repos(self, repo_urls: List[str]):
        """Scrape Solidity files from GitHub repositories."""
        for repo_url in repo_urls:
            print(f"Processing repository: {repo_url}")
            try:
                # Convert GitHub URL to API URL
                if "github.com" in repo_url:
                    parts = repo_url.replace("https://github.com/", "").split("/")
                    if len(parts) >= 2:
                        owner, repo = parts[0], parts[1]
                        self.fetch_repo_solidity_files(owner, repo)
            except Exception as e:
                print(f"Error processing {repo_url}: {e}")
            
            time.sleep(2)  # Rate limiting
    
    def fetch_repo_solidity_files(self, owner: str, repo: str):
        """Fetch Solidity files from a specific GitHub repository."""
        api_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/main?recursive=1"
        
        try:
            response = requests.get(api_url)
            response.raise_for_status()
            data = response.json()
            
            solidity_files = [
                item for item in data.get('tree', [])
                if item['path'].endswith('.sol') and item['type'] == 'blob'
            ]
            
            print(f"Found {len(solidity_files)} Solidity files in {owner}/{repo}")
            
            for file_info in solidity_files[:20]:  # Limit to first 20 files per repo
                self.download_solidity_file(owner, repo, file_info['path'])
                time.sleep(0.5)  # Rate limiting
                
        except requests.RequestException as e:
            print(f"Error fetching repository tree: {e}")
    
    def download_solidity_file(self, owner: str, repo: str, file_path: str):
        """Download a specific Solidity file."""
        file_url = f"https://raw.githubusercontent.com/{owner}/{repo}/main/{file_path}"
        
        try:
            response = requests.get(file_url)
            response.raise_for_status()
            
            # Clean filename for saving
            safe_filename = file_path.replace("/", "_").replace("\\", "_")
            output_path = os.path.join(self.output_dir, f"{owner}_{repo}_{safe_filename}")
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(f"// Source: {file_url}\n")
                f.write(f"// Repository: {owner}/{repo}\n")
                f.write(f"// File: {file_path}\n\n")
                f.write(response.text)
            
            print(f"  ✓ Downloaded: {safe_filename}")
            
        except requests.RequestException as e:
            print(f"  ✗ Error downloading {file_path}: {e}")
    
    def scrape_etherscan_verified_contracts(self, limit=100):
        """Scrape verified contracts from Etherscan."""
        print(f"Fetching verified contracts from Etherscan (limit: {limit})")
        
        # Note: This requires an Etherscan API key
        # You can get one for free at: https://etherscan.io/apis
        api_key = "YourEtherscanAPIKey"  # Replace with your key
        
        url = f"https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=&apikey={api_key}"
        
        # For demo purposes, I'll show how to structure this
        print("Note: To use Etherscan API, you need to:")
        print("1. Get a free API key from https://etherscan.io/apis")
        print("2. Replace 'YourEtherscanAPIKey' in the code")
        print("3. Use the contract source code API endpoint")

# Example usage and popular Solidity repositories
POPULAR_SOLIDITY_REPOS = [
    "https://github.com/OpenZeppelin/openzeppelin-contracts",
    "https://github.com/Uniswap/uniswap-v2-core",
    "https://github.com/Uniswap/uniswap-v3-core",
    "https://github.com/compound-finance/compound-protocol",
    "https://github.com/aave/aave-protocol",
    "https://github.com/smartcontractkit/chainlink",
    "https://github.com/ethereum/solidity",
    "https://github.com/ConsenSys/Tokens",
    "https://github.com/dapphub/ds-token",
    "https://github.com/ethereum/EIPs"
]

def main():
    print("🔍 Solidity Code Scraper for Model Training")
    print("=" * 50)
    
    scraper = SolidityCodeScraper()
    
    # Option 1: Scrape from GitHub repositories
    print("\n📁 Scraping popular Solidity repositories...")
    scraper.scrape_github_repos(POPULAR_SOLIDITY_REPOS[3:])  # Start with first 3
    
    # Option 2: You can add more sources here
    print(f"\n✅ Scraping completed! Check the '{scraper.output_dir}' folder for results.")
    print("\nNext steps:")
    print("1. Review the downloaded files")
    print("2. Clean and preprocess the code")
    print("3. Create your training dataset")
    print("4. Consider adding more repositories from the POPULAR_SOLIDITY_REPOS list")

if __name__ == "__main__":
    main()
