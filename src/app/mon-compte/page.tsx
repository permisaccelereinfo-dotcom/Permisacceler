"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Calendar,
  Star,
  ArrowRight,
  Loader2,
  Car,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  HelpCircle,
  FileCheck,
  IdCard,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function StudentDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcoming: 0,
    completed: 0,
  });
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState({
    hasPermit: "" as "oui" | "non" | "",
    transmission: "" as "auto" | "manuelle" | "",
    hasCode: "" as "oui" | "non" | "",
    nephNumber: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/login");
        return;
      }

      // Get user profile
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userData) {
        setUser(userData);
        // Pre-fill quiz data if it exists
        if (userData.has_permit !== null) {
          setQuizData(prev => ({
            ...prev,
            hasPermit: userData.has_permit ? "oui" : "non",
            transmission: userData.transmission_preference || "",
            hasCode: userData.has_code ? "oui" : "non",
            nephNumber: userData.neph_number || "",
          }));
        }
      }

      // Get bookings with stage info
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select(`
          *,
          stage:stage_id (
            *,
            auto_ecole:auto_ecole_id (name, city)
          )
        `)
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });

      const bookingsList = bookingsData || [];
      setBookings(bookingsList);

      // Calculate stats
      const now = new Date();
      setStats({
        totalBookings: bookingsList.length,
        upcoming: bookingsList.filter((b: any) => 
          b.status === "confirmed" && new Date(b.stage?.start_date) > now
        ).length,
        completed: bookingsList.filter((b: any) => b.status === "completed").length,
      });

      setLoading(false);
    };

    fetchData();
  }, [router, supabase]);

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
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bonjour {user?.name?.split(" ")[0] || "Élève"} !</h1>
              <p className="text-blue-100">Bienvenue sur votre espace élève</p>
            </div>
          </div>
        </div>

        {/* Quiz Alert - Show if not completed */}
        {(!user?.quiz_completed || user?.has_permit === null) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-900 mb-1">
                  COMPLETER VOTRE PROFIL
                </h3>
                <p className="text-amber-700 mb-4">
                  Aidez-nous à mieux vous accompagner en répondant à quelques questions sur votre parcours permis.
                </p>
                <button
                  onClick={() => setShowQuiz(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors"
                >
                  Compléter maintenant
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                <p className="text-sm text-gray-600">Réservations totales</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
                <p className="text-sm text-gray-600">Stages à venir</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-sm text-gray-600">Stages terminés</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/mon-compte/reservations"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Mes réservations</h3>
                  <p className="text-sm text-gray-600">Voir et gérer mes stages</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </div>
          </Link>

          <Link
            href="/mon-compte/profil"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Mon profil</h3>
                  <p className="text-sm text-gray-600">Modifier mes informations</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
            </div>
          </Link>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Mes dernières réservations</h2>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">Vous n&apos;avez pas encore de réservation</p>
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
              {bookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : booking.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : booking.status === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {booking.status === "confirmed" ? "Confirmé"
                          : booking.status === "pending" ? "En attente"
                          : booking.status === "completed" ? "Terminé"
                          : "Annulé"}
                      </span>
                      <span className="text-sm text-gray-500">Permis {booking.stage?.license_type}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900">{booking.stage?.title}</h4>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {booking.stage?.auto_ecole?.name} - {booking.stage?.auto_ecole?.city}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 text-right">
                    <p className="text-lg font-bold text-blue-600">{booking.total_price}€</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Du {new Date(booking.stage?.start_date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))}
              {bookings.length > 3 && (
                <Link
                  href="/mon-compte/reservations"
                  className="block text-center py-4 text-blue-600 font-semibold hover:underline"
                >
                  Voir toutes mes réservations →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
