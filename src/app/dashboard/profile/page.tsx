"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Save,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  CheckCircle2,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [autoEcole, setAutoEcole] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    postal_code: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    rating: 0,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auto-ecole");
        return;
      }

      const { data: ae } = await supabase
        .from("auto_ecoles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (ae) {
        setAutoEcole(ae);
        setFormData({
          name: ae.name || "",
          address: ae.address || "",
          city: ae.city || "",
          postal_code: ae.postal_code || "",
          phone: ae.phone || "",
          email: ae.email || "",
          website: ae.website || "",
          description: ae.description || "",
          rating: ae.rating || 0,
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
      if (!autoEcole) return;

      const { error } = await supabase
        .from("auto_ecoles")
        .update({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          description: formData.description,
        })
        .eq("id", autoEcole.id);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
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
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Modifier mon profil</h1>
              <p className="text-gray-600">Mettez à jour les informations de votre auto-école</p>
            </div>
            {formData.rating > 0 && (
              <div className="ml-auto flex items-center gap-1 px-4 py-2 bg-yellow-100 rounded-full">
                <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                <span className="font-bold text-yellow-700">{formData.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Modifications enregistrées avec succès !
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de l&apos;auto-école *</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ville</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Code postal</label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Site web</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.monautoecole.fr"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Décrivez votre auto-école, vos spécialités..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Link
                href="/dashboard"
                className="flex-1 py-4 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-gray-300 transition-colors text-center"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Enregistrer
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
