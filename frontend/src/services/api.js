// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Chat endpoints
  async sendMessage(message, history = []) {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history: history.slice(-10) // Keep last 10 messages for context
      })
    })
  }

  // Code generation endpoints
  async generateContract(prompt) {
    return this.request('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    })
  }

  // Code analysis endpoints
  async analyzeCode(code) {
    return this.request('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ code })
    })
  }

  // RAG search endpoints
  async searchSimilarCode(query) {
    return this.request('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query })
    })
  }
}

export default new ApiService()
