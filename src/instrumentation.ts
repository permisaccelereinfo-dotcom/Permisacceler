import * as Sentry from "@sentry/nextjs";

// Server instrumentation hook (Next.js 16). Loads the right Sentry config per
// runtime and forwards server errors to Sentry via onRequestError.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
