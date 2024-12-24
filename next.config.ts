import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['arjaymorenophotography.com'], // Add other domains as needed
  },
  typescript: {
    ignoreBuildErrors: false, // Ensure type checking during build
  },
};

export default nextConfig;
