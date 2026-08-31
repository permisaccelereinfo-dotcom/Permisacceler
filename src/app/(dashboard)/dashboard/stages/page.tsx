"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Calendar,
  Users,
  Euro,
  Edit,
  Trash2,
  Loader2,
  Car,
  ArrowLeft,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDateFr } from "@/lib/utils";

export default function StagesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [stages, setStages] = useState<any[]>([]);
  const [bookingCounts, setBookingCounts] = useState<
    Record<string, { active: number; total: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStages = async () => {
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
        // Get stages
        const { data: stagesData } = await supabase
          .from("stages")
          .select("*")
          .eq("auto_ecole_id", ae.id)
          .order("created_at", { ascending: false });

        setStages(stagesData || []);

        // Deleting a stage cascades onto its bookings (bookings.stage_id is
        // ON DELETE CASCADE), so the list needs to know which stages still
        // have live bookings before offering a delete.
        const stageIds = stagesData?.map((s) => s.id) ?? [];
        if (stageIds.length) {
          const { data: bookingRows } = await supabase
            .from("bookings")
            .select("stage_id, status")
            .in("stage_id", stageIds);

          // Track cancelled bookings too: deleting a stage also erases that
          // history, which deserves a warning even when nothing is active.
          const counts: Record<string, { active: number; total: number }> = {};
          for (const row of bookingRows ?? []) {
            const entry = (counts[row.stage_id] ??= { active: 0, total: 0 });
            entry.total += 1;
            if (row.status !== "cancelled") entry.active += 1;
          }
          setBookingCounts(counts);
        }
      }

      setLoading(false);
    };

    fetchStages();
  }, [router, supabase]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError(null);

    const { error: deleteError } = await supabase
      .from("stages")
      .delete()
      .eq("id", pendingDelete.id);

    if (deleteError) {
      setError(deleteError.message || "Suppression impossible.");
      setDeleting(false);
      return;
    }

    setStages((current) => current.filter((s) => s.id !== pendingDelete.id));
    setPendingDelete(null);
    setDeleting(false);
  };

  const term = searchTerm.trim().toLowerCase();
  const filteredStages = stages.filter((stage) =>
    term === "" ||
    (stage.title ?? "").toLowerCase().includes(term) ||
    (stage.license_type ?? "").toLowerCase().includes(term)
  );

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
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes stages</h1>
              <p className="text-gray-600">{stages.length} stage{stages.length > 1 ? "s" : ""} en ligne</p>
            </div>
          </div>
          <Link
            href="/dashboard/stages/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau stage
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un stage..."
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Stages List */}
        {filteredStages.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {stages.length === 0 ? "Aucun stage" : "Aucun résultat"}
            </h3>
            <p className="text-gray-600 mb-6">
              {stages.length === 0
                ? "Commencez par créer votre premier stage"
                : "Aucun stage ne correspond à votre recherche"}
            </p>
            {stages.length === 0 && (
              <Link
                href="/dashboard/stages/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Créer un stage
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredStages.map((stage) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg">
                        Permis {stage.license_type}
                      </span>
                      <span className={`px-3 py-1 text-sm font-bold rounded-lg ${
                        stage.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {stage.status === "active" ? "Actif" : "Inactif"}
                      </span>
                      {stage.status === "active" && !stage.is_available && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-bold rounded-lg">
                          Complet
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{stage.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Du {formatDateFr(stage.start_date)} au {formatDateFr(stage.end_date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Euro className="w-4 h-4" />
                        {stage.price}€
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {stage.enrolled_students}/{stage.max_students} élèves
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/stages/${stage.id}/edit`}
                      title="Modifier"
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5 text-gray-600" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setPendingDelete(stage);
                      }}
                      title="Supprimer"
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-lg font-bold text-gray-900">Supprimer ce stage ?</h2>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-2">
              <span className="font-semibold">{pendingDelete.title}</span>
            </p>

            {(bookingCounts[pendingDelete.id]?.active ?? 0) > 0 ? (
              <>
                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm mb-6">
                  Ce stage compte {bookingCounts[pendingDelete.id].active} réservation
                  {bookingCounts[pendingDelete.id].active > 1 ? "s" : ""} active
                  {bookingCounts[pendingDelete.id].active > 1 ? "s" : ""}. Le supprimer effacerait aussi
                  ces réservations et leur historique de paiement. Annulez d&apos;abord les
                  réservations, ou passez le stage en « Annulé » depuis la page de modification.
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPendingDelete(null)}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-gray-300 transition-colors"
                  >
                    Fermer
                  </button>
                  <Link
                    href={`/dashboard/stages/${pendingDelete.id}/edit`}
                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-center"
                  >
                    Modifier le stage
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-6">
                  Cette action est définitive. Le stage ne sera plus visible dans la recherche.
                  {(bookingCounts[pendingDelete.id]?.total ?? 0) > 0 && (
                    <>
                      {" "}
                      L&apos;historique de {bookingCounts[pendingDelete.id].total} réservation
                      {bookingCounts[pendingDelete.id].total > 1 ? "s" : ""} annulée
                      {bookingCounts[pendingDelete.id].total > 1 ? "s" : ""} sera également
                      supprimé.
                    </>
                  )}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPendingDelete(null)}
                    disabled={deleting}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-gray-300 transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
