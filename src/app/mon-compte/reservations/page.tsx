"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  Loader2,
  Car,
  CheckCircle2,
  XCircle,
  Clock3,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BookingStatus } from "@/lib/supabase/database.types";

export default function StudentReservations() {
  const router = useRouter();
  const supabase = createClient();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(`
          *,
          stage:stage_id (
            *,
            auto_ecole:auto_ecole_id (name, city, phone, email)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setBookings(bookingsData || []);
      setLoading(false);
    };

    fetchBookings();
  }, [router, supabase]);

  const cancelBooking = async (bookingId: string) => {
    const cancelledStatus: BookingStatus = "cancelled";
    setCancellingId(bookingId);
    const { error } = await supabase
      .from("bookings")
      .update({ status: cancelledStatus })
      .eq("id", bookingId);

    if (!error) {
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: "cancelled" } : b
      ));
    }
    setCancellingId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Confirmé
          </span>
        );
      case "pending":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-bold rounded-lg flex items-center gap-1">
            <Clock3 className="w-4 h-4" />
            En attente
          </span>
        );
      case "completed":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Terminé
          </span>
        );
      case "cancelled":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-lg flex items-center gap-1">
            <XCircle className="w-4 h-4" />
            Annulé
          </span>
        );
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg">{status}</span>;
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
      <div className="max-w-4xl mx-auto">
        <Link
          href="/mon-compte"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes réservations</h1>
            <p className="text-gray-600">{bookings.length} réservation{bookings.length > 1 ? "s" : ""}</p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune réservation</h3>
            <p className="text-gray-600 mb-6">Vous n&apos;avez pas encore réservé de stage</p>
            <Link
              href="/recherche"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Car className="w-5 h-5" />
              Trouver un stage
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusBadge(booking.status)}
                      <span className="text-sm text-gray-500">
                        Réservé le {new Date(booking.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">{booking.stage?.title}</h3>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1.5">
                        <Car className="w-4 h-4" />
                        Permis {booking.stage?.license_type}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {booking.stage?.auto_ecole?.name} - {booking.stage?.auto_ecole?.city}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Du {new Date(booking.stage?.start_date).toLocaleDateString("fr-FR")} au{" "}
                        {new Date(booking.stage?.end_date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    {/* Contact auto-école */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Contact auto-école</p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{booking.stage?.auto_ecole?.phone}</p>
                        <p>{booking.stage?.auto_ecole?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:text-right">
                    <p className="text-2xl font-black text-blue-600">{booking.total_price}€</p>
                    <p className="text-sm text-gray-500 mb-4">TTC</p>

                    {/* Actions */}
                    {(booking.status === "confirmed" || booking.status === "pending") && (
                      <button
                        onClick={() => cancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Annuler"
                        )}
                      </button>
                    )}

                    {booking.status === "completed" && !booking.reviewed && (
                      <Link
                        href={`/mon-compte/avis/${booking.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 font-semibold rounded-lg hover:bg-yellow-200 transition-colors"
                      >
                        <Star className="w-4 h-4" />
                        Laisser un avis
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
