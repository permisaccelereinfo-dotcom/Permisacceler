import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { Database, Json } from "@/lib/supabase/database.types";

type CheckoutRequest = {
  stageId?: string;
  formData?: Json;
  optionsPrice?: number;
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
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY before taking payments." },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as CheckoutRequest;
    const { stageId, formData } = body;
    const optionsPrice = Number.isFinite(body.optionsPrice) ? Number(body.optionsPrice) : 65;

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

    const { data: stage, error: stageError } = await databaseClient
      .from("stages")
      .select("id, title, price, stage_type, max_students, enrolled_students, is_available, status")
      .eq("id", stageId)
      .single();

    if (stageError || !stage) {
      console.error("Error fetching stage:", stageError);
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    if (!stage.is_available || stage.status !== "active") {
      return NextResponse.json({ error: "Ce stage n'est plus disponible." }, { status: 409 });
    }

    const availableSpots = stage.max_students - stage.enrolled_students;
    if (availableSpots <= 0) {
      return NextResponse.json({ error: "Ce stage est complet." }, { status: 409 });
    }

    const stagePrice = Number(stage.price);
    const totalPrice = stagePrice + Math.max(optionsPrice, 0);

    const { data: booking, error: bookingError } = await databaseClient
      .from("bookings")
      .upsert(
        {
          user_id: user.id,
          stage_id: stageId,
          status: "pending",
          total_price: totalPrice,
          balance_due: totalPrice,
          payment_status: "pending_deposit",
          metadata: formData ?? null,
        },
        { onConflict: "user_id,stage_id" }
      )
      .select("id")
      .single();

    if (bookingError || !booking) {
      console.error("Error creating booking:", bookingError);
      return NextResponse.json(
        { error: "La réservation n'a pas pu être créée." },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: stage.title,
              description: `${stage.stage_type ?? "Stage intensif"} + Accompagnement examen pratique`,
            },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/cancel`,
      client_reference_id: booking.id,
      metadata: {
        bookingId: booking.id,
        stageId: stage.id,
        userId: user.id,
      },
    });

    await databaseClient
      .from("bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", booking.id);

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Error creating checkout session:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
