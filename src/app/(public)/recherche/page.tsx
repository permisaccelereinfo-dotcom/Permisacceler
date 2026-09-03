"use client";

import {
  useState,
  useEffect,
  useCallback,
  Suspense,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  MapPin,
  Calendar,
  Car,
  Loader2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Check,
  Hash,
  Search,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { FunnelProgress } from "@/app/components/funnel-progress";

type StageResult = {
  stage_id: string;
  stage_title: string;
  stage_description: string | null;
  license_type: string;
  start_date: string;
  end_date: string;
  price: number;
  max_students: number;
  enrolled_students: number;
  available_spots: number;
  auto_ecole_id: string;
  auto_ecole_name: string;
  auto_ecole_region: string;
  auto_ecole_rating: number;
  auto_ecole_city?: string;
  auto_ecole_postal_code?: string;
};

const OFFER_INCLUSIONS: Record<string, string[]> = {
  "Maxi stage 35H": [
    "31 heures de conduite",
    "Durée du stage : 15 jours",
    "Place d'examen sous 10 jours(1)",
    "1 moniteur unique",
    "1 date d'examen 100% garantie",
    "Délai : 3 à 10 jours après le stage",
  ],
  "Maxi stage 30H": [
    "26 heures de conduite",
    "Durée du stage : 8 jours",
    "Place d'examen sous 10 jours(1)",
    "1 moniteur unique",
    "1 date d'examen 100% garantie",
    "Délai : 3 à 10 jours après le stage",
  ],
  "Mini stage 10H": [
    "10 heures de conduite",
    "Durée du stage : 3 à 5 jours",
    "1 moniteur unique",
    "1 date d'examen 100% garantie",
    "Délai : 3 à 10 jours après le stage",
  ],
  "Représentation 6H": [
    "6 heures de conduite",
    "Durée du stage : 1 à 3 jours",
    "1 moniteur unique",
    "1 date d'examen 100% garantie",
    "Délai : 3 à 10 jours après le stage",
  ],
  "Stage passerelle": [
    "7 heures de conduite",
    "Durée : 1 journée",
    "1 moniteur unique",
    "Pas d'examen à repasser",
    "Édition du nouveau permis de conduire",
  ],
  "Conduite accompagnée 22H": [
    "20 heures de conduite",
    "Durée du stage : 5 jours",
    "1 moniteur unique",
    "2 RDV pédagogiques",
    "1 date d'examen 100% garantie",
  ],
  "Conduite accompagnée 13H": [
    "13 heures de conduite",
    "Durée du stage : 5 jours",
    "1 moniteur unique",
    "2 RDV pédagogiques",
    "1 date d'examen 100% garantie",
  ],
};

const DEFAULT_INCLUSIONS = [
  "6 heures de conduite",
  "Durée du stage : 1 à 5 jours",
  "Accompagnement jusqu'à l'examen",
  "1 date d'examen 100% garantie",
  "Délai : 1 à 9 jours après le stage",
];

function formatMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function parseMonthKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m };
}

