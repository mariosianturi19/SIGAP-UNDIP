// src/lib/apiConfig.ts
/**
 * API Configuration Utilities
 * Centralized configuration for API endpoints and environment variables
 */

/**
 * Get the backend API base URL from environment variables
 * @returns Backend API URL without trailing slash
 */
export function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    // Development fallback (TANPA /api karena buildApiUrl akan tambahkan endpoint yang sudah ada /api)
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ NEXT_PUBLIC_API_URL is not defined, using fallback URL');
    }
    return 'https://sigap-undip-api-bda67d2f2eb2.herokuapp.com';
  }

  // Remove trailing slash if present
  return apiUrl.replace(/\/$/, '');
}

/**
 * Build full API endpoint URL
 * @param endpoint - API endpoint path (e.g., '/panic', '/reports', '/admin/users')
 * @returns Full API URL with /api prefix
 *
 * Note: Automatically adds /api prefix if not already present
 * Example: buildApiUrl('/login') → https://sigap-api.../api/login
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Auto-add /api prefix if not already present
  const finalEndpoint = cleanEndpoint.startsWith('/api/') ? cleanEndpoint : `/api${cleanEndpoint}`;

  return `${baseUrl}${finalEndpoint}`;
}

/**
 * Get auto-refresh configuration
 */
export function getRefreshConfig() {
  return {
    enabled: process.env.NEXT_PUBLIC_ENABLE_AUTO_REFRESH === 'true',
    interval: parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || '30000', 10),
  };
}

/**
 * Check if logging is enabled
 */
export function isLoggingEnabled(): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  return process.env.NEXT_PUBLIC_ENABLE_LOGS === 'true';
}

/**
 * Conditional logging based on environment
 */
export function log(...args: unknown[]): void {
  if (isLoggingEnabled()) {
    console.log(...args);
  }
}

/**
 * Conditional error logging
 */
export function logError(...args: unknown[]): void {
  // Always log errors, even in production
  console.error(...args);
}

/**
 * Conditional warning logging
 */
export function logWarn(...args: unknown[]): void {
  if (isLoggingEnabled()) {
    console.warn(...args);
  }
}

/**
 * Get all API configuration
 */
export function getApiConfig() {
  return {
    baseUrl: getApiBaseUrl(),
    refreshConfig: getRefreshConfig(),
    loggingEnabled: isLoggingEnabled(),
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '3000',
  };
}

/**
 * Validate environment variables
 * Call this during app initialization to ensure all required env vars are set
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = ['NEXT_PUBLIC_API_URL'];
  const missing: string[] = [];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('Please check your .env file and ensure all variables are set.');
    console.error('See .env.example for reference.');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
