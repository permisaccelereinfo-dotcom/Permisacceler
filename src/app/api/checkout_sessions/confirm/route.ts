import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { Database } from "@/lib/supabase/database.types";

type ConfirmCheckoutRequest = {
  sessionId?: string;
  bookingId?: string;
};

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2026-04-22.dahlia",
    })
  : null;

function createDatabaseClient(fallback: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return fallback;
  }

  return createSupabaseAdminClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

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
      { error: "Vous devez être connecté pour confirmer ce paiement." },
      { status: 401 }
    );
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.client_reference_id !== bookingId) {
    return NextResponse.json({ error: "La session Stripe ne correspond pas à la réservation." }, { status: 409 });
  }

  if (session.metadata?.userId !== user.id) {
    return NextResponse.json({ error: "Cette réservation appartient à un autre utilisateur." }, { status: 403 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Le paiement n'est pas encore confirmé par Stripe." }, { status: 409 });
  }

  const paidAmount = (session.amount_total ?? 0) / 100;
  const databaseClient = createDatabaseClient(supabase);

  const { error: updateError } = await databaseClient
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "fully_paid",
      deposit_paid: paidAmount,
      balance_due: 0,
      stripe_session_id: session.id,
    })
    .eq("id", bookingId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Could not confirm booking:", updateError);
    return NextResponse.json({ error: "La réservation n'a pas pu être confirmée." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
