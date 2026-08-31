"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Check } from "lucide-react";

const reassurances = [
  "Un expert vous rappelle sous 24h",
  "Disponible 7j/7",
  "Sans engagement",
];

export function AlertSection() {
  return (
    <section className="py-24 bg-[#FAF8F5]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xl shadow-gray-200/60 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
              {/* Left: pitch */}
              <div className="bg-[#00234b] p-8 sm:p-10 flex flex-col justify-center">
                <Image
                  src="/icons/alarm-bell.png"
                  alt=""
                  width={64}
                  height={64}
                  className="mb-5"
                />
                <h2 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-white leading-snug">
                  Vous ne trouvez pas de stage qui vous correspond ?
                </h2>
                <p className="mt-3 text-white/80 text-[15px] leading-relaxed">
                  Remplissez ce formulaire afin d&apos;être contacté par un de nos
                  experts.
                </p>
                <ul className="mt-6 space-y-3">
                  {reassurances.map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-[#ffcb00]" strokeWidth={3} />
                      </span>
                      <span className="text-[13.5px] text-white/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: form */}
              <div className="p-8 sm:p-10">
                <form className="space-y-4">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-[13px] font-semibold text-[#00234b] mb-1.5"
                    >
                      Nom complet
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      placeholder="Jean Dupont"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1278CC] focus:ring-2 focus:ring-[#1278CC]/15 transition-shadow"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-[13px] font-semibold text-[#00234b] mb-1.5"
                    >
                      Téléphone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <svg
                          width="20"
                          height="14"
                          viewBox="0 0 20 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="rounded-[2px]"
                        >
                          <rect width="20" height="14" fill="#0055A4" />
                          <rect x="6.67" width="6.66" height="14" fill="#FFFFFF" />
                          <rect x="13.33" width="6.67" height="14" fill="#EF4135" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        placeholder="06 12 34 56 78"
                        className="w-full rounded-xl border border-gray-200 pl-12 pr-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1278CC] focus:ring-2 focus:ring-[#1278CC]/15 transition-shadow"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-[13px] font-semibold text-[#00234b] mb-1.5"
                    >
                      Adresse e-mail{" "}
                      <span className="text-gray-400 font-normal">(optionnel)</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      placeholder="nom.prenom@gmail.com"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1278CC] focus:ring-2 focus:ring-[#1278CC]/15 transition-shadow"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-full bg-[#ffcb00] hover:bg-[#f0bd00] text-[#00234b] font-extrabold text-[15px] py-3.5 shadow-lg shadow-amber-200/60 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Être contacté
                  </button>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
