"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Save,
  User,
  Mail,
  Phone,
  CheckCircle2,
  LogOut,
  Car,
  FileCheck,
  HelpCircle,
  IdCard,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PermitReason = "annulation" | "pas-de-date" | "manque-temps" | "echec";

const permitReasons: PermitReason[] = ["annulation", "pas-de-date", "manque-temps", "echec"];

function isPermitReason(value: string | null): value is PermitReason {
  return permitReasons.includes(value as PermitReason);
}

export default function StudentProfile() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [nephError, setNepHError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date_naissance: "",
    ville_naissance: "",
    adresse: "",
    complement_adresse: "",
    code_postal: "",
    reason: "" as "annulation" | "pas-de-date" | "manque-temps" | "echec" | "",
    has_permit: false,
    transmission_preference: "" as "auto" | "manuelle" | "",
    has_code: false,
    neph_number: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/login");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userData) {
        setUser(userData);
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          date_naissance: userData.date_naissance || "",
          ville_naissance: userData.ville_naissance || "",
          adresse: userData.adresse || "",
          complement_adresse: userData.complement_adresse || "",
          code_postal: userData.code_postal || "",
          reason: isPermitReason(userData.reason) ? userData.reason : "",
          has_permit: userData.has_permit || false,
          transmission_preference: userData.transmission_preference || "",
          has_code: userData.has_code || false,
          neph_number: userData.neph_number || "",
        });
      }

      setLoading(false);
    };

    fetchProfile();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      if (!user) return;

      const { error } = await supabase
        .from("users")
        .update({
          name: formData.name,
          phone: formData.phone,
          date_naissance: formData.date_naissance || null,
          ville_naissance: formData.ville_naissance || null,
          adresse: formData.adresse || null,
          complement_adresse: formData.complement_adresse || null,
          code_postal: formData.code_postal || null,
          reason: formData.reason,
          has_permit: formData.has_permit,
          transmission_preference: formData.transmission_preference || null,
          has_code: formData.has_code,
          neph_number: formData.neph_number || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
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
      <div className="max-w-2xl mx-auto">
        <Link
          href="/mon-compte"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
              <p className="text-gray-600">Modifier mes informations personnelles</p>
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Modifications enregistrées !
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom complet</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">L&apos;email ne peut pas être modifié</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Address & Birth Section */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Adresse &amp; naissance</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date de naissance</label>
                  <input
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse</label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    placeholder="12 rue de la Paix"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Code postal - Ville</label>
                  <input
                    type="text"
                    value={formData.code_postal}
                    onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
                    placeholder="75001 Paris"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quiz Data Section */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                Informations permis
              </h3>

              {/* Reason */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Raison de permis accéléré</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: "annulation", label: "Annulation / Suspension / Invalidation" },
                    { value: "pas-de-date", label: "Je ne trouve pas de date d'examen" },
                    { value: "manque-temps", label: "Manque de temps" },
                    { value: "echec", label: "Représentation suite à un échec" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, reason: option.value as typeof formData.reason })}
                      className={`py-3 px-4 rounded-xl border-2 font-medium transition-colors text-left ${
                        formData.reason === option.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Has Permit */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">As-tu déjà passé le permis ?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, has_permit: true })}
                    className={`py-3 rounded-xl border-2 font-semibold transition-colors ${
                      formData.has_permit
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    ✅ Oui
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, has_permit: false })}
                    className={`py-3 rounded-xl border-2 font-semibold transition-colors ${
                      !formData.has_permit
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    ❌ Non
                  </button>
                </div>
              </div>

              {/* Transmission */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  Préférence de boîte
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, transmission_preference: "auto" })}
                    className={`py-3 rounded-xl border-2 font-semibold transition-colors ${
                      formData.transmission_preference === "auto"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    🚗 Automatique
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, transmission_preference: "manuelle" })}
                    className={`py-3 rounded-xl border-2 font-semibold transition-colors ${
                      formData.transmission_preference === "manuelle"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    ⚙️ Manuelle
                  </button>
                </div>
              </div>

              {/* Has Code */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4" />
                  As-tu obtenu ton code ?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, has_code: true })}
                    className={`py-3 rounded-xl border-2 font-semibold transition-colors ${
                      formData.has_code
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    ✅ Oui
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, has_code: false })}
                    className={`py-3 rounded-xl border-2 font-semibold transition-colors ${
                      !formData.has_code
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    ❌ Non
                  </button>
                </div>
              </div>

              {/* NEPH Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <IdCard className="w-4 h-4" />
                  Numéro NEPH
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={12}
                  value={formData.neph_number}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ""); // Only digits
                    setFormData({ ...formData, neph_number: value });
                    if (value.length === 12 || value === "") {
                      setNepHError(null);
                    } else {
                      setNepHError("Le NEPH doit contenir exactement 12 chiffres");
                    }
                  }}
                  placeholder="12 chiffres exactement"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none tracking-wider transition-colors ${
                    nephError
                      ? "border-red-300 focus:border-red-500"
                      : formData.neph_number.length === 12
                      ? "border-green-500 focus:border-green-500"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                />
                {nephError && (
                  <p className="text-sm text-red-500 mt-2 font-medium">
                    ⚠️ {nephError} ({formData.neph_number.length}/12)
                  </p>
                )}
                {formData.neph_number.length === 12 && (
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    ✅ Numéro NEPH valide
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">12 chiffres requis - Optionnel</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Link
                href="/mon-compte"
                className="flex-1 py-4 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-gray-300 transition-colors text-center"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={saving || (formData.neph_number !== "" && formData.neph_number.length !== 12)}
                className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Enregistrer
              </button>
            </div>
          </form>

          {/* Logout */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full py-4 border-2 border-red-200 text-red-700 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Se déconnecter
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
