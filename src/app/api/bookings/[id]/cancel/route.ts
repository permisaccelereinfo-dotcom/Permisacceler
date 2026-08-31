import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refundCheckoutSessionPayment, stripe } from "@/lib/stripe";
import { buildCancellationEmail, sendEmail } from "@/lib/email";

type BookingForCancellation = {
  id: string;
  status: string;
  payment_status: string;
  stripe_session_id: string | null;
  total_price: number | null;
  user_id: string;
  stage: {
    title: string | null;
    start_date: string | null;
    end_date: string | null;
    auto_ecole: {
      name: string | null;
      email: string | null;
      user_id: string;
    } | null;
  } | null;
  user: {
    name: string | null;
    email: string | null;
  } | null;
};

// Cancels a booking on behalf of the student who owns it or the auto-école
// that owns its stage. Cancellation of a paid booking triggers a Stripe refund
// and both flows notify the other party by email — which is why this runs
// server-side with the service-role client instead of a direct table update.
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required to cancel bookings." },
      { status: 500 }
    );
  }

  const { data } = await admin
    .from("bookings")
    .select(
      `
        id, status, payment_status, stripe_session_id, total_price, user_id,
        stage:stage_id (
          title, start_date, end_date,
          auto_ecole:auto_ecole_id (name, email, user_id)
        ),
        user:user_id (name, email)
      `
    )
    .eq("id", id)
    .maybeSingle();

  const booking = data as unknown as BookingForCancellation | null;

  const isStudent = booking?.user_id === user.id;
  const isSchool = booking?.stage?.auto_ecole?.user_id === user.id;

  // 404 for both "does not exist" and "not yours" so booking ids don't leak.
  if (!booking || (!isStudent && !isSchool)) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }

  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return NextResponse.json(
      { error: "Cette réservation est déjà terminée ou annulée." },
      { status: 409 }
    );
  }

  const cancelledBy = isSchool ? "auto_ecole" : "student";

  // Cancel first, guarded on the current status so a payment confirmation
  // racing this request wins one way or the other, never both.
  const { data: cancelledRows, error: cancelError } = await admin
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason:
        cancelledBy === "auto_ecole" ? "Annulée par l'auto-école" : "Annulée par l'élève",
    })
    .eq("id", booking.id)
    .in("status", ["pending", "confirmed"])
    .select("id, payment_status");

  if (cancelError) {
    Sentry.captureException(cancelError);
    return NextResponse.json(
      { error: "L'annulation a échoué. Réessayez." },
      { status: 500 }
    );
  }

  if (!cancelledRows || cancelledRows.length === 0) {
    return NextResponse.json(
      { error: "La réservation vient de changer de statut. Rechargez la page." },
      { status: 409 }
    );
  }

  // Refund a fully paid booking. The status is re-read from the guarded update
  // in case the payment settled between our first read and the cancellation.
  // A refund failure doesn't undo the cancellation: Sentry alerts support so
  // the refund is done manually.
  const wasPaid = cancelledRows[0].payment_status === "fully_paid";
  let refunded = false;

  if (wasPaid && booking.stripe_session_id) {
    if (!stripe) {
      Sentry.captureMessage(
        `Booking ${booking.id} cancelled but Stripe is not configured — refund manually.`,
        "error"
      );
    } else {
      try {
        refunded = await refundCheckoutSessionPayment(stripe, booking.stripe_session_id);
        if (refunded) {
          await admin
            .from("bookings")
            .update({ payment_status: "refunded" })
            .eq("id", booking.id);
        }
      } catch (refundErr) {
        Sentry.captureException(refundErr);
        Sentry.captureMessage(
          `Booking ${booking.id} cancelled but the Stripe refund failed — refund manually.`,
          "error"
        );
      }
    }
  }

  // Notify the other party (and never fail the cancellation over an email).
  try {
    const recipientEmail =
      cancelledBy === "auto_ecole"
        ? booking.user?.email
        : booking.stage?.auto_ecole?.email;
    const recipientName =
      cancelledBy === "auto_ecole"
        ? booking.user?.name || "Client"
        : booking.stage?.auto_ecole?.name || "";

    if (recipientEmail) {
      const email = buildCancellationEmail({
        recipientName,
        cancelledBy,
        stageTitle: booking.stage?.title || "Stage",
        autoEcoleName: booking.stage?.auto_ecole?.name || "",
        startDate: booking.stage?.start_date || "",
        endDate: booking.stage?.end_date || "",
        totalPrice: booking.total_price ?? 0,
        wasPaid,
        refunded,
      });
      await sendEmail({ to: recipientEmail, subject: email.subject, html: email.html });
    }
  } catch (emailErr) {
    console.error("Failed to send cancellation email:", emailErr);
    Sentry.captureException(emailErr);
  }

  return NextResponse.json({ ok: true, refunded });
}
