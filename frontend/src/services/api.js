import axios from 'axios';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.axios = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        // Add auth token if exists
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API request failed:', error);
        return Promise.reject(error);
      }
    );
  }

  // Add chat message interceptor
  addChatInterceptor(onRequest, onResponse, onError) {
    return this.axios.interceptors.request.use(
      (config) => {
        if (config.url.includes('/chat')) {
          return onRequest(config) || config;
        }
        return config;
      },
      (error) => {
        if (onError) onError(error);
        return Promise.reject(error);
      }
    );
  }

  // Remove interceptor
  removeChatInterceptor(interceptorId) {
    this.axios.interceptors.request.eject(interceptorId);
  }

  async request(endpoint, options = {}) {
    try {
      const response = await this.axios({
        url: endpoint,
        method: options.method || 'GET',
        data: options.data,
        params: options.params,
        ...options,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
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
  });
}

// Code generation endpoints
async generateContract(prompt) {
  return this.request('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt })
  });
}

// Code analysis endpoints
async analyzeCode(code) {
  return this.request('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ code })
  });
}

// RAG search endpoints
async searchSimilarCode(query) {
  return this.request('/api/search', {
    method: 'POST',
    body: JSON.stringify({ query })
  });
}
}

export default new ApiService()
