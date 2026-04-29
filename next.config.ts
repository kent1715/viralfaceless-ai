import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: output: "standalone" removed — causes ChunkLoadError in Docker
  // Using `next start` instead
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
