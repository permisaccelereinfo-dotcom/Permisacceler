import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Optional dev tunnel host (e.g. an ngrok hostname used for Stripe webhook
// testing). Set NGROK_HOST in your local env instead of hardcoding ephemeral
// tunnels in committed config.
const tunnelHost = process.env.NGROK_HOST?.replace(/^https?:\/\//, "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: tunnelHost ? [tunnelHost] : [],
  experimental: {
    cpus: 1,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1,
    webpackMemoryOptimizations: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(tunnelHost
        ? [{ protocol: "https" as const, hostname: tunnelHost }]
        : []),
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Quiet during local builds; verbose in CI.
  silent: !process.env.CI,
  // Only generate/upload source maps when an auth token is present, so
  // token-less local/CI builds don't attempt an upload.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  telemetry: false,
});
