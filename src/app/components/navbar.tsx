"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, HelpCircle, LogOut } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userData } = await supabase
          .from("users")
          .select("name, role")
          .eq("id", authUser.id)
          .single();
        setUser({ ...authUser, ...userData });
      }
    };
    checkUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  if (pathname === "/recherche" || pathname?.startsWith("/stage/") || pathname?.startsWith("/checkout/")) {
    return (
      <nav className="sticky top-0 z-50 bg-[#1278CC] border-b-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-center">
            <div className="flex flex-col items-center">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-white tracking-tight italic">PermisAccéléré</span>
              </Link>
              <span className="text-[10px] text-white/80 font-medium tracking-wide">Plateforme n°1 des Permis Accélérés en France</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#1278CC] border-b-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex flex-col">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-white tracking-tight italic">PermisAccéléré</span>
            </Link>
            <span className="text-[10px] text-white/80 font-medium tracking-wide">Plateforme n°1 des Permis Accélérés en France</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <a
              href="/auto-ecole"
              className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-navy hover:bg-gray-50 transition-colors shadow-sm"
            >
              Vous êtes auto-école ?
            </a>

            <a href="/centre-d-aide" className="flex items-center gap-1.5 text-sm font-semibold text-white hover:text-gray-200 transition-colors">
              <HelpCircle className="h-4 w-4" />
              <span>Centre d'aide</span>
            </a>

            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href={user.role === "auto_ecole" ? "/dashboard" : "/mon-compte"}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white hover:text-gray-200 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <div className="flex flex-col items-start leading-none">
                    <span className="font-bold">{user.name?.split(" ")[0] || "Mon compte"}</span>
                    <span className="text-[10px] font-normal opacity-80 mt-0.5">
                      {user.role === "auto_ecole" ? "Espace pro" : "Gérer mes RDV"}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <a href="/login" className="flex items-center gap-1.5 text-sm font-semibold text-white hover:text-gray-200 transition-colors">
                <User className="h-4 w-4" />
                <div className="flex flex-col items-start leading-none">
                  <span className="font-bold">Se connecter</span>
                  <span className="text-[10px] font-normal opacity-80 mt-0.5">Gérer mes RDV</span>
                </div>
              </a>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden rounded-lg p-2 text-white hover:bg-primary-hover"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#1278CC] border-t border-primary-hover"
          >
            <div className="space-y-2 px-4 py-6">
              <a href="/auto-ecole" className="block rounded-lg bg-white px-4 py-3 text-base font-bold text-navy text-center">
                Vous êtes auto-école ?
              </a>
              <a href="/centre-d-aide" className="block rounded-lg px-4 py-3 text-base font-semibold text-white hover:bg-primary-hover">
                Centre d'aide
              </a>
              {user ? (
                <>
                  <Link
                    href={user.role === "auto_ecole" ? "/dashboard" : "/mon-compte"}
                    className="block rounded-lg px-4 py-3 text-base font-semibold text-white hover:bg-primary-hover"
                  >
                    Mon compte ({user.name?.split(" ")[0]})
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left rounded-lg px-4 py-3 text-base font-semibold text-white hover:bg-primary-hover"
                  >
                    Se déconnecter
                  </button>
                </>
              ) : (
                <a href="/login" className="block rounded-lg px-4 py-3 text-base font-semibold text-white hover:bg-primary-hover">
                  Se connecter
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
