import Stripe from "stripe";

// Single source of truth for the Stripe SDK + pinned API version.
// Returns null when STRIPE_SECRET_KEY is not configured so callers can
// degrade gracefully instead of throwing at import time.
const STRIPE_API_VERSION = "2026-04-22.dahlia";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: STRIPE_API_VERSION })
  : null;

export type StripeClient = NonNullable<typeof stripe>;
