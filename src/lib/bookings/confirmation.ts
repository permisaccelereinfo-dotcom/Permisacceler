import type { SupabaseClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { Database } from "@/lib/supabase/database.types";
import {
  buildAutoEcoleNotificationEmail,
  buildConfirmationEmail,
  buildReceiptEmail,
  sendEmail,
} from "@/lib/email";
import { isPaidBookingStatus } from "@/lib/bookings/status";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];
type StageRow = Database["public"]["Tables"]["stages"]["Row"];
type AutoEcoleRow = Database["public"]["Tables"]["auto_ecoles"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

type BookingWithRelations = BookingRow & {
  stage:
    | (StageRow & {
        auto_ecole: AutoEcoleRow | null;
      })
    | null;
  user: Pick<UserRow, "name" | "email" | "phone"> | null;
};

type EmailTimestampColumn =
  | "confirmation_email_sent_at"
  | "receipt_email_sent_at"
  | "auto_ecole_notified_at";

type ConfirmPaidBookingParams = {
  databaseClient: SupabaseClient<Database>;
  bookingId: string;
  stripeSessionId: string;
  paidAmount: number;
  userId?: string;
  fallbackUserEmail?: string | null;
};

type ConfirmPaidBookingResult =
  | {
      ok: true;
      wasAlreadyPaid: boolean;
    }
  | {
      ok: false;
      status: number;
      error: string;
      // "booking_not_pending": the payment landed on a booking that is no
      // longer pending (typically cancelled meanwhile) — the caller should
      // refund it rather than retry.
      code?: "booking_not_pending";
    };

export async function confirmPaidBooking({
  databaseClient,
  bookingId,
  stripeSessionId,
  paidAmount,
  userId,
  fallbackUserEmail,
}: ConfirmPaidBookingParams): Promise<ConfirmPaidBookingResult> {
  let existingQuery = databaseClient
    .from("bookings")
    .select(
      "id, status, total_price, confirmation_email_sent_at, receipt_email_sent_at, auto_ecole_notified_at"
    )
    .eq("id", bookingId);

  if (userId) {
    existingQuery = existingQuery.eq("user_id", userId);
  }

  const { data: existingBooking, error: existingError } = await existingQuery.maybeSingle();

  if (existingError || !existingBooking) {
    return {
      ok: false,
      status: 404,
      error: "La réservation est introuvable.",
    };
  }

  const wasAlreadyPaid = isPaidBookingStatus(existingBooking.status);

  // Never resurrect a cancelled booking: the school (or the expired-session
  // webhook) may have cancelled it while the student was still on the Stripe
  // page, and the seat may have been released or resold since.
  if (!wasAlreadyPaid && existingBooking.status !== "pending") {
    return {
      ok: false,
      status: 409,
      code: "booking_not_pending",
      error: "La réservation a été annulée avant la confirmation du paiement.",
    };
  }

  if (!wasAlreadyPaid) {
    // Guard against confirming a booking that wasn't paid in full. The amount
    // is server-computed at session creation, but verifying it here protects
    // against tampering and zero-amount events. A 1 cent tolerance absorbs
    // floating-point rounding.
    const expectedTotal = Number(existingBooking.total_price ?? 0);
    if (!(paidAmount > 0) || paidAmount + 0.01 < expectedTotal) {
      console.error(
        `Refusing to confirm booking ${bookingId}: paid ${paidAmount} < expected ${expectedTotal}`
      );
      return {
        ok: false,
        status: 409,
        error: "Le montant payé ne correspond pas au total de la réservation.",
      };
    }

    // .eq("status", "pending") re-checks the status atomically: a cancellation
    // racing between the read above and this write must not be overwritten.
    let updateQuery = databaseClient
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "fully_paid",
        deposit_paid: paidAmount,
        balance_due: 0,
        stripe_session_id: stripeSessionId,
      })
      .eq("id", bookingId)
      .eq("status", "pending");

    if (userId) {
      updateQuery = updateQuery.eq("user_id", userId);
    }

    const { data: updatedRows, error: updateError } = await updateQuery.select("id");

    if (updateError) {
      console.error("Could not confirm booking:", updateError);
      Sentry.captureException(updateError);
      return {
        ok: false,
        status: 500,
        error: "La réservation n'a pas pu être confirmée.",
      };
    }

    if (!updatedRows || updatedRows.length === 0) {
      return {
        ok: false,
        status: 409,
        code: "booking_not_pending",
        error: "La réservation a été annulée avant la confirmation du paiement.",
      };
    }
  }

  try {
    await sendMissingBookingEmails(databaseClient, bookingId, fallbackUserEmail);
  } catch (emailErr) {
    console.error("Failed to send booking emails:", emailErr);
    Sentry.captureException(emailErr);
  }

  return { ok: true, wasAlreadyPaid };
}

