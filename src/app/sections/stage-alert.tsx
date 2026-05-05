  "use client";

import { motion } from "framer-motion";
import { Bell } from "lucide-react";

export function StageAlert() {
  return (
    <section className="py-24 bg-[#FBF9F4]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col items-center text-center mb-12">
          {/* Bell Icon Illustration */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="mb-8 relative"
          >
            <div className="w-24 h-24 flex items-center justify-center">
              {/* Custom SVG Bell to match the image better */}
              <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full drop-shadow-lg"
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M50 15C42.8 15 37 20.8 37 28V32H63V28C63 20.8 57.2 15 50 15Z" 
                  fill="#EAB308" 
                />
                <path 
                  d="M25 75C25 75 25 35 50 35C75 35 75 75 75 75L25 75Z" 
                  fill="#EAB308" 
                />
                <rect x="20" y="70" width="60" height="8" rx="4" fill="#CA8A04" />
                <circle cx="50" cy="85" r="7" fill="#854D0E" />
                <path 
                  d="M45 10C45 7.2 47.2 5 50 5C52.8 5 55 7.2 55 10V15H45V10Z" 
                  fill="#CA8A04" 
                />
              </svg>
            </div>
          </motion.div>

          <h2 
            className="text-3xl md:text-[40px] font-bold text-gray-900 mb-6 tracking-tight leading-tight"
            style={{ fontFamily: 'var(--ds-nb---font--primary)' }}
          >
            Vous ne trouvez pas de stage qui vous correspond ?
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl leading-relaxed">
            Remplissez ce formulaire afin d'être contacté par un de nos experts
          </p>
        </div>

        <div className="max-w-[800px] mx-auto bg-transparent">
          <form className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Field */}
              <div className="flex flex-col gap-2.5">
                <label className="text-base font-bold text-gray-900">Adresse e-mail</label>
                <input
                  type="email"
                  placeholder="nom.prenom@gmail.com"
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#583e58]/20 focus:border-[#583e58] transition-all text-lg placeholder:text-gray-300"
                />
              </div>
              
              {/* Phone Field */}
              <div className="flex flex-col gap-2.5">
                <label className="text-base font-bold text-gray-900">Téléphone</label>
                <div className="flex items-center w-full px-4 py-4 rounded-xl border border-gray-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#583e58]/20 focus-within:border-[#583e58] transition-all">
                  <div className="flex items-center gap-2 pr-3 border-r border-gray-200 mr-4 cursor-pointer hover:bg-gray-50 transition-colors py-1">
                    <span className="text-2xl">🇫🇷</span>
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    placeholder="06 12 34 56 78"
                    className="w-full focus:outline-none text-lg bg-transparent placeholder:text-gray-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="bg-[#583e58] hover:bg-[#4a344a] text-white font-bold py-5 px-12 rounded-xl shadow-lg transition-all text-lg"
              >
                Etre Contacter
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
