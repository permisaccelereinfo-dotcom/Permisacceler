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
  FileText,
  Car,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewStagePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [autoEcole, setAutoEcole] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    license_type: "B",
    start_date: "",
    end_date: "",
    price: "",
    max_students: "6",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auto-ecole");
        return;
      }
      setUser(user);

      // Get auto-école info
      const { data: autoEcoleData } = await supabase
        .from("auto_ecoles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (autoEcoleData) {
        setAutoEcole(autoEcoleData);
      }
      setLoading(false);
    };

    checkAuth();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!autoEcole) {
        throw new Error("Vous devez être connecté en tant qu'auto-école");
      }

      const { error: insertError } = await supabase.from("stages").insert({
        auto_ecole_id: autoEcole.id,
        title: formData.title,
        description: formData.description,
        license_type: formData.license_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        price: parseInt(formData.price),
        max_students: parseInt(formData.max_students),
        enrolled_students: 0,
        status: "active",
        is_available: true,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/stages");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création");
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
              <h1 className="text-2xl font-bold text-gray-900">Nouveau stage</h1>
              <p className="text-gray-600">Créez un nouveau stage de conduite</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Stage créé avec succès ! Redirection...
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
                placeholder="Stage intensif permis B - Juillet 2026"
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
                placeholder="Détails du stage, horaires, inclut leçons de conduite..."
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
                    min="1"
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
                  placeholder="890"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
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
                    Créer le stage
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
