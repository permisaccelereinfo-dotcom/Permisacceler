"use client";

import { motion } from "framer-motion";
import { Search, MapPin, Calendar, Car, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Hero() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [transmission, setTransmission] = useState("Boîte manuelle");

  const months = Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i);
    const label = d.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  // Major French cities (population > 100,000) for driving schools
  const frenchCities = [
    "Paris",
    "Marseille",
    "Lyon",
    "Toulouse",
    "Nice",
    "Nantes",
    "Strasbourg",
    "Montpellier",
    "Bordeaux",
    "Lille",
    "Rennes",
    "Reims",
    "Le Havre",
    "Saint-Étienne",
    "Toulon",
    "Grenoble",
    "Dijon",
    "Angers",
    "Nîmes",
    "Le Mans",
    "Aix-en-Provence",
    "Clermont-Ferrand",
    "Brest",
    "Limoges",
    "Tours",
    "Amiens",
    "Perpignan",
    "Metz",
    "Besançon",
    "Orléans",
    "Rouen",
    "Mulhouse",
    "Caen",
    "Nancy",
    "Saint-Denis",
    "Argenteuil",
    "Montreuil",
    "Roubaix",
    "Dunkerque",
    "Avignon",
    "Poitiers",
    "Nanterre",
    "Créteil",
    "Versailles",
    "Courbevoie",
    "Colombes",
    "Vitry-sur-Seine",
    "Asnières-sur-Seine",
    "Aulnay-sous-Bois",
    "Pau",
    "Rueil-Malmaison",
    "Champigny-sur-Marne",
    "La Rochelle",
    "Antibes",
    "Calais",
    "Saint-Maur-des-Fossés",
    "Cannes",
    "Béziers",
    "Bourges",
    "Saint-Nazaire",
    "Colmar",
    "Ajaccio",
    "Quimper",
    "Valence",
    "Pessac",
    "Cergy",
    "Troyes",
    "Chambéry",
    "Lorient",
    "Mérignac",
    "Saint-Quentin",
    "Noisy-le-Grand",
    "Villeneuve-d'Ascq",
    "Vannes",
    "Sète",
    "Saint-Malo",
    "Gennevilliers",
    "Douai",
    "Saint-Brieuc",
    "Tarbes",
    "Angoulême",
    "Cholet",
    "Alfortville",
    "Gap",
    "Roanne",
    "Charleville-Mézières",
    "Thonon-les-Bains",
    "Châteauroux",
    "Vichy",
    "Arles",
    "Annecy",
    "Bayonne",
    "Carcassonne",
    "Blois",
    "Saint-Germain-en-Laye",
    "Drancy",
    "Saint-Raphaël",
    "Hyères",
    "Évreux",
    "Mâcon",
    "Chalon-sur-Saône",
    "Beauvais",
    "Aubagne",
    "Boulogne-sur-Mer",
    "Saint-Laurent-du-Var",
    "Châlons-en-Champagne",
    "Bourg-en-Bresse",
    "Sens",
    "Biarritz",
    "Menton",
    "Bergerac"
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (startMonth) params.set("month", startMonth);
    if (transmission) params.set("transmission", transmission);
    router.push(`/recherche?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-[#1278CC] pt-4 pb-0 lg:pt-6 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
          
          {/* Left Column: Text & Search */}
          <div className="w-full lg:w-[65%] xl:w-[70%] z-10 relative flex flex-col items-start lg:pr-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-4xl" style={{ fontFamily: 'var(--ds-nb---font--primary)' }}>
                Votre permis au plus vite
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 w-full"
            >
              {/* Premium Search Bar */}
              <div className="bg-white rounded-2xl lg:rounded-full shadow-2xl p-2 lg:p-3 flex flex-col lg:flex-row items-stretch lg:items-center w-full max-w-5xl gap-2 lg:gap-0">
                
                {/* Field 1: Lieu du stage */}
                <div className="flex-1 flex flex-col px-6 py-2 border-b lg:border-b-0 lg:border-r border-gray-100 group cursor-pointer hover:bg-gray-50/50 transition-colors first:rounded-t-2xl lg:first:rounded-l-full">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#1278CC] mb-0.5">Lieu du stage</label>
                  <div className="flex items-center relative">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2 group-hover:text-[#1278CC] transition-colors" />
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 text-gray-900 font-semibold outline-none text-sm p-0 appearance-none cursor-pointer"
                    >
                      <option value="">Sélectionnez...</option>
                      <option value="ile_de_france">Île de France</option>
                      <option value="province">Province</option>
                    </select>
                    <ChevronDown className="h-3 w-3 text-gray-400 group-hover:text-[#1278CC] transition-colors ml-auto" />
                  </div>
                </div>

                {/* Field 2: Date de démarrage */}
                <div className="flex-1 flex flex-col px-6 py-2 border-b lg:border-b-0 lg:border-r border-gray-100 group cursor-pointer hover:bg-gray-50/50 transition-colors">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#1278CC] mb-0.5">Date de démarrage du stage</label>
                  <div className="flex items-center relative">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2 group-hover:text-[#1278CC] transition-colors" />
                    <select 
                      value={startMonth}
                      onChange={(e) => setStartMonth(e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 text-gray-900 font-semibold outline-none text-sm p-0 appearance-none cursor-pointer"
                    >
                      <option value="">Sélectionnez...</option>
                      {months.map((month) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    <ChevronDown className="h-3 w-3 text-gray-400 group-hover:text-[#1278CC] transition-colors ml-auto" />
                  </div>
                </div>

                {/* Field 3: Boîte de vitesse */}
                <div className="flex-1 flex flex-col px-6 py-2 group cursor-pointer hover:bg-gray-50/50 transition-colors lg:rounded-r-none">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#1278CC] mb-0.5">Boîte de vitesse</label>
                  <div className="flex items-center relative">
                    <Car className="h-4 w-4 text-gray-400 mr-2 group-hover:text-[#1278CC] transition-colors" />
                    <select 
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 text-gray-900 font-semibold outline-none text-sm p-0 appearance-none cursor-pointer"
                    >
                      <option>Boîte manuelle</option>
                      <option>Boîte automatique</option>
                    </select>
                    <ChevronDown className="h-3 w-3 text-gray-400 group-hover:text-[#1278CC] transition-colors ml-auto" />
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  onClick={handleSearch}
                  className="bg-[#00234b] hover:bg-black text-white rounded-xl lg:rounded-full px-8 py-4 lg:py-4 font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-navy/20 hover:-translate-y-0.5 active:translate-y-0 min-w-[160px]"
                >
                  <span>Rechercher</span>
                  <Search className="h-4 w-4" />
                </button>

              </div>
            </motion.div>
          </div>

          {/* Right Column: Image */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full lg:w-[35%] xl:w-[30%] relative flex justify-center lg:justify-end lg:-mr-16 xl:-mr-30 lg:translate-x-[20%] xl:translate-x-[25%]"
          >
            
            <div className="relative z-10 w-full max-w-[620px] h-[312px] sm:h-[346px] lg:h-[370px]">
              <Image 
                src="/hero-image.png" 
                alt="Student and Instructor" 
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover"
                priority
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