async function sendMissingBookingEmails(
  databaseClient: SupabaseClient<Database>,
  bookingId: string,
  fallbackUserEmail?: string | null
) {
  const { data } = await databaseClient
    .from("bookings")
    .select(
      `
        *,
        stage:stage_id (*, auto_ecole:auto_ecole_id (*)),
        user:user_id (name, email, phone)
      `
    )
    .eq("id", bookingId)
    .single();

  const fullBooking = data as unknown as BookingWithRelations | null;

  if (!fullBooking) {
    return;
  }

  const userData = fullBooking.user;
  const stageData = fullBooking.stage;
  const autoEcoleData = stageData?.auto_ecole;
  const userName = userData?.name || "Client";
  const userEmail = userData?.email || fallbackUserEmail || "";
  const userPhone = userData?.phone || null;
  const stageTitle = stageData?.title || "Stage";
  const autoEcoleName = autoEcoleData?.name || "";
  const autoEcoleCity = autoEcoleData?.city || "";
  const autoEcolePhone = autoEcoleData?.phone || "";
  const autoEcoleEmail = autoEcoleData?.email || "";
  const startDate = stageData?.start_date || "";
  const endDate = stageData?.end_date || "";
  const totalPrice = fullBooking.total_price ?? 0;
  const createdAt = fullBooking.created_at || new Date().toISOString();
  const now = new Date().toISOString();

  if (
    userEmail &&
    (await claimEmailSend(databaseClient, bookingId, "confirmation_email_sent_at", now))
  ) {
    const confirmation = buildConfirmationEmail(
      userName,
      stageTitle,
      autoEcoleName,
      startDate,
      endDate,
      totalPrice
    );
    const sent = await sendEmail({
      to: userEmail,
      subject: confirmation.subject,
      html: confirmation.html,
    });
    if (!sent) {
      await clearEmailClaim(databaseClient, bookingId, "confirmation_email_sent_at", now);
    }
  }

  if (
    userEmail &&
    (await claimEmailSend(databaseClient, bookingId, "receipt_email_sent_at", now))
  ) {
    const receipt = buildReceiptEmail(
      userName,
      fullBooking.id,
      stageTitle,
      autoEcoleName,
      autoEcoleCity,
      autoEcolePhone,
      autoEcoleEmail,
      startDate,
      endDate,
      totalPrice,
      createdAt
    );
    const sent = await sendEmail({ to: userEmail, subject: receipt.subject, html: receipt.html });
    if (!sent) {
      await clearEmailClaim(databaseClient, bookingId, "receipt_email_sent_at", now);
    }
  }

  if (
    autoEcoleEmail &&
    (await claimEmailSend(databaseClient, bookingId, "auto_ecole_notified_at", now))
  ) {
    const notification = buildAutoEcoleNotificationEmail(
      autoEcoleName,
      userName,
      userEmail,
      userPhone,
      stageTitle,
      startDate,
      endDate,
      totalPrice
    );
    const sent = await sendEmail({
      to: autoEcoleEmail,
      subject: notification.subject,
      html: notification.html,
    });
    if (!sent) {
      await clearEmailClaim(databaseClient, bookingId, "auto_ecole_notified_at", now);
    }
  }
}

async function claimEmailSend(
  databaseClient: SupabaseClient<Database>,
  bookingId: string,
  column: EmailTimestampColumn,
  timestamp: string
) {
  const update: BookingUpdate = { [column]: timestamp };
  const { data, error } = await databaseClient
    .from("bookings")
    .update(update)
    .eq("id", bookingId)
    .is(column, null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(`Could not claim ${column}:`, error);
    return false;
  }

  return Boolean(data);
}

async function clearEmailClaim(
  databaseClient: SupabaseClient<Database>,
  bookingId: string,
  column: EmailTimestampColumn,
  timestamp: string
) {
  const update: BookingUpdate = { [column]: null };
  const { error } = await databaseClient
    .from("bookings")
    .update(update)
    .eq("id", bookingId)
    .eq(column, timestamp);

  if (error) {
    console.error(`Could not clear ${column}:`, error);
  }
}
