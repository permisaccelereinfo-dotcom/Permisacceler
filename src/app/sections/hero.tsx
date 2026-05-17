"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Calendar, Car, ChevronDown, Check } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

function useOnClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

interface CustomSelectProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  className?: string;
  dropdownAlign?: "left" | "right";
}

function CustomSelect({ label, icon, value, onChange, options, placeholder, className = "", dropdownAlign = "left" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setIsOpen(false));

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div 
      ref={ref}
      className={`flex-1 flex flex-col px-6 py-2 relative group cursor-pointer hover:bg-gray-50/50 transition-colors ${isOpen ? 'z-50' : 'z-10'} ${className}`}
      onClick={() => setIsOpen(!isOpen)}
    >
      <label className="text-[10px] font-bold uppercase tracking-wider text-[#1278CC] mb-0.5 cursor-pointer">{label}</label>
      <div className="flex items-center w-full">
        <div className="text-gray-400 mr-2 group-hover:text-[#1278CC] transition-colors">
          {icon}
        </div>
        <div className="flex-1 text-sm font-semibold text-gray-900 truncate pr-2">
          {selectedOption ? selectedOption.label : <span className="text-gray-500 font-normal">{placeholder}</span>}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 group-hover:text-[#1278CC] transition-transform duration-300 ml-auto flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute top-[110%] w-[calc(100%+2rem)] -ml-4 lg:ml-0 lg:w-auto lg:min-w-[260px] mt-1 bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-50 overflow-hidden ${dropdownAlign === 'right' ? 'lg:right-0 lg:left-auto' : 'left-0'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[280px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent pr-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors
                    ${value === option.value ? 'bg-[#1278CC]/5 text-[#1278CC] font-bold' : 'text-gray-700 font-medium'}
                  `}
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value && <Check className="h-4 w-4 shrink-0 text-[#1278CC] ml-3" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
    <section className="relative overflow-x-hidden z-40 bg-[#1278CC] pt-4 pb-0 lg:pt-6 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
          
          {/* Left Column: Text & Search */}
          <div className="w-full lg:w-[65%] xl:w-[70%] z-50 relative flex flex-col items-start lg:pr-8">
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
                <CustomSelect 
                  label="Lieu du stage"
                  icon={<MapPin className="h-4 w-4" />}
                  value={city}
                  onChange={setCity}
                  options={[
                    { label: "Île de France", value: "ile_de_france" },
                    { label: "Province", value: "province" }
                  ]}
                  placeholder="Sélectionnez..."
                  className="border-b lg:border-b-0 lg:border-r border-gray-100 first:rounded-t-2xl lg:first:rounded-l-full"
                />

                {/* Field 2: Date de démarrage */}
                <CustomSelect 
                  label="Date de démarrage du stage"
                  icon={<Calendar className="h-4 w-4" />}
                  value={startMonth}
                  onChange={setStartMonth}
                  options={months.map(m => ({ label: m, value: m }))}
                  placeholder="Sélectionnez..."
                  className="border-b lg:border-b-0 lg:border-r border-gray-100"
                />

                {/* Field 3: Boîte de vitesse */}
                <CustomSelect 
                  label="Boîte de vitesse"
                  icon={<Car className="h-4 w-4" />}
                  value={transmission}
                  onChange={setTransmission}
                  options={[
                    { label: "Boîte manuelle", value: "Boîte manuelle" },
                    { label: "Boîte automatique", value: "Boîte automatique" }
                  ]}
                  placeholder="Sélectionnez..."
                  className="lg:rounded-r-none"
                  dropdownAlign="right"
                />

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
            className="w-full lg:w-[35%] xl:w-[30%] relative flex justify-center lg:justify-end lg:-mr-12 xl:-mr-20 lg:translate-x-[15%] xl:translate-x-[15%]"
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
