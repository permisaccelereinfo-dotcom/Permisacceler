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
  Download,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function StudentReservations() {
  const router = useRouter();
  const supabase = createClient();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Role guard: auto-ecoles are not allowed in student space
      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
      if (userData?.role === "auto_ecole") {
        router.push("/dashboard");
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

  const downloadReceipt = (booking: any) => {
    const stage = booking.stage;
    const autoEcole = stage?.auto_ecole;
    // Escape user/partner-controlled values before injecting them into the
    // receipt HTML to avoid markup injection when the file is opened.
    const esc = (value: unknown) =>
      String(value ?? "").replace(
        /[&<>"']/g,
        (c) =>
          (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }) as Record<string, string>)[c]
      );
    const receiptHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Reçu - Réservation ${booking.id.slice(0, 8)}</title>
<style>
body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
.header { text-align: center; margin-bottom: 40px; }
.header h1 { color: #2563eb; margin-bottom: 8px; }
.header p { color: #666; }
.section { margin-bottom: 24px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; }
.section h2 { font-size: 16px; text-transform: uppercase; color: #6b7280; margin-bottom: 12px; letter-spacing: 0.05em; }
.row { display: flex; justify-content: space-between; margin-bottom: 8px; }
.row span:first-child { color: #6b7280; }
.row span:last-child { font-weight: 600; }
.total { background: #f3f4f6; padding: 16px 20px; border-radius: 12px; margin-top: 24px; }
.total .row { margin-bottom: 0; }
.total .row span:last-child { font-size: 20px; color: #2563eb; }
.footer { text-align: center; margin-top: 40px; color: #9ca3af; font-size: 12px; }
</style>
</head>
<body>
<div class="header">
<h1>PermisAccéléré</h1>
<p>Reçu de réservation</p>
</div>
<div class="section">
<h2>Détails de la réservation</h2>
<div class="row"><span>N° réservation</span><span>${booking.id}</span></div>
<div class="row"><span>Date de réservation</span><span>${new Date(booking.created_at).toLocaleDateString("fr-FR")}</span></div>
<div class="row"><span>Statut</span><span>${booking.status === "confirmed" ? "Confirmée" : booking.status === "completed" ? "Terminée" : booking.status}</span></div>
</div>
<div class="section">
<h2>Stage</h2>
<div class="row"><span>Titre</span><span>${esc(stage?.title || "N/A")}</span></div>
<div class="row"><span>Type de permis</span><span>Permis ${esc(stage?.license_type || "N/A")}</span></div>
<div class="row"><span>Période</span><span>Du ${new Date(stage?.start_date).toLocaleDateString("fr-FR")} au ${new Date(stage?.end_date).toLocaleDateString("fr-FR")}</span></div>
</div>
<div class="section">
<h2>Auto-école</h2>
<div class="row"><span>Nom</span><span>${esc(autoEcole?.name || "N/A")}</span></div>
<div class="row"><span>Ville</span><span>${esc(autoEcole?.city || "N/A")}</span></div>
<div class="row"><span>Téléphone</span><span>${esc(autoEcole?.phone || "N/A")}</span></div>
<div class="row"><span>Email</span><span>${esc(autoEcole?.email || "N/A")}</span></div>
</div>
<div class="total">
<div class="row"><span>Total payé</span><span>${booking.total_price?.toLocaleString("fr-FR") || "0"} €</span></div>
</div>
<div class="footer">
<p>PermisAccéléré - Cet reçu est généré automatiquement et fait foi de réservation.</p>
</div>
</body>
</html>`;

    const blob = new Blob([receiptHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recu-permisaccelere-${booking.id.slice(0, 8)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                    <div className="flex flex-col gap-2">
                    {(booking.status === "confirmed" || booking.status === "completed") && (
                      <button
                        onClick={() => downloadReceipt(booking)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Reçu
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
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
