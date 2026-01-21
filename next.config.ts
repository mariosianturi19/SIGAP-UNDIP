// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'firebasestorage.googleapis.com', 
      'sigap-api-5hk6r.ondigitalocean.app',
      'sigap-undip-api-bda67d2f2eb2.herokuapp.com'
    ],
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ENABLE_AUTO_REFRESH: process.env.NEXT_PUBLIC_ENABLE_AUTO_REFRESH,
    NEXT_PUBLIC_REFRESH_INTERVAL: process.env.NEXT_PUBLIC_REFRESH_INTERVAL,
    NEXT_PUBLIC_ENABLE_LOGS: process.env.NEXT_PUBLIC_ENABLE_LOGS,
  },

  // Note: Backend CORS already configured to allow all origins
  // No rewrites needed since we're calling backend directly

  // Logging untuk environment variables (development only)
  webpack: (config, { dev }) => {
    if (dev) {
      console.log('🔧 Environment Variables:');
      console.log('  - NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || '❌ NOT SET');
      console.log('  - NODE_ENV:', process.env.NODE_ENV);
      console.log('  - PORT:', process.env.PORT || '3000 (default)');
    }
    return config;
  },
};

export default nextConfig;