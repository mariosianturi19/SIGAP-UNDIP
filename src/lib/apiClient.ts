// src/lib/apiClient.ts
import { getAccessToken, clearAuthTokens } from './auth';

interface ApiClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
}

// Define a generic type for request data
type RequestData = Record<string, unknown> | unknown[] | string | number | boolean | null;

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  async request<T>(
    endpoint: string,
    method: string = 'GET',
    data?: RequestData,
    requireAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = { ...this.defaultHeaders };

    // Add auth header if required
    if (requireAuth) {
      const token = await getAccessToken();
      
      if (!token) {
        // Redirect to login or handle unauthenticated state
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Authentication required');
      }
      
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
      credentials: 'include', // Include cookies if necessary
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);

      // Handle 401 Unauthorized errors
      if (response.status === 401) {
        // If we get here, it means token refresh failed
        clearAuthTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      // For 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, 'GET', undefined, requireAuth);
  }

  async post<T>(endpoint: string, data: RequestData, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, 'POST', data, requireAuth);
  }

  async put<T>(endpoint: string, data: RequestData, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, 'PUT', data, requireAuth);
  }

  async delete<T>(endpoint: string, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', undefined, requireAuth);
  }
}

// Create and export an instance with our API base URL
export const apiClient = new ApiClient({
  baseUrl: 'https://sigap-api-5hk6r.ondigitalocean.app/api',
});