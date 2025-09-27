import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    return this.token;
  }

  async request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {})
    };

    if (!skipAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else if (!skipAuth && !this.token) {
      // For demo/testing purposes, use a demo token for Instagram endpoints
      if (endpoint.includes('/instagram/')) {
        headers['Authorization'] = 'Bearer demo_token_for_testing';
      }
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        if (response.status === 401) {
          this.setToken(null);
          window.location.href = '/auth';
          throw new Error('Session expired');
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  auth = {
    sendOtp: (email: string) => 
      this.request('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
        skipAuth: true
      }),
    
    verifyOtp: (email: string, code: string) =>
      this.request<{ token: string; user: any }>("/api/auth/verify-otp", {
        method: 'POST',
        body: JSON.stringify({ email, code }),
        skipAuth: true
      }),
    
    signup: (email: string, password: string) =>
      this.request<{ token: string; user: any }>("/api/auth/signup", {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true
      }),
    
    login: (email: string, password: string) =>
      this.request<{ token: string; user: any }>("/api/auth/login", {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true
      }),
    
    guestLogin: () =>
      this.request<{ token: string; user: any }>('/api/auth/guest', {
        method: 'POST',
        skipAuth: true
      }),
    
    getCurrentUser: () =>
      this.request<{ user: any }>('/api/auth/me'),
    
    logout: () =>
      this.request('/api/auth/logout', { method: 'POST' })
  };

  // Posts endpoints
  posts = {
    list: (params?: { status?: string; platform?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return this.request<{ posts: any[] }>(`/api/posts${query ? `?${query}` : ''}`);
    },
    
    get: (id: string) =>
      this.request<{ post: any }>(`/api/posts/${id}`),
    
    create: (data: any) =>
      this.request<{ post: any }>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    update: (id: string, data: any) =>
      this.request<{ post: any }>(`/api/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    delete: (id: string) =>
      this.request(`/api/posts/${id}`, { method: 'DELETE' }),
    
    getCalendar: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      return this.request<{ posts: any[] }>(`/api/posts/calendar/scheduled?${params}`);
    }
  };

  // Social accounts endpoints
  socialAccounts = {
    list: () =>
      this.request<{ accounts: any[] }>('/api/social-accounts'),
    
    verifyInstagram: () =>
      this.request('/api/instagram/verify', { method: 'POST' }),
    
    disconnect: (platform: string) =>
      this.request(`/api/social-accounts/${platform}`, { method: 'DELETE' })
  };

  // Chat endpoints
  chat = {
    getSession: () =>
      this.request<{ session: any }>('/api/chat/session'),
    
    sendMessage: (sessionId: string, message: string, replyingTo?: any) =>
      this.request<{ userMessage: any; assistantMessage: any }>('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ sessionId, message, replyingTo })
      }),
    
    saveAsDraft: (content: string, platform?: string) =>
      this.request<{ post: any }>('/api/chat/save-as-draft', {
        method: 'POST',
        body: JSON.stringify({ content, platform })
      }),
    
    generateImage: (prompt: string, model?: string, sessionId?: string) =>
      this.request<{ imageUrl: string; model: string; modelName: string; prompt: string; userMessage?: any; assistantMessage?: any }>('/api/chat/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt, model, sessionId })
      }),
    
    getImageModels: () =>
      this.request<{ models: Record<string, { name: string; description: string; recommended: boolean }> }>('/api/chat/image-models')
  };
}

export const api = new ApiClient();

// Helper hooks
export const useApi = () => {
  return api;
};