import { BookingStatus } from "@/lib/supabase/database.types";

export function isPaidBookingStatus(status: BookingStatus | string | null | undefined) {
  return status === "confirmed" || status === "completed";
}

export function canStartCheckoutForStatus(status: BookingStatus | string | null | undefined) {
  return !isPaidBookingStatus(status);
}
