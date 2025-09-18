import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Add patterns for external images if needed in the future
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb', // Increase limit to handle large images (up to 10MB + overhead)
    },
  },
};

export default nextConfig;
