import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { Json } from "@/lib/supabase/database.types";
import { EXAM_SUPPORT_PRICE } from "@/lib/checkout/pricing";
import { sanitizeCheckoutMetadata } from "@/lib/checkout/metadata";
import { stripe } from "@/lib/stripe";
import { createDatabaseClient } from "@/lib/supabase/admin";

type CheckoutRequest = {
  stageId?: string;
  formData?: Json;
};

// Stripe checkout sessions expire so abandoned carts release their reserved
// seat quickly (Stripe allows 30 min – 24 h; we use the 30 min minimum).
const CHECKOUT_SESSION_TTL_SECONDS = 30 * 60;

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY before taking payments." },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as CheckoutRequest;
    const { stageId, formData } = body;

    if (!stageId) {
      return NextResponse.json({ error: "Missing stageId" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour réserver ce stage." },
        { status: 401 }
      );
    }

    const databaseClient = createDatabaseClient(supabase);

    // Never persist secrets (e.g. the account password) the client may include
    // in formData — whitelist the fields we actually want to keep.
    const safeMetadata = sanitizeCheckoutMetadata(formData);

    const { data: reservation, error: reservationError } = await databaseClient
      .rpc("reserve_booking_for_checkout", {
        p_user_id: user.id,
        p_stage_id: stageId,
        p_metadata: safeMetadata,
        p_exam_support_price: EXAM_SUPPORT_PRICE,
      })
      .single();

    if (reservationError || !reservation) {
      console.error("Error reserving booking:", reservationError);
      const message =
        reservationError?.message || "La réservation n'a pas pu être créée.";
      return NextResponse.json(
        { error: message },
        {
          status:
            message.includes("introuvable") || message.includes("not found")
              ? 404
              : message.includes("complet") ||
                  message.includes("disponible") ||
                  message.includes("déjà")
                ? 409
                : 400,
        }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: reservation.stage_title,
              description: `${reservation.stage_type ?? "Stage intensif"} + Accompagnement examen pratique`,
            },
            unit_amount: Math.round(Number(reservation.total_price) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_TTL_SECONDS,
      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${reservation.booking_id}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/cancel`,
      client_reference_id: reservation.booking_id,
      metadata: {
        bookingId: reservation.booking_id,
        stageId,
        userId: user.id,
      },
    });

    await databaseClient
      .from("bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", reservation.booking_id);

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Error creating checkout session:", message);
    Sentry.captureException(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
