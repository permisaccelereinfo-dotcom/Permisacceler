"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import type { BookingStatus, UserRole } from "@/lib/supabase/database.types";

type StageStatus = "active" | "cancelled" | "completed";

const bookingStatuses: BookingStatus[] = ["pending", "confirmed", "cancelled", "completed"];
const stageStatuses: StageStatus[] = ["active", "cancelled", "completed"];
const userRoles: UserRole[] = ["student", "auto_ecole", "admin"];

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing form value: ${key}`);
  }
  return value;
}

function readBoolean(formData: FormData, key: string) {
  return readString(formData, key) === "true";
}

function revalidateAdmin() {
  revalidatePath("/admin");
}

export async function updateAutoEcoleVerification(formData: FormData) {
  const { supabase } = await requireAdmin();
  const autoEcoleId = readString(formData, "autoEcoleId");
  const isVerified = readBoolean(formData, "isVerified");

  const { error } = await supabase
    .from("auto_ecoles")
    .update({ is_verified: isVerified })
    .eq("id", autoEcoleId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAdmin();
}

export async function updateAutoEcoleCommission(formData: FormData) {
  const { supabase } = await requireAdmin();
  const autoEcoleId = readString(formData, "autoEcoleId");
  const commissionRate = Number(readString(formData, "commissionRate"));

  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
    throw new Error("Commission rate must be between 0 and 100.");
  }

  const { error } = await supabase
    .from("auto_ecoles")
    .update({ commission_rate: commissionRate })
    .eq("id", autoEcoleId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAdmin();
}

export async function updateStageStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const stageId = readString(formData, "stageId");
  const status = readString(formData, "status") as StageStatus;

  if (!stageStatuses.includes(status)) {
    throw new Error("Invalid stage status.");
  }

  const { error } = await supabase.from("stages").update({ status }).eq("id", stageId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAdmin();
}

export async function updateStageAvailability(formData: FormData) {
  const { supabase } = await requireAdmin();
  const stageId = readString(formData, "stageId");
  const isAvailable = readBoolean(formData, "isAvailable");

  const { error } = await supabase
    .from("stages")
    .update({ is_available: isAvailable })
    .eq("id", stageId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAdmin();
}

export async function updateBookingStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const bookingId = readString(formData, "bookingId");
  const status = readString(formData, "status") as BookingStatus;

  if (!bookingStatuses.includes(status)) {
    throw new Error("Invalid booking status.");
  }

  const cancellationNote = "Statut mis a jour depuis l'administration.";
  const update =
    status === "cancelled"
      ? {
          status,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancellationNote,
        }
      : {
          status,
          cancelled_at: null,
          cancellation_reason: null,
        };

  const { error } = await supabase.from("bookings").update(update).eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAdmin();
}

export async function updateAlertActive(formData: FormData) {
  const { supabase } = await requireAdmin();
  const alertId = readString(formData, "alertId");
  const isActive = readBoolean(formData, "isActive");

  const { error } = await supabase.from("alerts").update({ is_active: isActive }).eq("id", alertId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAdmin();
}

export async function updateUserRole(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const userId = readString(formData, "userId");
  const role = readString(formData, "role") as UserRole;

  if (!userRoles.includes(role)) {
    throw new Error("Invalid user role.");
  }

  if (userId === user.id && role !== "admin") {
    throw new Error("You cannot remove your own admin access.");
  }

  const { error } = await supabase.from("users").update({ role }).eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAdmin();
}
