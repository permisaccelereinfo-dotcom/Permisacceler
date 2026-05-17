import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-04-22.dahlia",
    })
  : null;

function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return null;
  }

  return createSupabaseAdminClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(req: Request) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid Stripe webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for Stripe webhooks." },
      { status: 500 }
    );
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId ?? session.client_reference_id;

    if (bookingId && session.payment_status === "paid") {
      const paidAmount = (session.amount_total ?? 0) / 100;
      const { error } = await supabaseAdmin
        .from("bookings")
        .update({
          status: "confirmed",
          payment_status: "fully_paid",
          deposit_paid: paidAmount,
          balance_due: 0,
          stripe_session_id: session.id,
        })
        .eq("id", bookingId);

      if (error) {
        console.error("Stripe webhook could not confirm booking:", error);
        return NextResponse.json({ error: "Booking update failed." }, { status: 500 });
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId ?? session.client_reference_id;

    if (bookingId) {
      const { error } = await supabaseAdmin
        .from("bookings")
        .update({
          status: "cancelled",
          cancellation_reason: "Stripe checkout session expired",
          cancelled_at: new Date().toISOString(),
          stripe_session_id: session.id,
        })
        .eq("id", bookingId)
        .eq("status", "pending");

      if (error) {
        console.error("Stripe webhook could not expire booking:", error);
        return NextResponse.json({ error: "Booking update failed." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
