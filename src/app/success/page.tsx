"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function confirmBooking() {
      if (!sessionId || !bookingId) {
        setError("Impossible de vérifier le paiement: paramètres manquants.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/checkout_sessions/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, bookingId }),
        });
        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "La confirmation du paiement a échoué.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "La confirmation du paiement a échoué.");
      } finally {
        setLoading(false);
      }
    }

    confirmBooking();
  }, [bookingId, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3647AC]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${error ? "bg-amber-100" : "bg-green-100"}`}>
          {error ? (
            <AlertCircle className="w-8 h-8 text-amber-600" />
          ) : (
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          )}
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-3" style={{ fontFamily: "var(--ds-nb---font--primary)" }}>
          {error ? "Paiement à vérifier" : "Paiement réussi !"}
        </h1>
        <p className="text-gray-600 mb-8">
          {error
            ? error
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
