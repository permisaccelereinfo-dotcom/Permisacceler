"use client";

import { motion } from "framer-motion";
import { Bell } from "lucide-react";

export function AlertSection() {
  return (
    <section className="py-24 bg-[#FAF8F5]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Bell Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-amber-500"
              >
                <path
                  d="M32 8C32 8 20 8 20 24C20 32 16 36 16 36H48C48 36 44 32 44 24C44 8 32 8 32 8Z"
                  fill="#F59E0B"
                />
                <path
                  d="M32 8C32 8 20 8 20 24C20 32 16 36 16 36H48C48 36 44 32 44 24C44 8 32 8 32 8Z"
                  stroke="#D97706"
                  strokeWidth="2"
                />
                <path
                  d="M28 4H36V8H28V4Z"
                  fill="#D97706"
                />
                <path
                  d="M32 44C35.3137 44 38 41.3137 38 38H26C26 41.3137 28.6863 44 32 44Z"
                  fill="#D97706"
                />
                <rect x="24" y="16" width="16" height="12" rx="1" fill="#FBBF24" />
                <rect x="26" y="18" width="12" height="2" rx="0.5" fill="#D97706" />
                <rect x="26" y="22" width="12" height="2" rx="0.5" fill="#D97706" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            Vous ne trouvez pas de stage dans vos critères ?
          </h2>

          {/* Subtitle */}
          <p className="mt-4 text-gray-600 max-w-xl mx-auto">
            Créez une alerte et soyez informé dès qu'un stage correspondant à votre recherche est disponible.
          </p>

          {/* Form */}
          <form className="mt-8 space-y-4">
            {/* Row 1: Nom Complet & Téléphone - Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] gap-4">
              {/* Nom Complet - Narrower */}
              <div className="text-left">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Nom complet
                </label>
                <input
                  type="text"
                  id="fullName"
                  placeholder="Jean Dupont"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Téléphone */}
              <div className="text-left">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Téléphone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="flex items-center gap-1 text-gray-700">
                      <svg
                        width="20"
                        height="14"
                        viewBox="0 0 20 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect width="20" height="14" fill="#0055A4" />
                        <rect x="6.67" width="6.66" height="14" fill="#FFFFFF" />
                        <rect x="13.33" width="6.67" height="14" fill="#EF4135" />
                      </svg>
                      <svg
                        className="w-4 h-4 text-gray-400 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </span>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    placeholder="06 12 34 56 78"
                    className="w-full rounded-lg border border-gray-300 pl-16 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Email & Button - Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
              {/* Email - Narrower */}
              <div className="text-left">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Adresse e-mail <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="nom.prenom@gmail.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 whitespace-nowrap"
              >
                Créer une alerte
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