function monthKeyToLabel(key: string) {
  const { year, month } = parseMonthKey(key);
  const d = new Date(year, month - 1, 1);
  const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function shiftMonthKey(key: string, delta: number) {
  const { year, month } = parseMonthKey(key);
  const d = new Date(year, month - 1 + delta, 1);
  return formatMonthKey(d.getFullYear(), d.getMonth() + 1);
}

function formatStageDateRange(startStr: string, endStr: string) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(start)} → ${fmt(end)}`;
}

function formatPrice(price: number) {
  return (
    price.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    "€"
  );
}

function daysUntil(dateStr: string) {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Bientôt";
  if (diff === 1) return "Demain";
  return `Dans ${diff} jours`;
}

function getDrivingHours(stageType: string): string {
  const match = OFFER_INCLUSIONS[stageType]?.[0];
  if (match) return match;
  return DEFAULT_INCLUSIONS[0];
}

function displayCity(city: string) {
  if (!city) return "Île-de-France";
  if (city === "ile_de_france") return "Île-de-France";
  if (city === "province") return "Province";
  return city.charAt(0).toUpperCase() + city.slice(1);
}

const CITY_OPTIONS = [
  { value: "ile_de_france", label: "Île-de-France" },
  { value: "province", label: "Province" },
] as const;

const TRANSMISSION_OPTIONS = [
  { value: "manuelle", label: "Boîte manuelle" },
  { value: "automatique", label: "Boîte automatique" },
] as const;

const STAGE_HOURS_OPTIONS = [
  { value: "4H", label: "4H" },
  { value: "6H", label: "6H" },
  { value: "10H", label: "10H" },
] as const;

function matchesStageHours(stage: StageResult, hours: string) {
  const needle = hours.toLowerCase();
  const hay = `${stage.stage_title} ${stage.stage_description ?? ""}`.toLowerCase();
  return hay.includes(needle);
}

function hoursFromUrlType(type: string): string {
  const match = type.match(/\b(4|6|10)\s*h\b/i);
  return match ? `${match[1]}H` : "";
}

type DropdownOption = { value: string; label: string };

function SearchDropdown({
  label,
  icon,
  value,
  options,
  placeholder,
  onChange,
  isOpen,
  onToggle,
  containerRef,
  withDivider,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  options: DropdownOption[];
  placeholder: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
  withDivider?: boolean;
}) {
  const selected = options.find((o) => o.value === value);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        minWidth: Math.max(rect.width, 220),
        zIndex: 9999,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  const menu =
    isOpen &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        data-dropdown-menu="true"
        style={menuStyle}
        className={`bg-white rounded-2xl border border-gray-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.18)] py-2 overflow-hidden ${
          options.length > 6 ? "max-h-72 overflow-y-auto" : ""
        }`}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`w-full text-left px-5 py-2.5 text-sm flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors whitespace-nowrap ${
              value === opt.value
                ? "bg-[#1278CC]/5 text-[#1278CC] font-bold"
                : "text-gray-700 font-medium"
            }`}
          >
            <span>{opt.label}</span>
            {value === opt.value && (
              <Check className="w-4 h-4 shrink-0 text-[#1278CC]" />
            )}
          </button>
        ))}
      </div>,
      document.body
    );

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 min-w-0 ${
        withDivider ? "border-b lg:border-b-0 lg:border-r border-gray-100" : ""
      }`}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        className="w-full flex flex-col px-5 lg:px-4 py-2 text-left group cursor-pointer hover:bg-gray-50/60 rounded-xl transition-colors"
      >
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#1278CC] mb-0.5 whitespace-nowrap">
          {label}
        </span>
        <span className="flex items-center w-full">
          <span className="text-gray-400 mr-2 shrink-0 group-hover:text-[#1278CC] transition-colors">
            {icon}
          </span>
          <span
            className={`flex-1 text-sm truncate ${
              selected ? "font-semibold text-gray-900" : "font-normal text-gray-500"
            }`}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 shrink-0 ml-2 group-hover:text-[#1278CC] transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>
      {menu}
    </div>
  );
}

function StageCardSkeleton() {
  return (
    <li className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden flex flex-col sm:flex-row animate-pulse">
      <div className="flex-1 p-5 sm:p-6 space-y-3">
        <div className="h-5 w-56 bg-gray-200 rounded" />
        <div className="h-3.5 w-40 bg-gray-100 rounded" />
        <div className="h-3.5 w-64 bg-gray-100 rounded" />
        <div className="h-3.5 w-48 bg-gray-100 rounded" />
        <div className="h-3.5 w-36 bg-gray-100 rounded" />
      </div>
      <div className="sm:w-[220px] shrink-0 p-5 sm:p-6 bg-[#FAF8F5] flex flex-col items-center justify-center gap-3">
        <div className="h-7 w-24 bg-gray-200 rounded" />
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
        <div className="h-10 w-full bg-gray-200 rounded-full" />
      </div>
    </li>
  );
}

function SearchContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [stages, setStages] = useState<StageResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const transmissionDropdownRef = useRef<HTMLDivElement>(null);
  const stageHoursDropdownRef = useRef<HTMLDivElement>(null);

  const [city, setCity] = useState(searchParams.get("city") || "ile_de_france");
  const [transmission, setTransmission] = useState("manuelle");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [maxPrice] = useState<number | null>(null);
  const [stageType, setStageType] = useState("");
  const [stageHours, setStageHours] = useState("");

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + i);
      const key = formatMonthKey(d.getFullYear(), d.getMonth() + 1);
      const label = monthKeyToLabel(key);
      return { key, label };
    });
  }, []);

  useEffect(() => {
    const urlCity = searchParams.get("city");
    const urlMonth = searchParams.get("month");
    const urlTransmission = searchParams.get("transmission");
    const urlType = searchParams.get("type");

    if (urlCity) setCity(urlCity);
    if (urlTransmission) {
      setTransmission(
        urlTransmission.toLowerCase().includes("auto") ? "automatique" : "manuelle"
      );
    }
    if (urlType) {
      const decoded = decodeURIComponent(urlType);
      setStageType(decoded);
      const fromUrl = hoursFromUrlType(decoded);
      if (fromUrl) setStageHours(fromUrl);
    }

    if (urlMonth) {
      const monthMap: Record<string, string> = {
        janvier: "01",
        février: "02",
        fevrier: "02",
        mars: "03",
        avril: "04",
        mai: "05",
        juin: "06",
        juillet: "07",
        août: "08",
        aout: "08",
        septembre: "09",
        octobre: "10",
        novembre: "11",
        décembre: "12",
        decembre: "12",
      };
      const parts = decodeURIComponent(urlMonth).trim().split(" ");
      if (parts.length === 2) {
        const monthStr = parts[0].toLowerCase();
        const yearStr = parts[1];
        if (monthMap[monthStr]) {
          setSelectedMonth(`${yearStr}-${monthMap[monthStr]}`);
        }
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedMonth && monthOptions.length > 0) {
      setSelectedMonth(monthOptions[0].key);
    }
  }, [selectedMonth, monthOptions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const refs = [cityDropdownRef, monthDropdownRef, transmissionDropdownRef, stageHoursDropdownRef];
      const clickedInside = refs.some((ref) => ref.current?.contains(target));

      // Also check if the click is inside a dropdown menu (portaled element)
      const menuElement = document.querySelector('[data-dropdown-menu="true"]');
      const isInsideMenu = menuElement?.contains(target) ?? false;

      if (!clickedInside && !isInsideMenu) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const enrichStages = useCallback(
    async (raw: StageResult[]) => {
      if (!raw.length) return raw;
      const ids = [...new Set(raw.map((s) => s.auto_ecole_id))];
      const { data: schools } = await supabase
        .from("auto_ecoles")
        .select("id, city, postal_code")
        .in("id", ids);

      const byId = new Map((schools || []).map((s) => [s.id, s]));
      return raw.map((stage) => {
        const school = byId.get(stage.auto_ecole_id);
        return {
          ...stage,
          auto_ecole_city: school?.city || undefined,
          auto_ecole_postal_code: school?.postal_code || undefined,
        };
      });
    },
    [supabase]
  );

  const searchStages = useCallback(async () => {
    setLoading(true);

    try {
      let monthStart: string | null = null;
      let monthEnd: string | null = null;

      if (selectedMonth) {
        const [year, month] = selectedMonth.split("-");
        monthStart = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        monthEnd = `${year}-${month}-${lastDay}`;
      }

      let formattedRegion = city || null;
      if (formattedRegion) {
        const lowerRegion = formattedRegion.toLowerCase();
        if (lowerRegion.includes("ile") || lowerRegion.includes("île")) {
          formattedRegion = "ILE DE FRANCE";
        } else if (lowerRegion.includes("province")) {
          formattedRegion = "PROVINCE";
        }
      }

      const { data, error } = await supabase.rpc("search_stages", {
        search_region: formattedRegion,
        search_stage_type: stageType || null,
        search_license_type: null,
        search_start_date: monthStart,
        search_end_date: monthEnd,
        max_price: maxPrice,
      });

      let filteredData: StageResult[] = data || [];

      if (transmission && filteredData.length > 0) {
        const transmissionKeyword =
          transmission === "automatique" ? "automatique" : "manuelle";
        const oppositeKeyword =
          transmission === "automatique" ? "manuelle" : "automatique";
        filteredData = filteredData.filter((stage) => {
          const desc = (stage.stage_description || "").toLowerCase();
          const title = (stage.stage_title || "").toLowerCase();
          const hasRequested =
            desc.includes(transmissionKeyword) || title.includes(transmissionKeyword);
          const hasOpposite =
            desc.includes(oppositeKeyword) || title.includes(oppositeKeyword);
          return (
            hasRequested ||
            (!hasRequested && !hasOpposite && transmission === "manuelle")
          );
        });
      }

      if (stageHours && filteredData.length > 0) {
        filteredData = filteredData.filter((stage) => matchesStageHours(stage, stageHours));
      } else if (stageType && filteredData.length > 0) {
        filteredData = filteredData.filter((stage) =>
          (stage.stage_title || "").toLowerCase().includes(stageType.toLowerCase())
        );
      }

      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("stages")
          .select(
            `
            id,
            title,
            description,
            license_type,
            start_date,
            end_date,
            price,
            max_students,
            enrolled_students,
            auto_ecole:auto_ecole_id (
              id,
              name,
              region,
              city,
              postal_code
            )
          `
          )
          .eq("is_available", true)
          .eq("status", "active");

        if (fallbackError) throw fallbackError;

        type FallbackRow = {
          id: string;
          title: string;
          description: string | null;
          license_type: string;
          start_date: string;
          end_date: string;
          price: number;
          max_students: number;
          enrolled_students: number;
          auto_ecole: {
            id: string;
            name: string;
            region: string;
            city: string;
            postal_code: string;
          };
        };

        let filteredFallback =
          (fallbackData as unknown as FallbackRow[] | null) || [];

        if (formattedRegion) {
          filteredFallback = filteredFallback.filter(
            (stage) => stage.auto_ecole?.region === formattedRegion
          );
        }

        if (monthStart && monthEnd) {
          filteredFallback = filteredFallback.filter((stage) => {
            return stage.start_date >= monthStart! && stage.start_date <= monthEnd!;
          });
        }

        if (transmission) {
          const keyword = transmission === "automatique" ? "automatique" : "manuelle";
          const oppositeKeyword =
            transmission === "automatique" ? "manuelle" : "automatique";
          filteredFallback = filteredFallback.filter((stage) => {
            const desc = (stage.description || "").toLowerCase();
            const title = (stage.title || "").toLowerCase();
            const hasRequested = desc.includes(keyword) || title.includes(keyword);
            const hasOpposite =
              desc.includes(oppositeKeyword) || title.includes(oppositeKeyword);
            return (
              hasRequested ||
              (!hasRequested && !hasOpposite && transmission === "manuelle")
            );
          });
        }

        if (stageHours && filteredFallback.length > 0) {
          filteredFallback = filteredFallback.filter((stage) =>
            matchesStageHours(
              {
                stage_id: stage.id,
                stage_title: stage.title,
                stage_description: stage.description,
              } as StageResult,
              stageHours
            )
          );
        } else if (stageType && filteredFallback.length > 0) {
          filteredFallback = filteredFallback.filter((stage) =>
            (stage.title || "").toLowerCase().includes(stageType.toLowerCase())
          );
        }

        const transformed: StageResult[] = filteredFallback.map((stage) => ({
          stage_id: stage.id,
          stage_title: stage.title,
          stage_description: stage.description,
          license_type: stage.license_type,
          start_date: stage.start_date,
          end_date: stage.end_date,
          price: stage.price,
          max_students: stage.max_students,
          enrolled_students: stage.enrolled_students,
          available_spots: stage.max_students - stage.enrolled_students,
          auto_ecole_id: stage.auto_ecole.id,
          auto_ecole_name: stage.auto_ecole.name,
          auto_ecole_region: stage.auto_ecole.region,
          auto_ecole_rating: 0,
          auto_ecole_city: stage.auto_ecole.city,
          auto_ecole_postal_code: stage.auto_ecole.postal_code,
        }));

        setStages(transformed);
      } else {
        setStages(await enrichStages(filteredData));
      }
    } catch (error) {
      console.error(
        "Error fetching stages:",
        error instanceof Error ? error.message : JSON.stringify(error),
        error
      );
    } finally {
      setLoading(false);
    }
  }, [
    supabase,
    city,
    transmission,
    selectedMonth,
    maxPrice,
    stageType,
    stageHours,
    enrichStages,
  ]);

  useEffect(() => {
    searchStages();
  }, [searchStages]);

  const offerKey =
    stageHours === "10H"
      ? "Mini stage 10H"
      : stageHours === "6H"
        ? "Représentation 6H"
        : stageType;

  const offerInclusions = DEFAULT_INCLUSIONS;

  const transmissionLabel =
    TRANSMISSION_OPTIONS.find((o) => o.value === transmission)?.label ?? "Boîte manuelle";

  const visibleMonthLabel = selectedMonth ? monthKeyToLabel(selectedMonth) : "";

  const toggleDropdown = (id: string) => {
    setOpenDropdown((current) => (current === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pt-10 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FunnelProgress current={1} />

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[26px] sm:text-[34px] font-extrabold text-[#00234b] tracking-tight mb-2">
            Quand souhaitez-vous faire votre stage ?
          </h1>
          <p className="text-gray-600 text-[15px]">
            Choisissez la date qui vous convient — les places partent vite.
          </p>
        </div>

        {/* Search bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-10 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl lg:rounded-full shadow-xl shadow-gray-200/60 p-2 flex flex-col lg:flex-row items-stretch lg:items-center flex-1 gap-1 lg:gap-0">
            <SearchDropdown
              label="Lieu du stage"
              icon={<MapPin className="w-4 h-4" />}
              value={city}
              options={[...CITY_OPTIONS]}
              placeholder="Choisir..."
              onChange={(value) => {
                setCity(value);
                setOpenDropdown(null);
              }}
              isOpen={openDropdown === "city"}
              onToggle={() => toggleDropdown("city")}
              containerRef={cityDropdownRef}
              withDivider
            />

            <SearchDropdown
              label="Date de début"
              icon={<Calendar className="w-4 h-4" />}
              value={selectedMonth}
              options={monthOptions.map((o) => ({ value: o.key, label: o.label }))}
              placeholder="Choisir..."
              onChange={(key) => {
                setSelectedMonth(key);
                setOpenDropdown(null);
              }}
              isOpen={openDropdown === "month"}
              onToggle={() => toggleDropdown("month")}
              containerRef={monthDropdownRef}
              withDivider
            />

            <SearchDropdown
              label="Boîte de vitesse"
              icon={<Car className="w-4 h-4" />}
              value={transmission}
              options={[...TRANSMISSION_OPTIONS]}
              placeholder="Choisir..."
              onChange={(value) => {
                setTransmission(value);
                setOpenDropdown(null);
              }}
              isOpen={openDropdown === "transmission"}
              onToggle={() => toggleDropdown("transmission")}
              containerRef={transmissionDropdownRef}
              withDivider
            />

            <SearchDropdown
              label="Type de stage"
              icon={<Clock className="w-4 h-4" />}
              value={stageHours}
              options={[...STAGE_HOURS_OPTIONS]}
              placeholder="Choisir..."
              onChange={(value) => {
                setStageHours(value);
                setOpenDropdown(null);
              }}
              isOpen={openDropdown === "stageHours"}
              onToggle={() => toggleDropdown("stageHours")}
              containerRef={stageHoursDropdownRef}
            />
          </div>

          <button
            type="button"
            onClick={() => searchStages()}
            disabled={loading}
            className="bg-[#00234b] hover:bg-black text-white rounded-xl lg:rounded-full px-8 py-4 font-bold transition-all flex items-center justify-center gap-2 shadow-xl hover:-translate-y-0.5 active:translate-y-0 lg:shrink-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Rechercher</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar — after the results on mobile, left column on desktop */}
          <aside className="w-full lg:w-[280px] shrink-0 order-last lg:order-first">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
                <h2 className="text-sm font-extrabold text-[#00234b] mb-4">
                  Inclus dans l&apos;offre
                </h2>
                <ul className="space-y-3">
                  {offerInclusions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-[#e5f4fd] flex items-center justify-center shrink-0 mt-[-1px]">
                        <Check className="w-3 h-3 text-[#1278CC]" strokeWidth={3} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 p-4 flex items-center gap-3 shadow-sm">
                <Image
                  src="/icons/money.png"
                  alt=""
                  width={40}
                  height={40}
                  className="shrink-0"
                />
                <p className="text-[12px] text-gray-600 leading-snug">
                  Paiement en 4x sans frais possible
                </p>
              </div>
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1 min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-[13px] text-gray-500 mb-1">
                  {loading
                    ? "Recherche en cours..."
                    : `${stages.length} stage${stages.length > 1 ? "s" : ""} disponible${stages.length > 1 ? "s" : ""}`}
                </p>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#00234b]">
                    {visibleMonthLabel}
                  </h2>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        selectedMonth && setSelectedMonth(shiftMonthKey(selectedMonth, -1))
                      }
                      className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:border-[#1278CC] hover:text-[#1278CC] text-gray-700 transition-colors shadow-sm"
                      aria-label="Mois précédent"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        selectedMonth && setSelectedMonth(shiftMonthKey(selectedMonth, 1))
                      }
                      className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:border-[#1278CC] hover:text-[#1278CC] text-gray-700 transition-colors shadow-sm"
                      aria-label="Mois suivant"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <ul className="space-y-4">
                <StageCardSkeleton />
                <StageCardSkeleton />
                <StageCardSkeleton />
              </ul>
            ) : stages.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
                <Image
                  src="/icons/Search.png"
                  alt=""
                  width={64}
                  height={64}
                  className="mx-auto mb-4"
                />
                <p className="text-[#00234b] font-bold mb-1">
                  Aucun stage trouvé pour ces critères
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Essayez un autre mois ou modifiez vos filtres.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    selectedMonth && setSelectedMonth(shiftMonthKey(selectedMonth, 1))
                  }
                  className="inline-flex items-center gap-2 bg-[#00234b] hover:bg-black text-white rounded-full px-6 py-3 text-sm font-bold transition-colors"
                >
                  Voir le mois suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {stages.map((stage, index) => {
                  const locationCity =
                    stage.auto_ecole_city || displayCity(city);
                  const postalCode =
                    stage.auto_ecole_postal_code ||
                    (stage.auto_ecole_region === "ILE DE FRANCE"
                      ? String(75000 + (index % 20) * 100)
                      : String(30000 + (index % 50) * 1000));
                  const spots = stage.available_spots;
                  const lowSpots = typeof spots === "number" && spots > 0 && spots <= 3;

                  return (
                    <li
                      key={stage.stage_id}
                      className="group bg-white rounded-2xl border border-gray-200/80 overflow-hidden flex flex-col sm:flex-row shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:border-[#1278CC]/30 transition-all duration-200"
                    >
                      {/* Left: details */}
                      <div className="flex-1 p-5 sm:p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <Image
                            src="/icons/calendar.png"
                            alt=""
                            width={38}
                            height={38}
                            className="shrink-0"
                          />
                          <p className="text-[17px] sm:text-[18px] font-extrabold tracking-tight text-[#00234b]">
                            {formatStageDateRange(stage.start_date, stage.end_date)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                            <Image
                              src="/icons/alarm-clock.png"
                              alt=""
                              width={16}
                              height={16}
                            />
                            {daysUntil(stage.start_date)}
                          </span>
                          {lowSpots ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full shadow-sm">
                              <span className="relative flex w-2 h-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
                                <span className="relative inline-flex w-2 h-2 rounded-full bg-amber-500" />
                              </span>
                              Plus que {spots} place{spots > 1 ? "s" : ""} !
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-800 bg-gradient-to-b from-green-50 to-emerald-100/70 border border-green-300/70 px-3 py-1 rounded-full shadow-sm">
                              <span className="relative flex w-2 h-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                                <span className="relative inline-flex w-2 h-2 rounded-full bg-green-500" />
                              </span>
                              Places disponibles
                            </span>
                          )}
                        </div>

                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                          <li className="flex items-center gap-2.5 text-[13px] text-gray-700">
                            <MapPin className="w-4 h-4 text-[#1278CC]/70 shrink-0" />
                            {locationCity}
                          </li>
                          <li className="flex items-center gap-2.5 text-[13px] text-gray-700">
                            <Hash className="w-4 h-4 text-[#1278CC]/70 shrink-0" />
                            {postalCode}
                          </li>
                          <li className="flex items-center gap-2.5 text-[13px] text-gray-700">
                            <Car className="w-4 h-4 text-[#1278CC]/70 shrink-0" />
                            {transmissionLabel}
                          </li>
                          <li className="flex items-center gap-2.5 text-[13px] text-gray-700">
                            <Clock className="w-4 h-4 text-[#1278CC]/70 shrink-0" />
                            {stageHours
                              ? `${stageHours.replace("H", "")} heures de conduite`
                              : getDrivingHours(offerKey)}
                          </li>
                        </ul>
                      </div>

                      {/* Right: price & CTA */}
                      <div className="sm:w-[210px] md:w-[230px] shrink-0 p-5 sm:p-6 flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-gray-200/80 bg-[#FAF8F5]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                          Dès
                        </span>
                        <p className="text-[24px] sm:text-[26px] font-extrabold tracking-tight text-[#00234b] mb-2">
                          {formatPrice(stage.price)}
                        </p>
                        <span className="text-[10px] font-bold text-white uppercase tracking-wide px-3 py-1 rounded-full bg-[#5FA82B] mb-4">
                          4x sans frais
                        </span>
                        <Link
                          href={`/stage/${stage.stage_id}`}
                          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-full bg-[#ffcb00] hover:bg-[#f0bd00] text-[#00234b] text-[13px] font-extrabold transition-all shadow-md shadow-amber-200/60 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                        >
                          Réserver
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#1278CC]" />
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
