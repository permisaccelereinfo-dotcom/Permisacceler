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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Check,
  BookOpen,
  Hash,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

const BRAND_BLUE = "#1278CC";
const BRAND_BLUE_HOVER = "#0A5CA6";
const GREEN_BADGE = "#5FA82B";
const BEIGE_BG = "#F8F6F2";
const BEIGE_PANEL = "#EDE8E0";

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
  auto_ecole_address?: string;
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
  "31 heures de conduite",
  "Durée du stage : 15 jours",
  "Place d'examen sous 10 jours(1)",
  "1 moniteur unique",
  "1 date d'examen 100% garantie",
  "Délai : 3 à 10 jours après le stage",
];

const METRO_LINES = [
  "République - Métro 5 & 3 & 8 & 9 & 11",
  "Nation - Métro 1 & 2 & 6 & 9",
  "Châtelet - Métro 1 & 4 & 7 & 11 & 14",
  "Gare du Nord - RER B & D & E",
  "Montparnasse - Métro 4 & 6 & 12 & 13",
  "Bastille - Métro 1 & 5 & 8",
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
  return "31 heures de conduite";
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
  minWidthClass,
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
  minWidthClass?: string;
}) {
  const selected = options.find((o) => o.value === value);
  const isWide = Boolean(minWidthClass);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: rect.width,
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
        className={`bg-white rounded-lg border border-gray-200 shadow-lg py-1 ${
          options.length > 6 ? "max-h-64 overflow-y-auto" : ""
        }`}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 whitespace-nowrap ${
              value === opt.value ? "font-semibold text-gray-900" : "text-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>,
      document.body
    );

  return (
    <div
      className={`relative shrink-0 ${minWidthClass ?? "w-fit"}`}
      ref={containerRef}
    >
      <label className="block text-[11px] font-semibold text-gray-500 mb-1 whitespace-nowrap">
        {label}
      </label>
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        className={`inline-flex items-center gap-1.5 bg-white rounded-lg border border-gray-200/80 px-2.5 py-2 text-left whitespace-nowrap ${
          isWide ? "w-full justify-between" : ""
        }`}
      >
        {icon}
        <span
          className={`text-sm ${
            selected ? "font-medium text-gray-900" : "font-normal text-gray-500"
          }`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {menu}
    </div>
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
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
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
        .select("id, city, address, postal_code")
        .in("id", ids);

      const byId = new Map((schools || []).map((s) => [s.id, s]));
      return raw.map((stage) => {
        const school = byId.get(stage.auto_ecole_id);
        return {
          ...stage,
          auto_ecole_city: school?.city || undefined,
          auto_ecole_address: school?.address || undefined,
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
              address,
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
            address: string;
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
          auto_ecole_address: stage.auto_ecole.address,
          auto_ecole_postal_code: stage.auto_ecole.postal_code,
        }));

        setStages(transformed);
      } else {
        setStages(await enrichStages(filteredData));
      }
    } catch (error) {
      console.error("Error fetching stages:", error);
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

  const offerInclusions = offerKey
    ? OFFER_INCLUSIONS[offerKey] || DEFAULT_INCLUSIONS
    : DEFAULT_INCLUSIONS;

  const transmissionLabel =
    TRANSMISSION_OPTIONS.find((o) => o.value === transmission)?.label ?? "Boîte manuelle";

  const visibleMonthLabel = selectedMonth ? monthKeyToLabel(selectedMonth) : "";

  const toggleDropdown = (id: string) => {
    setOpenDropdown((current) => (current === id ? null : id));
  };

  return (
    <div className="min-h-screen pt-16 pb-20" style={{ backgroundColor: BEIGE_BG }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress */}
        <div className="flex flex-col items-center justify-center mb-10 pt-4">
          <span className="text-gray-400 text-sm mb-4">Dates</span>
          <div className="flex gap-2 sm:gap-4 items-center">
            <div className="w-8 sm:w-12 h-1 rounded-full" style={{ backgroundColor: BRAND_BLUE }} />
            <div className="w-8 sm:w-12 h-1 rounded-full" style={{ backgroundColor: BRAND_BLUE }} />
            <div className="w-8 sm:w-12 h-1 rounded-full" style={{ backgroundColor: BRAND_BLUE }} />
            <div className="w-8 sm:w-12 h-1 bg-gray-200 rounded-full" />
            <div className="w-8 sm:w-12 h-1 bg-gray-200 rounded-full" />
            <div className="w-8 sm:w-12 h-1 bg-gray-200 rounded-full" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-[28px] sm:text-[36px] font-semibold text-gray-900 mb-3 tracking-tight"
            style={{ fontFamily: "var(--ds-nb---font--primary)" }}
          >
            Quand souhaitez-vous faire votre stage ?
          </h1>
        </div>

        {/* Search bar */}
        <div
          className="rounded-xl px-4 py-3 mb-8 flex flex-nowrap items-end gap-x-3 overflow-visible"
          style={{ backgroundColor: BEIGE_PANEL }}
        >
          <SearchDropdown
            label="Lieu du stage"
            minWidthClass="min-w-[16rem]"
            icon={<MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
            value={city}
            options={[...CITY_OPTIONS]}
            placeholder="Sélectionnez..."
            onChange={(value) => {
              setCity(value);
              setOpenDropdown(null);
            }}
            isOpen={openDropdown === "city"}
            onToggle={() => toggleDropdown("city")}
            containerRef={cityDropdownRef}
          />

          <SearchDropdown
            label="Date de démarrage"
            minWidthClass="min-w-[13.5rem]"
            icon={<Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
            value={selectedMonth}
            options={monthOptions.map((o) => ({ value: o.key, label: o.label }))}
            placeholder="Sélectionnez..."
            onChange={(key) => {
              setSelectedMonth(key);
              setOpenDropdown(null);
            }}
            isOpen={openDropdown === "month"}
            onToggle={() => toggleDropdown("month")}
            containerRef={monthDropdownRef}
          />

          <SearchDropdown
            label="Boîte de vitesse"
            minWidthClass="min-w-[13.5rem]"
            icon={<Car className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
            value={transmission}
            options={[...TRANSMISSION_OPTIONS]}
            placeholder="Sélectionnez..."
            onChange={(value) => {
              setTransmission(value);
              setOpenDropdown(null);
            }}
            isOpen={openDropdown === "transmission"}
            onToggle={() => toggleDropdown("transmission")}
            containerRef={transmissionDropdownRef}
          />

          <SearchDropdown
            label="Type de stage"
            minWidthClass="min-w-[9rem]"
            icon={<Layers className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
            value={stageHours}
            options={[...STAGE_HOURS_OPTIONS]}
            placeholder="Sélectionnez..."
            onChange={(value) => {
              setStageHours(value);
              setOpenDropdown(null);
            }}
            isOpen={openDropdown === "stageHours"}
            onToggle={() => toggleDropdown("stageHours")}
            containerRef={stageHoursDropdownRef}
          />

          <button
            type="button"
            onClick={() => searchStages()}
            className="shrink-0 px-4 py-2 rounded-lg text-white text-sm font-semibold whitespace-nowrap transition-colors"
            style={{ backgroundColor: BRAND_BLUE }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = BRAND_BLUE_HOVER;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = BRAND_BLUE;
            }}
          >
            Rechercher
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND_BLUE }} />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Sidebar */}
            <aside className="w-full lg:w-[280px] shrink-0 space-y-4">
              <div
                className="rounded-xl p-5"
                style={{ backgroundColor: BEIGE_PANEL }}
              >
                <h2 className="text-sm font-bold text-gray-900 mb-4">
                  Inclus dans l&apos;offre :
                </h2>
                <ul className="space-y-2.5">
                  {offerInclusions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] text-gray-700">
                      <Check className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-xl border border-gray-200/80 p-4 flex gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
                  style={{ backgroundColor: "#1278CC" }}
                >
                  CPF
                </div>
                <p className="text-[12px] text-gray-600 leading-snug">
                  Financement avec votre CPF (demandeurs d&apos;emploi)
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200/80 p-4 flex gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                  style={{ backgroundColor: "#E91E8C" }}
                >
                  4x
                </div>
                <p className="text-[12px] text-gray-600 leading-snug">
                  Paiement en 4x sans frais possible
                </p>
              </div>
            </aside>

            {/* Results */}
            <main className="flex-1 min-w-0">
              {stages.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200/80">
                  <p className="text-gray-500">Aucun stage trouvé pour ces critères.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                    <div>
                      <p className="text-[13px] text-gray-500 mb-1">
                        {stages.length} stage{stages.length > 1 ? "s" : ""} disponible
                        {stages.length > 1 ? "s" : ""}
                      </p>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                          {visibleMonthLabel}
                        </h2>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              selectedMonth && setSelectedMonth(shiftMonthKey(selectedMonth, -1))
                            }
                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                            aria-label="Mois précédent"
                          >
                            <ChevronLeft className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              selectedMonth && setSelectedMonth(shiftMonthKey(selectedMonth, 1))
                            }
                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                            aria-label="Mois suivant"
                          >
                            <ChevronRight className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-4">
                    {stages.map((stage, index) => {
                      const locationCity =
                        stage.auto_ecole_city || displayCity(city);
                      const metroLine =
                        stage.auto_ecole_address ||
                        METRO_LINES[index % METRO_LINES.length];
                      const postalCode =
                        stage.auto_ecole_postal_code ||
                        (stage.auto_ecole_region === "ILE DE FRANCE"
                          ? String(75000 + (index % 20) * 100)
                          : String(30000 + (index % 50) * 1000));

                      return (
                        <li
                          key={stage.stage_id}
                          className="bg-white rounded-xl border border-gray-200/90 overflow-hidden flex flex-col sm:flex-row"
                        >
                          {/* Left: details */}
                          <div className="flex-1 p-5 sm:p-6 sm:border-r border-gray-200/90">
                            <p className="text-[17px] sm:text-[18px] font-bold text-gray-900 mb-4">
                              {formatStageDateRange(stage.start_date, stage.end_date)}
                            </p>

                            <ul className="space-y-2 mb-5">
                              <li className="flex items-center gap-2.5 text-[13px] text-gray-700">
                                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                {locationCity}
                              </li>
                              <li className="flex items-start gap-2.5 text-[13px] text-gray-700">
                                <BookOpen className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{metroLine}</span>
                              </li>
                              <li className="flex items-center gap-2.5 text-[13px] text-gray-700">
                                <Hash className="w-4 h-4 text-gray-400 shrink-0" />
                                {postalCode}
                              </li>
                              <li className="flex items-center gap-2.5 text-[13px] text-gray-700">
                                <Car className="w-4 h-4 text-gray-400 shrink-0" />
                                {transmissionLabel}
                              </li>
                              <li className="flex items-center gap-2.5 text-[13px] text-gray-700">
                                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                                {stageHours
                                  ? `${stageHours.replace("H", "")} heures de conduite`
                                  : getDrivingHours(offerKey)}
                              </li>
                            </ul>

                            <p className="text-[12px] text-gray-400">
                              {daysUntil(stage.start_date)}
                            </p>
                          </div>

                          {/* Right: price & CTA */}
                          <div className="sm:w-[200px] md:w-[220px] shrink-0 p-5 sm:p-6 flex flex-col items-center justify-center border-t sm:border-t-0 border-gray-200/90 bg-[#fafafa]/50">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                              Dès
                            </span>
                            <p className="text-[22px] sm:text-[24px] font-bold text-gray-900 mb-3">
                              {formatPrice(stage.price)}
                            </p>
                            <span
                              className="text-[10px] font-bold text-white uppercase tracking-wide px-3 py-1 rounded mb-4"
                              style={{ backgroundColor: GREEN_BADGE }}
                            >
                              4x sans frais
                            </span>
                            <Link
                              href={`/stage/${stage.stage_id}`}
                              className="w-full text-center py-2.5 rounded-lg text-white text-[13px] font-semibold transition-colors"
                              style={{ backgroundColor: BRAND_BLUE }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = BRAND_BLUE_HOVER;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = BRAND_BLUE;
                              }}
                            >
                              RESERVER
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: BEIGE_BG }}
        >
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: BRAND_BLUE }} />
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
