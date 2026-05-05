"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

const faqItems = [
  {
    id: 1,
    title: "J'ai oublié mon mot de passe, que faire ?",
    description: "Vous ne parvenez pas à vous connecter à votre compte et vous souhaitez réinitialiser votre mot de passe ? Su...",
  },
  {
    id: 2,
    title: "M'informer sur l'Assistant téléphonique",
    description: "Afin de se consacrer davantage à vos soins tout en restant disponible pour traiter vos demandes, votre soignant peut ...",
  },
  {
    id: 3,
    title: "Mon soignant n'a pas de disponibilité en ligne ou n'est pas sur Doctolib, que faire ?",
    description: "Vous ne trouvez pas votre soignant sur Doctolib ou celui-ci n'a pas de disponibilité en ligne, voyons quoi faire selo...",
  },
];

export default function CentreDAidePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [startIndex, setStartIndex] = useState(0);

  const handlePrev = () => {
    setStartIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev < faqItems.length - 3 ? prev + 1 : prev));
  };

  const visibleItems = faqItems.slice(startIndex, startIndex + 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#0078C8] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#0078C8] font-bold text-xl">D</span>
            </div>
            <span className="text-white font-semibold text-lg">Centre d&apos;aide</span>
          </div>
          <a
            href="#"
            className="text-white text-sm hover:underline flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Réserver un rendez-vous sur Doctolib
          </a>
        </div>
      </header>

      {/* Search Section */}
      <section className="bg-[#0078C8] pb-16 pt-8 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-white text-2xl font-medium mb-6">
            Recherchez des articles pour trouver votre réponse
          </h1>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ex : Mot de passe oublié, créer un compte..."
              className="w-full px-6 py-4 pr-14 rounded-full bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#003B5C] rounded-full flex items-center justify-center hover:bg-[#002d47] transition-colors">
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Questions fréquentes
          </h2>

          <div className="relative flex items-center gap-4">
            {/* Prev Button */}
            <button
              onClick={handlePrev}
              disabled={startIndex === 0}
              className="flex-shrink-0 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            {/* Cards */}
            <div className="flex-1 grid grid-cols-3 gap-6">
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#F8FAFC] rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                >
                  <h3 className="font-bold text-gray-900 mb-3 text-base">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={startIndex >= faqItems.length - 3}
              className="flex-shrink-0 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
