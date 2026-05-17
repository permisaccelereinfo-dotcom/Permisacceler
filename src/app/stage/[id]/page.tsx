"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Check, ChevronDown, Loader2 } from "lucide-react";

type StageDetails = {
  id: string;
  title: string;
  stage_type: string;
  start_date: string;
  end_date: string;
  price: number;
  auto_ecole: {
    name: string;
    region: string;
  };
};

export default function RecapitulatifPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [stage, setStage] = useState<StageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStage() {
      if (!id) return;
      
      const { data, error } = await supabase
        .from("stages")
        .select(`
          id,
          title,
          stage_type,
          start_date,
          end_date,
          price,
          auto_ecole:auto_ecole_id (
            name,
            region
          )
        `)
        .eq("id", id)
        .single();
        
      if (data) {
        setStage(data as any);
      } else if (error) {
        console.error("Error fetching stage:", error);
      }
      setLoading(false);
    }
    
    fetchStage();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] pt-16 pb-32 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3647AC]" />
      </div>
    );
  }

  if (!stage) {
    return (
      <div className="min-h-screen bg-[#fafbfc] pt-16 pb-32 flex flex-col justify-center items-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Stage introuvable</h1>
        <p className="text-gray-500">Le stage que vous recherchez n'existe pas ou n'est plus disponible.</p>
        <button 
          onClick={() => window.history.back()}
          className="mt-8 bg-[#3647AC] text-white px-6 py-2 rounded-full font-medium hover:bg-[#2A3786] transition-colors"
        >
          Retour
        </button>
      </div>
    );
  }

  // Format dates
  const start = new Date(stage.start_date);
  const end = new Date(stage.end_date);
  
  const formatDay = (d: Date) => {
    const day = d.getDate();
    return day === 1 ? "1er" : day.toString();
  };
  
  const startStr = `${formatDay(start)} ${start.toLocaleDateString('fr-FR', { month: 'long' })}`;
  const endStr = `${formatDay(end)} ${end.toLocaleDateString('fr-FR', { month: 'long' })}`;
  const dateText = `Du ${startStr} au ${endStr}`;
  
  // Calculate duration
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive

  // Mock CPF Price (+~16%)
  const cpfPrice = Math.round(stage.price * 1.166);
  
  // Location formatting
  const region = stage.auto_ecole?.region || "ILE DE FRANCE";
  const mockZip = region === "ILE DE FRANCE" ? "93160" : "30000";
  const lines = ["RER A", "RER B", "RER C", "Ligne J", "T9", "Métro"];
  // Random line based on first letter of id for consistency
  const charCode = stage.id.charCodeAt(0) || 0;
  const randomLine = lines[charCode % lines.length];
  const locationText = `${randomLine} - ${region === "ILE DE FRANCE" ? "Noisy-le-Grand - Mont d'Est" : stage.auto_ecole?.name} (${mockZip})`;

  // Derived attributes
  const isAuto = stage.title.toLowerCase().includes("automatique");
  const transmission = isAuto ? "Boîte automatique" : "Boîte manuelle";
  
  // Driving hours calculation from title (e.g. 30H -> 26H driving, 4H theory)
  const match = stage.stage_type?.match(/(\d+)H/);
  const totalHours = match ? parseInt(match[1]) : 30;
  const theoryHours = 4;
  const drivingHours = totalHours > theoryHours ? totalHours - theoryHours : totalHours;

  return (
    <div className="min-h-screen bg-[#fafbfc] pt-12 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Progress Bar */}
        <div className="flex flex-col items-center justify-center mb-12">
          <span className="text-gray-400 text-xs mb-3 font-medium">Récapitulatif</span>
          <div className="flex gap-2 sm:gap-4 items-center">
            <div className="w-8 sm:w-12 h-1 bg-[#3647AC] rounded-full"></div>
            <div className="w-8 sm:w-12 h-1 bg-[#3647AC] rounded-full"></div>
            <div className="w-8 sm:w-12 h-1 bg-[#3647AC] rounded-full"></div>
            <div className="w-8 sm:w-12 h-1 bg-[#3647AC] rounded-full"></div>
            <div className="w-8 sm:w-12 h-1 bg-gray-200 rounded-full"></div>
            <div className="w-8 sm:w-12 h-1 bg-gray-200 rounded-full"></div>
          </div>
        </div>

        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-[28px] sm:text-[34px] font-medium text-gray-900 mb-2 tracking-tight" style={{ fontFamily: 'var(--ds-nb---font--primary)' }}>
            Votre récapitulatif d'inscription
          </h1>
          <p className="text-gray-600 text-[15px]">
            Vérifiez les caractéristiques de votre stage.
          </p>
        </div>

        {/* CARD */}
        <div className="max-w-[420px] mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-[26px] text-gray-900 mb-2 tracking-tight" style={{ fontFamily: 'var(--ds-nb---font--primary)' }}>
                  {stage.stage_type || "Stage intensif"}
                </h2>
                <div className="text-[44px] font-bold text-gray-900 leading-none tracking-tight mb-3">
                  {stage.price.toLocaleString("fr-FR")} €
                </div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  PRIX CPF : {cpfPrice.toLocaleString("fr-FR")} €
                </div>
              </div>

              <div className="border-t border-gray-200 mb-6"></div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 text-[14.5px] mb-4">Informations pratiques :</h3>
                <ul className="space-y-3.5">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded bg-[#E8F0FE] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#3647AC]" strokeWidth={3} />
                    </div>
                    <span className="text-[14.5px] text-gray-700">{transmission}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded bg-[#E8F0FE] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#3647AC]" strokeWidth={3} />
                    </div>
                    <span className="text-[14.5px] text-gray-700">{dateText}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded bg-[#E8F0FE] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#3647AC]" strokeWidth={3} />
                    </div>
                    <span className="text-[14.5px] text-gray-700 leading-relaxed pr-2">{locationText}</span>
                  </li>
                </ul>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-gray-900 text-[14.5px] mb-4">Comprend :</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-gray-800 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-[14.5px] text-gray-700">Durée du stage : {diffDays} jours</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-gray-800 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-[14.5px] text-gray-700">{drivingHours}H de conduite</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-gray-800 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-[14.5px] text-gray-700">{theoryHours}H d'écoute pédagogique en voiture</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-gray-800 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-[14.5px] text-gray-700">1 moniteur unique</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-gray-800 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-[14.5px] text-gray-700">1 date d'examen 100% garantie</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-gray-800 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-[14.5px] text-gray-700">Délai : 3 à 10 jours après le stage ⚡</span>
                  </li>
                </ul>
              </div>

              <div className="text-center">
                <p className="text-[11px] text-gray-400 mb-4">Planning d'heures communiqué avant le début du stage</p>
                <button className="text-[13px] text-gray-500 font-medium inline-flex items-center gap-1 hover:text-gray-800 transition-colors">
                  Voir plus
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Link 
              href={`/checkout/${stage.id}`}
              className="inline-block bg-[#3647AC] text-white px-10 py-3.5 rounded-full font-medium text-[15px] hover:bg-[#2A3786] transition-colors shadow-sm"
            >
              Réserver
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
