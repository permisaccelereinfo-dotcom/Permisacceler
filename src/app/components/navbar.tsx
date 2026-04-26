"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, HelpCircle } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#1278CC] border-b-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-white tracking-tight italic">PermisAccéléré</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <a
              href="/auto-ecole"
              className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-navy hover:bg-gray-50 transition-colors shadow-sm"
            >
              Vous êtes auto-école ?
            </a>
            
            <a href="#how-it-works" className="flex items-center gap-1.5 text-sm font-semibold text-white hover:text-gray-200 transition-colors">
              <HelpCircle className="h-4 w-4" />
              <span>Centre d'aide</span>
            </a>
            
            <a href="/login" className="flex items-center gap-1.5 text-sm font-semibold text-white hover:text-gray-200 transition-colors">
              <User className="h-4 w-4" />
              <div className="flex flex-col items-start leading-none">
                <span className="font-bold">Se connecter</span>
                <span className="text-[10px] font-normal opacity-80 mt-0.5">Gérer mes RDV</span>
              </div>
            </a>
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
              <a href="#how-it-works" className="block rounded-lg px-4 py-3 text-base font-semibold text-white hover:bg-primary-hover">
                Centre d'aide
              </a>
              <a href="/login" className="block rounded-lg px-4 py-3 text-base font-semibold text-white hover:bg-primary-hover">
                Se connecter
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
