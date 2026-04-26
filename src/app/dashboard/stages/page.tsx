"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Calendar,
  Users,
  Euro,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Car,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function StagesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [autoEcole, setAutoEcole] = useState<any>(null);

  useEffect(() => {
    const fetchStages = async () => {
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

        // Get stages
        const { data: stagesData } = await supabase
          .from("stages")
          .select("*")
          .eq("auto_ecole_id", ae.id)
          .order("created_at", { ascending: false });

        setStages(stagesData || []);
      }

      setLoading(false);
    };

    fetchStages();
  }, [router, supabase]);

  const filteredStages = stages.filter((stage) =>
    stage.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stage.license_type.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun stage</h3>
            <p className="text-gray-600 mb-6">Commencez par créer votre premier stage</p>
            <Link
              href="/dashboard/stages/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Créer un stage
            </Link>
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
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{stage.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Du {new Date(stage.start_date).toLocaleDateString("fr-FR")} au{" "}
                        {new Date(stage.end_date).toLocaleDateString("fr-FR")}
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
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
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
