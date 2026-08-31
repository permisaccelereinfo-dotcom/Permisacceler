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

/**
 * Refund the payment behind a checkout session. Returns true when the payment
 * is refunded (including when Stripe reports it was already refunded), false
 * when the session has no payment to refund. Other Stripe errors propagate.
 */
export async function refundCheckoutSessionPayment(
  client: StripeClient,
  stripeSessionId: string
): Promise<boolean> {
  const session = await client.checkout.sessions.retrieve(stripeSessionId);
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntentId) {
    return false;
  }

  try {
    await client.refunds.create({ payment_intent: paymentIntentId });
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError && err.code === "charge_already_refunded") {
      return true;
    }
    throw err;
  }

  return true;
}
