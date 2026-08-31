"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Save,
  Calendar,
  Euro,
  Users,
  Car,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditStagePage() {
  const params = useParams();
  const stageId = params?.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [enrolled, setEnrolled] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    license_type: "B",
    start_date: "",
    end_date: "",
    price: "",
    max_students: "6",
    status: "active" as "active" | "cancelled" | "completed",
    is_available: true,
  });

  useEffect(() => {
    const fetchStage = async () => {
      if (!stageId) return;

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

      const { data: ae } = await supabase
        .from("auto_ecoles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!ae) {
        setError("Votre profil auto-école est introuvable. Veuillez contacter le support.");
        setLoading(false);
        return;
      }

      // Scoping on auto_ecole_id as well as id means another school's stage
      // reads as "not found" rather than rendering an unsaveable form.
      const { data: stage } = await supabase
        .from("stages")
        .select("*")
        .eq("id", stageId)
        .eq("auto_ecole_id", ae.id)
        .maybeSingle();

      if (!stage) {
        setError("Stage introuvable.");
        setLoading(false);
        return;
      }

      setEnrolled(stage.enrolled_students ?? 0);
      setFormData({
        title: stage.title ?? "",
        description: stage.description ?? "",
        license_type: stage.license_type ?? "B",
        start_date: stage.start_date ?? "",
        end_date: stage.end_date ?? "",
        price: String(stage.price ?? ""),
        max_students: String(stage.max_students ?? 6),
        status: stage.status ?? "active",
        is_available: stage.is_available ?? true,
      });

      setLoading(false);
    };

    fetchStage();
  }, [stageId, router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const price = Number(formData.price);
      const maxStudents = Number(formData.max_students);

      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Le prix doit être un nombre positif.");
      }
      if (!Number.isInteger(maxStudents) || maxStudents < 1) {
        throw new Error("Le nombre maximum d'élèves doit être d'au moins 1.");
      }
      if (maxStudents < enrolled) {
        throw new Error(
          `Ce stage compte déjà ${enrolled} inscrit${enrolled > 1 ? "s" : ""} : la capacité ne peut pas être inférieure.`
        );
      }
      if (!formData.start_date || !formData.end_date) {
        throw new Error("Veuillez renseigner les dates de début et de fin.");
      }
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        throw new Error("La date de fin doit être postérieure ou égale à la date de début.");
      }

      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const durationDays =
        Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const { data: updated, error: updateError } = await supabase
        .from("stages")
        .update({
          title: formData.title,
          description: formData.description || null,
          license_type: formData.license_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          duration_days: durationDays,
          price,
          max_students: maxStudents,
          status: formData.status,
          is_available: formData.status === "active" ? formData.is_available : false,
        })
        .eq("id", stageId)
        .select("id")
        .maybeSingle();

      if (updateError) throw updateError;

      // An UPDATE refused by RLS returns no error and no row.
      if (!updated) {
        throw new Error("Modification refusée. Vérifiez que ce stage vous appartient.");
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/stages"), 1200);
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
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
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard/stages"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux stages
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Modifier le stage</h1>
              <p className="text-gray-600">
                {enrolled} élève{enrolled > 1 ? "s" : ""} inscrit{enrolled > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Stage mis à jour ! Redirection...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Titre du stage
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de permis
                </label>
                <select
                  value={formData.license_type}
                  onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                >
                  <option value="B">Permis B (Voiture)</option>
                  <option value="A1">Permis A1 (125cc)</option>
                  <option value="A2">Permis A2 (Moto)</option>
                  <option value="A">Permis A (Gros cube)</option>
                  <option value="C">Permis C (Poids lourd)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre max d&apos;élèves
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    min={Math.max(enrolled, 1)}
                    max="20"
                    value={formData.max_students}
                    onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date de début
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date de fin
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prix (€)
              </label>
              <div className="relative">
                <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as typeof formData.status })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                >
                  <option value="active">Actif</option>
                  <option value="cancelled">Annulé</option>
                  <option value="completed">Terminé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Visibilité</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_available: !formData.is_available })}
                  disabled={formData.status !== "active"}
                  className={`w-full py-3 rounded-xl border-2 font-semibold transition-colors disabled:opacity-50 ${
                    formData.status === "active" && formData.is_available
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {formData.status === "active" && formData.is_available
                    ? "Visible dans la recherche"
                    : "Masqué"}
                </button>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Link
                href="/dashboard/stages"
                className="flex-1 py-4 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-gray-300 transition-colors text-center"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={saving || success}
                className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
