"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { FunnelProgress } from "@/app/components/funnel-progress";

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
    city: string | null;
    postal_code: string | null;
  };
};

function displayRegion(region: string) {
  if (region === "ILE DE FRANCE") return "Île-de-France";
  if (region === "PROVINCE") return "Province";
  return region;
}

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
            region,
            city,
            postal_code
          )
        `)
        .eq("id", id)
        .maybeSingle();

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
      <div className="min-h-screen bg-[#FAF8F5] pt-16 pb-32 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1278CC]" />
      </div>
    );
  }

  if (!stage) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] pt-16 pb-32 flex flex-col justify-center items-center px-4 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#00234b] mb-3">
          Stage introuvable
        </h1>
        <p className="text-gray-500">
          Le stage que vous recherchez n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <Link
          href="/recherche"
          className="mt-8 inline-flex items-center gap-2 bg-[#00234b] hover:bg-black text-white px-7 py-3 rounded-full font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la recherche
        </Link>
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

  // Location: only the city before payment. The street address is
  // shared after the booking is paid.
  const city = stage.auto_ecole?.city?.trim() || "";
  const postalCode = stage.auto_ecole?.postal_code?.trim() || "";
  const locationText = city
    ? `${city}${postalCode ? ` (${postalCode})` : ""}`
    : displayRegion(stage.auto_ecole?.region || "ILE DE FRANCE");

  // Derived attributes
  const isAuto = stage.title.toLowerCase().includes("automatique");
  const transmission = isAuto ? "Boîte automatique" : "Boîte manuelle";

  // Driving hours calculation from title (e.g. 30H -> 26H driving, 4H theory)
  const match = stage.stage_type?.match(/(\d+)H/);
  const totalHours = match ? parseInt(match[1]) : 30;
  const theoryHours = 4;
  const drivingHours = totalHours > theoryHours ? totalHours - theoryHours : totalHours;

  const practicalInfos = [
    { img: "/icons/driving.png", text: transmission },
    { img: "/icons/calendar.png", text: dateText },
    { img: "/icons/location-mark.png", text: locationText },
  ];

  const included = [
    `Durée du stage : ${diffDays} jours`,
    `${drivingHours}H de conduite`,
    `${theoryHours}H d'écoute pédagogique en voiture`,
    "1 moniteur unique",
    "1 date d'examen 100% garantie",
    "Délai : 3 à 10 jours après le stage ⚡",
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] pt-10 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <FunnelProgress current={2} />

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-[26px] sm:text-[34px] font-extrabold text-[#00234b] tracking-tight mb-2">
            Votre récapitulatif d&apos;inscription
          </h1>
          <p className="text-gray-600 text-[15px]">
            Vérifiez les caractéristiques de votre stage avant de continuer.
          </p>
        </div>

        {/* CARD */}
        <div className="max-w-[460px] mx-auto">
          <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-lg shadow-gray-200/60">
            {/* Price header */}
            <div className="bg-[#00234b] px-8 py-7 text-center">
              <h2 className="text-[15px] font-bold text-white/80 uppercase tracking-wider mb-2">
                {stage.stage_type || "Stage intensif"}
              </h2>
              <div className="text-[44px] font-extrabold text-white leading-none tracking-tight">
                {stage.price.toLocaleString("fr-FR")} €
              </div>
            </div>

            <div className="p-8">
              <div className="mb-7">
                <h3 className="font-extrabold text-[#00234b] text-[14.5px] mb-4">
                  Informations pratiques
                </h3>
                <ul className="space-y-3.5">
                  {practicalInfos.map(({ img, text }, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Image
                        src={img}
                        alt=""
                        width={30}
                        height={30}
                        className="flex-shrink-0"
                      />
                      <span className="text-[14.5px] text-gray-700 leading-relaxed pt-0.5">
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-gray-100 mb-7" />

              <div className="mb-7">
                <h3 className="font-extrabold text-[#00234b] text-[14.5px] mb-4">
                  Comprend
                </h3>
                <ul className="space-y-3">
                  {included.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-[#e5f4fd] flex items-center justify-center">
                        <Check className="w-3 h-3 text-[#1278CC]" strokeWidth={3} />
                      </span>
                      <span className="text-[14.5px] text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[12px] text-gray-400 text-center">
                Planning d&apos;heures communiqué avant le début du stage
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-4">
            <Link
              href={`/checkout/${stage.id}`}
              className="w-full flex items-center justify-center gap-2 bg-[#ffcb00] hover:bg-[#f0bd00] text-[#00234b] py-4 rounded-full font-extrabold text-[15px] transition-all shadow-xl shadow-amber-200/60 hover:-translate-y-0.5 active:translate-y-0"
            >
              Réserver ce stage
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center justify-center gap-2 text-[12px] text-gray-500">
              <ShieldCheck className="w-4 h-4 text-[#5FA82B]" />
              Paiement sécurisé — 4x sans frais possible
            </div>

            <div className="text-center">
              <Link
                href="/recherche"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-[#00234b] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Retour aux résultats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
