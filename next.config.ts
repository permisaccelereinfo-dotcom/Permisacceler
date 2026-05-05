import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "4211-41-248-86-182.ngrok-free.app",
    "ed0c-105-156-138-107.ngrok-free.app",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "4211-41-248-86-182.ngrok-free.app",
      },
      {
        protocol: "https",
        hostname: "ed0c-105-156-138-107.ngrok-free.app",
      },
    ],
  },
};

export default nextConfig;
