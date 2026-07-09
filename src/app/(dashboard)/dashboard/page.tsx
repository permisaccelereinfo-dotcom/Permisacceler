"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Calendar, Users, DollarSign, LogOut, Loader2, Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [autoEcole, setAutoEcole] = useState<any>(null);
  const [stats, setStats] = useState({
    activeStages: 0,
    totalReservations: 0,
    revenue: 0,
    enrolledStudents: 0,
  });
  const [newBookingsCount, setNewBookingsCount] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
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

      setUser(user);

      // Fetch auto-ecole data
      const { data: autoEcoleData } = await supabase
        .from("auto_ecoles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setAutoEcole(autoEcoleData);

      if (autoEcoleData) {
        // Fetch active stages count
        const { count: activeStagesCount } = await supabase
          .from("stages")
          .select("id", { count: "exact", head: true })
          .eq("auto_ecole_id", autoEcoleData.id)
          .eq("status", "active");

        // Fetch total reservations and revenue
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("status, total_price, created_at")
          .in(
            "stage_id",
            (
              await supabase
                .from("stages")
                .select("id")
                .eq("auto_ecole_id", autoEcoleData.id)
            ).data?.map((s) => s.id) ?? []
          );

        const totalReservations = bookingsData?.length ?? 0;
        const revenue =
          bookingsData
            ?.filter((b) => b.status === "confirmed" || b.status === "completed")
            .reduce((sum, b) => sum + (b.total_price ?? 0), 0) ?? 0;

        // Fetch enrolled students (confirmed bookings count)
        const enrolledStudents =
          bookingsData?.filter((b) => b.status === "confirmed" || b.status === "completed")
            .length ?? 0;

        // Count new confirmed bookings from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newCount =
          bookingsData?.filter(
            (b) =>
              (b.status === "confirmed" || b.status === "completed") &&
              b.created_at &&
              new Date(b.created_at) >= sevenDaysAgo
          ).length ?? 0;

        setStats({
          activeStages: activeStagesCount ?? 0,
          totalReservations,
          revenue,
          enrolledStudents,
        });
        setNewBookingsCount(newCount);
      }

      setLoading(false);
    };

    checkUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auto-ecole");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom Header - No default navbar */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black text-blue-600 tracking-tight italic">
            PermisAccéléré
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">{autoEcole?.name || user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Tableau de bord
          </h1>

          {/* Notification banner */}
          {newBookingsCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-900">
                  {newBookingsCount} nouvelle{newBookingsCount > 1 ? "s" : ""} réservation{newBookingsCount > 1 ? "s" : ""} confirmée{newBookingsCount > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-blue-700">
                  Vous avez {newBookingsCount} réservation{newBookingsCount > 1 ? "s" : ""} confirmée{newBookingsCount > 1 ? "s" : ""} dans les 7 derniers jours. Consultez la page des réservations pour les détails.
                </p>
              </div>
              <Link
                href="/dashboard/reservations"
                className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                Voir
              </Link>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stages actifs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeStages}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Réservations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReservations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Revenus</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.revenue.toLocaleString("fr-FR")} €</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Élèves inscrits</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.enrolledStudents}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/dashboard/stages"
                className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
              >
                <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-700">Gérer mes stages</p>
              </Link>

              <Link
                href="/dashboard/reservations"
                className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-center"
              >
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-700">Voir les réservations</p>
              </Link>

              <Link
                href="/dashboard/profile"
                className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-center"
              >
                <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-700">Modifier mon profil</p>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
