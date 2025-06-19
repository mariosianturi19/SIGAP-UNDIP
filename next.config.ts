// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['firebasestorage.googleapis.com', 'sigap-api-5hk6r.ondigitalocean.app'],
  },
};

export default nextConfig;