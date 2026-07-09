"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ArrowRight, AlertCircle, Clock3 } from "lucide-react";
import Link from "next/link";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

type BookingStatusResponse = {
  booking?: {
    id: string;
    status: BookingStatus;
    payment_status: string | null;
  };
  error?: string;
};

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 12;

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<BookingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // Resolve the current booking status. We do NOT rely on the Stripe webhook
    // alone: when we have a Stripe session id we first hit the confirm endpoint,
    // which actively re-checks the session and confirms the booking. If that is
    // unavailable (e.g. Stripe not configured) we fall back to reading the
    // booking row, which the webhook updates.
    async function resolveStatus(): Promise<BookingStatus> {
      if (sessionId) {
        try {
          const res = await fetch("/api/checkout_sessions/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, bookingId }),
          });
          if (res.ok) {
            const payload = (await res.json()) as BookingStatusResponse;
            if (payload.booking?.status) return payload.booking.status;
          }
        } catch {
          // ignore and fall back to the read-only status endpoint
        }
      }

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const payload = (await response.json()) as BookingStatusResponse;
      if (!response.ok || !payload.booking) {
        throw new Error(payload.error || "La réservation est introuvable.");
      }
      return payload.booking.status;
    }

    async function pollBooking(attempt: number) {
      if (!bookingId) {
        setError("Impossible de vérifier le paiement : paramètres manquants.");
        setLoading(false);
        return;
      }

      try {
        const nextStatus = await resolveStatus();

        if (cancelled) return;

        setStatus(nextStatus);

        if (
          nextStatus === "confirmed" ||
          nextStatus === "completed" ||
          nextStatus === "cancelled" ||
          attempt >= MAX_POLL_ATTEMPTS
        ) {
          setLoading(false);
          return;
        }

        timeoutId = setTimeout(() => pollBooking(attempt + 1), POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "La vérification du paiement a échoué.");
        setLoading(false);
      }
    }

    pollBooking(1);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [bookingId, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col justify-center items-center gap-4 px-4 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3647AC]" />
        <p className="text-sm text-gray-600">
          Paiement reçu. Confirmation de la réservation en cours...
        </p>
      </div>
    );
  }

  const isConfirmed = status === "confirmed" || status === "completed";
  const isCancelled = status === "cancelled";
  const hasPendingConfirmation = !error && !isConfirmed && !isCancelled;

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
            error || isCancelled
              ? "bg-amber-100"
              : hasPendingConfirmation
                ? "bg-blue-100"
                : "bg-green-100"
          }`}
        >
          {error || isCancelled ? (
            <AlertCircle className="w-8 h-8 text-amber-600" />
          ) : hasPendingConfirmation ? (
            <Clock3 className="w-8 h-8 text-blue-600" />
          ) : (
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          )}
        </div>
        <h1
          className="text-2xl font-semibold text-gray-900 mb-3"
          style={{ fontFamily: "var(--ds-nb---font--primary)" }}
        >
          {error || isCancelled
            ? "Paiement à vérifier"
            : hasPendingConfirmation
              ? "Confirmation en cours"
              : "Paiement réussi !"}
        </h1>
        <p className="text-gray-600 mb-8">
          {error
            ? error
            : isCancelled
              ? "La session de réservation a expiré ou a été annulée. Aucun stage n'a été confirmé."
              : hasPendingConfirmation
                ? "Stripe a reçu le paiement. La réservation sera confirmée automatiquement dès réception du webhook."
                : "Votre inscription au stage de conduite a été confirmée. Vous recevrez un e-mail avec tous les détails de votre réservation."}
        </p>

        <div className="space-y-3">
          <Link
            href="/mon-compte/reservations"
            className="w-full flex items-center justify-center gap-2 bg-[#3647AC] text-white py-3.5 rounded-full font-medium text-[15px] hover:bg-[#2A3786] transition-colors"
          >
            Voir ma réservation
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="w-full flex items-center justify-center py-3.5 rounded-full font-medium text-[15px] text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafbfc] flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#3647AC]" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
