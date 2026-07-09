import { NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { createDatabaseClient } from "@/lib/supabase/admin";
import { confirmPaidBooking } from "@/lib/bookings/confirmation";
import { isPaidBookingStatus } from "@/lib/bookings/status";

type ConfirmCheckoutRequest = {
  sessionId?: string;
  bookingId?: string;
};

// Fallback confirmation path used by the success page when the Stripe webhook
// is delayed or unreachable. Unlike the webhook, this is user-initiated, so it
// re-checks ownership before confirming.
export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY before confirming payments." },
      { status: 500 }
    );
  }

  const body = (await req.json()) as ConfirmCheckoutRequest;
  const { sessionId, bookingId } = body;

  if (!sessionId || !bookingId) {
    return NextResponse.json({ error: "Missing sessionId or bookingId" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour vérifier ce paiement." },
      { status: 401 }
    );
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.client_reference_id !== bookingId) {
    return NextResponse.json(
      { error: "La session Stripe ne correspond pas à la réservation." },
      { status: 409 }
    );
  }

  if (session.metadata?.userId !== user.id) {
    return NextResponse.json(
      { error: "Cette réservation appartient à un autre utilisateur." },
      { status: 403 }
    );
  }

  const databaseClient = createDatabaseClient(supabase);

  // Only attempt confirmation once Stripe reports the session as paid. If it
  // isn't paid yet we simply report current status so the client keeps polling.
  if (session.payment_status === "paid") {
    const result = await confirmPaidBooking({
      databaseClient,
      bookingId,
      userId: user.id,
      stripeSessionId: session.id,
      paidAmount: (session.amount_total ?? 0) / 100,
      fallbackUserEmail: session.customer_details?.email ?? session.customer_email,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
  }

  const { data: booking, error } = await databaseClient
    .from("bookings")
    .select("id, status, payment_status")
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    ok: isPaidBookingStatus(booking.status),
    booking,
  });
}
