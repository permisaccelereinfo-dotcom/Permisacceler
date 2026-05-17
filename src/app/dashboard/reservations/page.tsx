"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowLeft,
  Phone,
  Mail,
  Search,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BookingStatus } from "@/lib/supabase/database.types";

export default function ReservationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [autoEcole, setAutoEcole] = useState<any>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auto-ecole");
        return;
      }

      // Get auto-école
      const { data: ae } = await supabase
        .from("auto_ecoles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (ae) {
        setAutoEcole(ae);

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
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (!error) {
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.stage?.title?.toLowerCase().includes(searchTerm.toLowerCase());
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
                        Réservé le {new Date(booking.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {booking.user?.name || "Élève"}
                    </h3>
                    <p className="text-gray-600 mb-2">{booking.stage?.title}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        {booking.user?.email}
                      </span>
                      {booking.user?.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4" />
                          {booking.user.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {booking.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateBookingStatus(booking.id, "confirmed")}
                          className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Confirmer
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, "cancelled")}
                          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          Refuser
                        </button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      <button
                        onClick={() => updateBookingStatus(booking.id, "cancelled")}
                        className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors"
                      >
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
    </div>
  );
}
