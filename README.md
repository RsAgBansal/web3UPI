# Payment Assistant - x402 Crypto Payment Chat Interface

A modern React-based chat interface with integrated x402 cryptocurrency payment protocol for seamless blockchain interactions. Features RAG-based context generation for programmable payments with automatic per-request charging.

## Features

- RAG-Based Context Generation - Retrieval-Augmented Generation for intelligent programming assistance
- Programmable Payments - Smart contract and blockchain development with contextual AI responses
- x402 Payment Protocol - Automatic USDC payments over HTTP for premium AI features  
- Per-Request Charging - Pay-as-you-go model with automatic payment processing
- Crypto Wallet Integration - Seamless wallet connection and transaction signing
- Request Limit Management - Free tier with automatic payment prompts
- Blockchain Action Cards - Interactive components for contract deployment and execution
- Real-time Payment Processing - EIP-712 signed payment authorizations
- Context-Aware AI - Retrieves relevant documentation and code examples
- Network Support - Base Mainnet and Base Sepolia testnet compatibility

## Tech Stack

### Frontend
- React 18 with Hooks
- Vite for build tooling and development
- Tailwind CSS for styling
- Web3 Wallet SDK for universal wallet integration
- x402 Protocol for crypto payments

### Backend  
- Flask Python web framework
- Flask-CORS for cross-origin requests
- RAG Pipeline for context retrieval and generation
- Vector Database for embedding storage
- LLM Integration for AI model processing
- JSON for API communication

### AI/ML Stack
- Vector Embeddings for semantic search
- Document Retrieval for context generation
- Large Language Models for code generation
- Semantic Similarity matching for relevant examples
- Context Injection for enhanced AI responses

### Blockchain
- Base Network (Ethereum L2)
- USDC stablecoin for payments
- EIP-712 for typed data signing
- ERC-3009 transferWithAuthorization
- Universal Wallet Support (MetaMask, Coinbase, WalletConnect, etc.)

### Payment Infrastructure
- x402 HTTP Payment Protocol
- Automatic Payment Processing
- Request-Based Billing
- Real-time Transaction Verification
- Gasless Payment Authorizations

### Data & Context
- RAG (Retrieval-Augmented Generation)
- Vector Database for context storage
- Embedding Models for semantic search
- Context Chunking and relevance scoring
- Dynamic Context Injection into AI prompts

## Installation

### Prerequisites
```
System Requirements:
- Node.js 18+ and npm/yarn
- Python 3.9+
- Git
- Web3-compatible wallet (MetaMask, Coinbase Wallet, etc.)
- USDC tokens on Base network for payments
```

### Quick Start
```bash
# Clone repository
git clone https://github.com/your-username/payment-assistant.git
cd payment-assistant

# Install frontend dependencies
npm install

# Setup backend
cd backend
pip install -r requirements.txt

# Environment configuration
cp .env.example .env
# Edit .env with your API keys and configuration

# Start development servers
npm run dev        # Frontend (port 3000)
python app.py      # Backend (port 8000)
```

### Environment Setup
```bash
# Backend Environment (.env)
FLASK_ENV=development
OPENAI_API_KEY=your_openai_key
VECTOR_DB_URL=your_vector_database_url
FACILITATOR_URL=https://x402.org/api
PAYMENT_WALLET_ADDRESS=your_payment_address

# Frontend Environment (.env.local)
VITE_API_BASE_URL=http://localhost:8000
VITE_NETWORK_CHAIN_ID=8453
VITE_USDC_CONTRACT=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Database Setup
```bash
# Initialize vector database for RAG
python scripts/init_vector_db.py

# Load training data and documentation
python scripts/load_context_data.py

# Verify RAG pipeline
python scripts/test_rag.py
```

### Production Deployment
```bash
# Build frontend
npm run build

# Deploy backend
gunicorn --bind 0.0.0.0:8000 app:app

# Set production environment variables
export FLASK_ENV=production
export VECTOR_DB_URL=your_production_db
```

## Usage

### Basic Chat Interface
1. Open the application in your browser
2. Start chatting with the AI assistant
3. Ask questions about Solidity, smart contracts, or blockchain development
4. Receive contextual code examples and explanations

### Payment Flow (x402 Protocol)
1. Free Tier: First 5 requests are free
2. Payment Required: After limit reached, connect your crypto wallet
3. Automatic Payments: Each subsequent request automatically charges ~$0.10 USDC
4. Seamless Experience: Payments processed via x402 protocol without manual intervention

### RAG Context Generation
1. AI retrieves relevant documentation and code examples
2. Context is injected into prompts for enhanced responses
3. Semantic similarity matching ensures relevance
4. Dynamic context window optimization

## API Documentation

### Endpoints
```
GET  /api/health          # Health check
GET  /api/user/status     # Get user request count and limits  
POST /api/chat           # Chat with AI (with payment handling)
POST /api/verify-payment # Verify payment transactions
POST /api/test-llm       # Test LLM connectivity
```

### Request Examples
```json
# Chat Request
{
  "message": "Create an ERC20 token contract"
}

# Chat Response (Success)
{
  "success": true,
  "response": "{\"action\":\"create_contract\",\"code\":\"...\"}",
  "context_chunks": "Retrieved documentation...",
  "requests_made": 3,
  "free_limit": 5,
  "remaining": 2
}

# Payment Required (402 Response)
{
  "error": "Free limit exceeded. Payment required.",
  "requests_made": 6,
  "free_limit": 5,
  "payment_required": true
}
```

## Configuration

### Network Configuration
```javascript
// Base Mainnet
const BASE_MAINNET = {
  chainId: '0x2105',
  chainName: 'Base',
  rpcUrls: ['https://mainnet.base.org'],
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
};

// Base Sepolia (Testnet)  
const BASE_SEPOLIA = {
  chainId: '0x14a34',
  chainName: 'Base Sepolia',
  rpcUrls: ['https://sepolia.base.org'],
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
};
```

## Security

- EIP-712 Typed Data Signatures for payment authorization
- Nonce-based Replay Protection prevents duplicate payments
- Time-bounded Payment Validity (1 hour expiration)
- CORS Protection on backend APIs
- Client-side Input Validation
- Secure Private Key Handling (never exposed to frontend)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow React hooks patterns
- Use Tailwind for consistent styling
- Implement proper error handling
- Add JSDoc comments for functions
- Test payment flows thoroughly

## License

### MIT License

Copyright (c) 2025 Payment Assistant Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### Third Party Licenses

- x402 Protocol: Open source payment protocol by Coinbase
- React: MIT License by Meta Platforms, Inc.
- Vite: MIT License by Evan You
- Flask: BSD-3-Clause License
- Tailwind CSS: MIT License
- Base Network: Usage subject to Base Terms of Service

### Payment Protocol Notice

This software implements the x402 payment protocol. Users are responsible for:
- Compliance with local cryptocurrency regulations
- Understanding payment terms and gas fees
- Securing their private keys and wallet access
- USDC token management on Base network

Commercial Use: Permitted under MIT license with attribution required.

Data Privacy: RAG context and user interactions may be processed by AI models. Review privacy policy for details.

## Support

- Documentation: [x402 Protocol Docs](https://docs.cdp.coinbase.com/x402)
- Issues: GitHub Issues page
- Discord: [Coinbase Developer Platform](https://discord.gg/cdp)

## Acknowledgments

- Coinbase for x402 protocol development
- Base Network for L2 infrastructure
- OpenAI for AI model integration
- Vite for excellent developer experience
- Tailwind CSS for utility-first styling

---

Built for the future of programmable payments and AI-assisted development
