"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Calendar,
  Car,
  Euro,
  Users,
  Star,
  ArrowRight,
  Loader2,
  Filter,
  X,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  Building2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { useSearchParams } from "next/navigation";

// City images mapping
const cityImages: Record<string, string> = {
  "Paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop",
  "Marseille": "https://images.unsplash.com/photo-1565881606991-789a9d8d6e4c?w=400&h=300&fit=crop",
  "Lyon": "https://images.unsplash.com/photo-1568565681761-576e5a463e96?w=400&h=300&fit=crop",
  "Toulouse": "https://images.unsplash.com/photo-1599739367257-7875166b7195?w=400&h=300&fit=crop",
  "Nice": "https://images.unsplash.com/photo-1533986892364-4f43219a878f?w=400&h=300&fit=crop",
  "Nantes": "https://images.unsplash.com/photo-1566834948647-18e9584b6c8d?w=400&h=300&fit=crop",
  "Strasbourg": "https://images.unsplash.com/photo-1478827536114-da7b3a4d4b21?w=400&h=300&fit=crop",
  "Montpellier": "https://images.unsplash.com/photo-1565626424178-c0e0f53c4f2e?w=400&h=300&fit=crop",
  "Bordeaux": "https://images.unsplash.com/photo-1573662996479-981c8728cea5?w=400&h=300&fit=crop",
  "Lille": "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=400&h=300&fit=crop",
};

const getCityImage = (city: string): string => {
  // Return city image if exists, otherwise return a generic city image
  return cityImages[city] || "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop";
};

type StageResult = {
  stage_id: string;
  stage_title: string;
  stage_description: string | null;
  license_type: string;
  start_date: string;
  end_date: string;
  price: number;
  max_students: number;
  enrolled_students: number;
  available_spots: number;
  auto_ecole_id: string;
  auto_ecole_name: string;
  auto_ecole_city: string;
  auto_ecole_rating: number;
};

const licenseTypes = [
  { value: "B", label: "Permis B (Voiture)", icon: "🚗" },
  { value: "A1", label: "Permis A1 (125cc)", icon: "🏍️" },
  { value: "A2", label: "Permis A2 (Moto)", icon: "🏍️" },
  { value: "A", label: "Permis A (Gros cube)", icon: "🏍️" },
  { value: "C", label: "Permis C (Poids lourd)", icon: "🚛" },
];

const priceRanges = [
  { min: 0, max: 500, label: "Moins de 500€" },
  { min: 500, max: 800, label: "500€ - 800€" },
  { min: 800, max: 1200, label: "800€ - 1200€" },
  { min: 1200, max: 999999, label: "Plus de 1200€" },
];

function SearchContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [stages, setStages] = useState<StageResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states - initialize from URL params
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [transmission, setTransmission] = useState("manuelle");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  // Read URL params on mount
  useEffect(() => {
    const urlCity = searchParams.get("city");
    const urlMonth = searchParams.get("month");
    const urlTransmission = searchParams.get("transmission");
    
    if (urlCity) setCity(urlCity);
    if (urlTransmission) {
      setTransmission(urlTransmission.toLowerCase().includes("auto") ? "automatique" : "manuelle");
    }
    // Month would need parsing from string like "Avril 2026" to YYYY-MM
  }, [searchParams]);

  const searchStages = useCallback(async () => {
    setLoading(true);

    try {
      // Calculate month date range if selected
      let monthStart: string | null = null;
      let monthEnd: string | null = null;
      
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        monthStart = `${year}-${month}-01`;
        // Calculate last day of month
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        monthEnd = `${year}-${month}-${lastDay}`;
      }

      // Using the RPC function we created in the SQL setup
      const { data, error } = await supabase.rpc("search_stages", {
        search_city: city || null,
        search_license_type: null, // We filter by transmission separately
        search_start_date: monthStart,
        search_end_date: monthEnd,
        max_price: maxPrice,
      });

      // Filter by transmission on client side (only if explicitly mentioned in stage data)
      let filteredData = data || [];
      if (transmission && filteredData.length > 0) {
        const transmissionKeyword = transmission === "automatique" ? "automatique" : "manuelle";
        const oppositeKeyword = transmission === "automatique" ? "manuelle" : "automatique";

        // Only filter if stages have transmission info in their data
        // Keep stages that mention the requested transmission OR don't mention either
        filteredData = filteredData.filter((stage: StageResult) => {
          const desc = (stage.stage_description || "").toLowerCase();
          const title = (stage.stage_title || "").toLowerCase();
          const hasRequested = desc.includes(transmissionKeyword) || title.includes(transmissionKeyword);
          const hasOpposite = desc.includes(oppositeKeyword) || title.includes(oppositeKeyword);

          // Show if it has requested transmission, or doesn't mention either (assume manual default)
          return hasRequested || (!hasRequested && !hasOpposite && transmission === "manuelle");
        });
      }

      if (error) {
        console.error("Search error:", error);
        // Fallback to direct table query if RPC fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("stages")
          .select(`
            id,
            title,
            description,
            license_type,
            start_date,
            end_date,
            price,
            max_students,
            enrolled_students,
            auto_ecole:auto_ecole_id (
              id,
              name,
              city
            )
          `)
          .eq("is_available", true)
          .eq("status", "active");

        if (fallbackError) throw fallbackError;
        
        // Filter fallback data by transmission (same logic as main filter)
        let filteredFallback = fallbackData || [];
        if (transmission) {
          const keyword = transmission === "automatique" ? "automatique" : "manuelle";
          const oppositeKeyword = transmission === "automatique" ? "manuelle" : "automatique";
          filteredFallback = filteredFallback.filter((stage: any) => {
            const desc = (stage.description || "").toLowerCase();
            const title = (stage.title || "").toLowerCase();
            const hasRequested = desc.includes(keyword) || title.includes(keyword);
            const hasOpposite = desc.includes(oppositeKeyword) || title.includes(oppositeKeyword);
            return hasRequested || (!hasRequested && !hasOpposite && transmission === "manuelle");
          });
        }
        
        // Transform fallback data
        const transformed = filteredFallback?.map((stage: any) => ({
          stage_id: stage.id,
          stage_title: stage.title,
          stage_description: stage.description,
          license_type: stage.license_type,
          start_date: stage.start_date,
          end_date: stage.end_date,
          price: stage.price,
          max_students: stage.max_students,
          enrolled_students: stage.enrolled_students,
          available_spots: stage.max_students - stage.enrolled_students,
          auto_ecole_id: stage.auto_ecole.id,
          auto_ecole_name: stage.auto_ecole.name,
          auto_ecole_city: stage.auto_ecole.city,
          auto_ecole_rating: 0,
        })) || [];
        
        setStages(transformed);
      } else {
        setStages(filteredData);
      }
    } catch (error) {
      console.error("Error fetching stages:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, city, transmission, selectedMonth, maxPrice]);

  // Initial load
  useEffect(() => {
    searchStages();
  }, [searchStages]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Search Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Trouvez votre stage de conduite intensif
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              Des stages accélérés dans toute la France. Obtenez votre permis en 7 jours !
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-4 sm:p-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* City */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                  Ville
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Paris, Lyon..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Transmission (Boite) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                  Boîte
                </label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="manuelle">Boîte manuelle</option>
                    <option value="automatique">Boîte automatique</option>
                  </select>
                </div>
              </div>

              {/* Mois */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                  Mois
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Tous les mois</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + i);
                      const value = d.toISOString().slice(0, 7);
                      const label = d.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
                      return (
                        <option key={value} value={value}>
                          {label.charAt(0).toUpperCase() + label.slice(1)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <button
                  onClick={searchStages}
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Rechercher
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? "Masquer les filtres" : "Plus de filtres"}
              </button>
              <span className="text-sm text-gray-500">
                {stages.length} stage{stages.length > 1 ? "s" : ""} trouvé
                {stages.length > 1 ? "s" : ""}
              </span>
            </div>

            {/* Additional Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-gray-100">
                    <label className="block text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                      Budget maximum
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {priceRanges.map((range) => (
                        <button
                          key={range.label}
                          onClick={() => setMaxPrice(maxPrice === range.max ? null : range.max)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            maxPrice === range.max
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Recherche des meilleurs stages...</p>
          </div>
        ) : stages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun stage trouvé</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Essayez d'élargir vos critères de recherche ou consultez nos autres stages disponibles.
            </p>
            <button
              onClick={() => {
                setCity("");
                setTransmission("manuelle");
                setSelectedMonth("");
                setMaxPrice(null);
                searchStages();
              }}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Réinitialiser la recherche
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Results List */}
            <div className="lg:col-span-2 space-y-6">
              {stages.map((stage, index) => (
                <motion.div
                  key={stage.stage_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-100"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* City Image */}
                    <div className="sm:w-48 h-32 sm:h-40 relative rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                      <Image
                        src={getCityImage(stage.auto_ecole_city)}
                        alt={stage.auto_ecole_city}
                        fill
                        sizes="200px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-2 left-2 text-white">
                        <p className="font-bold text-sm">{stage.auto_ecole_city}</p>
                      </div>
                    </div>

                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">
                              {stage.license_type}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {stage.auto_ecole_city}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">{stage.stage_title}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-blue-600">{stage.price}€</p>
                          <p className="text-sm text-gray-500">TTC</p>
                        </div>
                      </div>

                      {/* Auto-école */}
                      <p className="text-gray-600 mb-3 flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{stage.auto_ecole_name}</span>
                        {stage.auto_ecole_rating > 0 && (
                          <span className="flex items-center gap-1 text-sm">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {stage.auto_ecole_rating.toFixed(1)}
                          </span>
                        )}
                      </p>

                      {/* Details */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          Du {formatDate(stage.start_date)} au {formatDate(stage.end_date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {calculateDuration(stage.start_date, stage.end_date)} jours
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          {stage.available_spots} place{stage.available_spots > 1 ? "s" : ""} restante
                          {stage.available_spots > 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Description */}
                      {stage.stage_description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {stage.stage_description}
                        </p>
                      )}

                      {/* CTA */}
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/stage/${stage.stage_id}`}
                          className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          Voir les détails
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        <button className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                          <Phone className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Promo Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Vous ne trouvez pas ?</h3>
                <p className="text-blue-100 text-sm mb-4">
                  Créez une alerte et soyez notifié dès qu'un stage correspondant est disponible.
                </p>
                <Link
                  href="/alerte"
                  className="block w-full py-3 bg-white text-blue-600 font-bold rounded-xl text-center hover:bg-blue-50 transition-colors"
                >
                  Etre Contacter
                </Link>
              </div>

              {/* Trust Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Pourquoi nous choisir ?</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">Paiement sécurisé</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">Annulation gratuite 48h avant</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">Support 7j/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export with Suspense wrapper for useSearchParams
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
