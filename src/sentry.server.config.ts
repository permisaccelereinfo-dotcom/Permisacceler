// Sentry server-side initialization. Loaded from instrumentation.ts on the
// Node.js runtime. No-op unless NEXT_PUBLIC_SENTRY_DSN is set, so local dev and
// unconfigured deploys never send events.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  // Don't send PII (request bodies may contain customer data).
  sendDefaultPii: false,
});
