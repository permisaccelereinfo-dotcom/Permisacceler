"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Header for the auto-école space. Lives in the (dashboard) layout so every
 * page under /dashboard has the logo and a way out — previously only
 * /dashboard itself rendered one inline, leaving /dashboard/stages,
 * /dashboard/reservations and /dashboard/profile with no header at all.
 */
export function DashboardHeader() {
  const router = useRouter();
  const supabase = createClient();
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    const loadIdentity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: autoEcole } = await supabase
        .from("auto_ecoles")
        .select("name")
        .eq("user_id", user.id)
        .maybeSingle();

      setLabel(autoEcole?.name || user.email || "");
    };

    loadIdentity();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auto-ecole");
    router.refresh();
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-black text-blue-600 tracking-tight italic">
          PermisAccéléré
        </Link>
        <div className="flex items-center gap-4">
          {label && <span className="hidden sm:inline text-gray-700 font-medium">{label}</span>}
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
  );
}
