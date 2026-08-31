"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowLeft,
  Phone,
  Mail,
  Search,
  Filter,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BookingStatus, Database } from "@/lib/supabase/database.types";
import { formatDateFr } from "@/lib/utils";

export default function ReservationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auto-ecole");
        return;
      }

      // Role guard: only auto-ecoles allowed
      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
      if (userData?.role !== "auto_ecole") {
        router.push("/mon-compte");
        return;
      }

      // Get auto-école
      const { data: ae } = await supabase
        .from("auto_ecoles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (ae) {
        const { data: stageRows } = await supabase
          .from("stages")
          .select("id")
          .eq("auto_ecole_id", ae.id);

        const stageIds = stageRows?.map((stage) => stage.id) ?? [];

        if (stageIds.length === 0) {
          setBookings([]);
          setLoading(false);
          return;
        }

        // Get bookings through the stage relation. bookings does not own auto_ecole_id.
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select(`
            *,
            stage:stage_id (*),
            user:user_id (*)
          `)
          .in("stage_id", stageIds)
          .order("created_at", { ascending: false });

        setBookings(bookingsData || []);
      }

      setLoading(false);
    };

    fetchBookings();
  }, [router, supabase]);

  const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    setUpdatingId(bookingId);
    setError(null);

    const patch: Database["public"]["Tables"]["bookings"]["Update"] = { status: newStatus };

    // .select() so an update silently refused by RLS (no error, no row) is
    // reported instead of leaving the row visually unchanged.
    const { data: updated, error: updateError } = await supabase
      .from("bookings")
      .update(patch)
      .eq("id", bookingId)
      .select("id")
      .maybeSingle();

    if (updateError || !updated) {
      setError(
        updateError?.message ||
          "Mise à jour refusée. Rechargez la page puis réessayez."
      );
    } else {
      setBookings((current) =>
        current.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    }

    setUpdatingId(null);
  };

  // Cancellation goes through the server route: it refunds a paid booking via
  // Stripe and emails the student, which a direct table update cannot do.
  const cancelBooking = async (booking: any) => {
    setUpdatingId(booking.id);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: "POST" });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError(payload?.error || "L'annulation a échoué. Réessayez.");
      } else {
        setBookings((current) =>
          current.map((b) =>
            b.id === booking.id
              ? {
                  ...b,
                  status: "cancelled",
                  ...(payload?.refunded ? { payment_status: "refunded" } : {}),
                }
              : b
          )
        );
        setPendingCancel(null);
      }
    } catch {
      setError("L'annulation a échoué. Vérifiez votre connexion puis réessayez.");
    }

    setUpdatingId(null);
  };

  const term = searchTerm.trim().toLowerCase();
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      term === "" ||
      (booking.user?.name ?? "").toLowerCase().includes(term) ||
      (booking.user?.email ?? "").toLowerCase().includes(term) ||
      (booking.stage?.title ?? "").toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Confirmée
          </span>
        );
      case "pending":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-bold rounded-lg flex items-center gap-1">
            <Clock className="w-4 h-4" />
            En attente
          </span>
        );
      case "cancelled":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-lg flex items-center gap-1">
            <XCircle className="w-4 h-4" />
            Annulée
          </span>
        );
      case "completed":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Terminée
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
              <p className="text-gray-600">{bookings.length} réservation{bookings.length > 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un élève ou un stage..."
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmées</option>
              <option value="completed">Terminées</option>
              <option value="cancelled">Annulées</option>
            </select>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune réservation</h3>
            <p className="text-gray-600">Les réservations apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(booking.status)}
                      <span className="text-sm text-gray-500">
                        Réservé le {formatDateFr(booking.created_at)}
                      </span>
                      {booking.status === "confirmed" && booking.created_at &&
                        (new Date().getTime() - new Date(booking.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-md">
                          Nouvelle
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {booking.user?.name || "Élève"}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {booking.stage?.title || "Stage indisponible"}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {booking.user?.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4" />
                          {booking.user.email}
                        </span>
                      )}
                      {booking.user?.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4" />
                          {booking.user.phone}
                        </span>
                      )}
                      {booking.stage?.start_date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          Du {formatDateFr(booking.stage.start_date)} au{" "}
                          {formatDateFr(booking.stage.end_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {booking.status === "confirmed" && (
                      <button
                        onClick={() => updateBookingStatus(booking.id, "completed")}
                        disabled={updatingId === booking.id}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {updatingId === booking.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Terminer
                      </button>
                    )}

                    {(booking.status === "confirmed" || booking.status === "pending") && (
                      <button
                        onClick={() => {
                          setError(null);
                          setPendingCancel(booking);
                        }}
                        disabled={updatingId === booking.id}
                        className="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel confirmation */}
      {pendingCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-lg font-bold text-gray-900">Annuler cette réservation ?</h2>
              <button
                type="button"
                onClick={() => setPendingCancel(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-2">
              <span className="font-semibold">{pendingCancel.user?.name || "Élève"}</span>
              {" — "}
              {pendingCancel.stage?.title || "Stage indisponible"}
            </p>

            <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-sm mb-6">
              {pendingCancel.payment_status === "fully_paid"
                ? `L'élève a payé ${pendingCancel.total_price ?? 0}€ : l'annulation déclenche le remboursement de ce montant et l'élève sera prévenu par email.`
                : "L'élève sera prévenu par email et sa place sera libérée."}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingCancel(null)}
                disabled={updatingId === pendingCancel.id}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => cancelBooking(pendingCancel)}
                disabled={updatingId === pendingCancel.id}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updatingId === pendingCancel.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                Annuler la réservation
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
