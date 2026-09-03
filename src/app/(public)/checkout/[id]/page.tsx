"use client";

import { useEffect, useState, useMemo, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { AlertCircle, Check, Loader2, Lock } from "lucide-react";
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
  };
};

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] focus:outline-none focus:border-[#1278CC] focus:ring-2 focus:ring-[#1278CC]/15 transition-shadow";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-[#00234b] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function ChoiceGroup({
  name,
  value,
  options,
  onSelect,
}: {
  name: string;
  value: string;
  options: { id: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <label
            key={option.id}
            className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
              selected
                ? "border-[#1278CC] bg-[#e5f4fd]"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span
              className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                selected ? "border-[#1278CC] bg-[#1278CC]" : "border-gray-300 bg-white"
              }`}
            >
              {selected && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
            </span>
            <span
              className={`text-[14px] leading-snug ${
                selected ? "font-semibold text-[#00234b]" : "text-gray-700"
              }`}
            >
              {option.label}
            </span>
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={selected}
              onChange={() => onSelect(option.id)}
              className="hidden"
            />
          </label>
        );
      })}
    </div>
  );
}

function ChoiceList({
  name,
  value,
  options,
  onSelect,
}: {
  name: string;
  value: string;
  options: { id: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <label
            key={option.id}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 cursor-pointer transition-colors ${
              selected
                ? "border-[#1278CC] bg-[#e5f4fd]"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span
              className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                selected ? "border-[#1278CC] bg-[#1278CC]" : "border-gray-300 bg-white"
              }`}
            >
              {selected && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
            </span>
            <span
              className={`text-[14.5px] leading-snug ${
                selected ? "font-semibold text-[#00234b]" : "text-gray-700"
              }`}
            >
              {option.label}
            </span>
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={selected}
              onChange={() => onSelect(option.id)}
              className="hidden"
            />
          </label>
        );
      })}
    </div>
  );
}

const YES_NO = [
  { id: "oui", label: "Oui" },
  { id: "non", label: "Non" },
];

export default function CheckoutPage() {
  const params = useParams();
  const id = params?.id as string;

  const [stage, setStage] = useState<StageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  // Stable client — must not be recreated on every render
  const supabase = useMemo(() => createClient(), []);

  // Form State
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    password: "",
    dateNaissance: "",
    villeNaissance: "",
    adresse: "",
    complementAdresse: "",
    codePostal: "",

    // Questions
    handicap: "",
    dejaPassePermis: "",
    aLeCode: "",
    neph: "",

    // Raison
    raison: "",

    // Attestation
    attestation20h: false,
  });

  useEffect(() => {
    async function loadData() {
      if (!id) return;

      // 1. Check Auth — getSession() reads from local storage instantly
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user ?? null;

      if (authUser) {
        // 2. Fetch full profile from public.users
        // Use limit(1) instead of single() to avoid crashing on duplicate rows
        const { data: userRows, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .limit(1);
        const userData = userRows?.[0] ?? null;

        if (profileError) {
          console.error("[Checkout] Failed to load user profile:", profileError.message);
        }

        // Even if profile query fails, mark as logged-in using auth data
        // so the password field is always hidden for authenticated users
        const profile = userData ?? null;
        setUser(profile ?? { id: authUser.id, email: authUser.email });

        const reasonMap: Record<string, string> = {
          "annulation": "annulation",
          "pas-de-date": "pas_de_date",
          "manque-temps": "manque_temps",
          "echec": "representation",
        };

        const nameParts = profile?.name?.split(" ") ?? [];

        setFormData(prev => ({
          ...prev,
          prenom: nameParts[0] || "",
          nom: nameParts.slice(1).join(" ") || "",
          email: profile?.email || authUser.email || "",
          telephone: profile?.phone || "",
          // Birth & address fields (from saved profile)
          dateNaissance: profile?.date_naissance || "",
          villeNaissance: profile?.ville_naissance || "",
          adresse: profile?.adresse || "",
          complementAdresse: profile?.complement_adresse || "",
          codePostal: profile?.code_postal || "",
          // Driving-specific fields
          raison: profile?.reason ? reasonMap[profile.reason] ?? "" : "",
          dejaPassePermis: profile?.has_permit === true ? "oui" : profile?.has_permit === false && profile?.has_permit !== null ? "non" : "",
          aLeCode: profile?.has_code === true ? "oui" : profile?.has_code === false && profile?.has_code !== null ? "non" : "",
          neph: profile?.neph_number || "",
        }));
      }

      // 2. Fetch Stage
      const { data: stageData } = await supabase
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

      if (stageData) {
        setStage(stageData as any);
      }

      setLoading(false);
    }

    loadData();
  }, [id, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1278CC]" />
      </div>
    );
  }

  if (!stage) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center px-4 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#00234b] mb-3">Erreur</h1>
        <p className="text-gray-500">Stage introuvable.</p>
        <button
          onClick={() => window.history.back()}
          className="mt-8 bg-[#00234b] hover:bg-black text-white px-7 py-3 rounded-full font-bold transition-colors"
        >
          Retour
        </button>
      </div>
    );
  }

  // Format details for cart
  const start = new Date(stage.start_date);
  const end = new Date(stage.end_date);
  const startStr = `${start.getDate() === 1 ? '1er' : start.getDate()} ${start.toLocaleDateString('fr-FR', { month: 'short' })}`;
  const endStr = `${end.getDate() === 1 ? '1er' : end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'short' })}`;
  const isAuto = stage.title.toLowerCase().includes("automatique");
  const transmission = isAuto ? "Boîte Automatique" : "Boîte Manuelle";

  const region = stage.auto_ecole?.region || "";
  const locationText =
    [stage.auto_ecole?.name, region].filter(Boolean).join(" - ") ||
    "Lieu communiqué après réservation";

  // Pricing
  const optionsPrice = 65;
  const totalPrice = stage.price + optionsPrice;
  // approximate TVA 20%
  const tva = Math.round((totalPrice - (totalPrice / 1.2)) * 100) / 100;

  const handleCheckout = async () => {
    setLoadingSubmit(true);
    setErrorMsg(null);
    let finalUserId = user?.id;

    try {
      // 0. Validation
      if (!formData.raison) {
        throw new Error("Veuillez sélectionner une raison pour votre permis accéléré.");
      }
      if (!formData.attestation20h) {
        throw new Error(
          "Veuillez attester avoir déjà effectué 20h de conduite dans une école de conduite."
        );
      }
      if (!/^\d{12}$/.test(formData.neph.trim())) {
        throw new Error("Veuillez renseigner votre numéro NEPH (12 chiffres).");
      }

      // 1. If not logged in, create account
      if (!user) {
        if (!formData.email || !formData.password || !formData.prenom || !formData.nom) {
          throw new Error("Veuillez remplir vos informations personnelles et créer un mot de passe.");
        }
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: `${formData.prenom} ${formData.nom}`.trim(),
              phone: formData.telephone,
            },
          },
        });

        if (signUpError) throw new Error(signUpError.message);
        if (!authData.user) throw new Error("Erreur lors de la création du compte.");

        // When email confirmation is enabled in Supabase, signUp returns no
        // session. Without a session the profile insert and the checkout API
        // call (which requires getUser) would fail, so stop with a clear
        // message instead of an opaque 401.
        if (!authData.session) {
          throw new Error(
            "Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse, puis reconnectez-vous pour finaliser votre réservation."
          );
        }

        finalUserId = authData.user.id;

        // The on_auth_user_created DB trigger already inserted the profile row,
        // so upsert (a plain insert would fail on the primary key) — this also
        // keeps the flow working in environments missing the trigger.
        const { error: profileError } = await supabase.from("users").upsert({
          id: finalUserId,
          email: formData.email,
          name: `${formData.prenom} ${formData.nom}`.trim(),
          phone: formData.telephone,
          role: 'student'
        }, { onConflict: 'id' });

        if (profileError) console.error("Could not create user profile:", profileError);
      }

      // 2. Call our API to create Stripe Checkout Session.
      // Never send the account password to the server / database
      // (JSON.stringify drops the `undefined` value).
      const safeFormData = { ...formData, password: undefined };
      const res = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: stage.id,
          formData: safeFormData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur s'est produite lors de la redirection.");

      // 3. Redirect to Stripe Checkout URL
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Une erreur inattendue s'est produite.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pt-10 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FunnelProgress current={3} />

        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-[26px] sm:text-[34px] font-extrabold text-[#00234b] tracking-tight mb-2">
            Vos informations sont-elles correctes ?
          </h1>
          <p className="text-gray-600 text-[15px]">
            Assurez-vous que vos coordonnées personnelles sont correctes.
          </p>
          {errorMsg && (
            <div className="mt-5 flex items-start gap-2.5 text-left p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm max-w-2xl mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

          {/* LEFT COLUMN: FORM */}
          <div className="flex-1 lg:max-w-2xl space-y-6">

            {/* Connected banner */}
            {user && (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-green-800">Connecté en tant que</p>
                  <p className="text-[13px] text-green-700">{formData.email}</p>
                </div>
              </div>
            )}

            {/* Coordonnées */}
            <section className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-7">
              <h2 className="text-[18px] font-extrabold tracking-tight text-[#00234b] mb-5">
                Vos coordonnées
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Prénom">
                    <input
                      type="text"
                      name="prenom"
                      placeholder="Prénom"
                      value={formData.prenom}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Nom">
                    <input
                      type="text"
                      name="nom"
                      placeholder="Nom"
                      value={formData.nom}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Email">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    readOnly={!!user}
                    className={
                      user
                        ? `${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed focus:border-gray-200 focus:ring-0`
                        : inputClass
                    }
                  />
                </Field>

                {!user && (
                  <Field label="Mot de passe">
                    <input
                      type="password"
                      name="password"
                      placeholder="Créer un mot de passe (min. 6 caractères)"
                      value={formData.password}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </Field>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Téléphone">
                    <input
                      type="tel"
                      name="telephone"
                      placeholder="06 12 34 56 78"
                      value={formData.telephone}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Date de naissance">
                    <input
                      type="date"
                      name="dateNaissance"
                      value={formData.dateNaissance}
                      onChange={handleChange}
                      className={`${inputClass} text-gray-700`}
                    />
                  </Field>
                </div>

                <Field label="Adresse">
                  <input
                    type="text"
                    name="adresse"
                    placeholder="12 rue de la République"
                    value={formData.adresse}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </Field>

                <Field label="Code postal - Ville">
                  <input
                    type="text"
                    name="codePostal"
                    placeholder="75011 Paris"
                    value={formData.codePostal}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </Field>
              </div>
            </section>

            {/* Profil de conduite */}
            <section className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-7">
              <h2 className="text-[18px] font-extrabold tracking-tight text-[#00234b] mb-6">
                Votre profil de conduite
              </h2>

              <div className="space-y-8">
                {/* Raison de permis */}
                <div>
                  <h3 className="text-[15px] font-bold text-[#00234b] mb-3.5">
                    Raison de permis accéléré ?
                  </h3>
                  <ChoiceList
                    name="raison"
                    value={formData.raison}
                    onSelect={(v) => handleRadioChange("raison", v)}
                    options={[
                      { id: 'annulation', label: 'Annulation / Suspension / Invalidation' },
                      { id: 'pas_de_date', label: "Je ne trouve pas de date d'examen" },
                      { id: 'manque_temps', label: 'Manque de temps' },
                      { id: 'representation', label: 'Représentation suite à un échec' },
                    ]}
                  />
                </div>

                {/* Deja passe le permis */}
                <div>
                  <h3 className="text-[15px] font-bold text-[#00234b] mb-3.5">
                    As-tu déjà passé le permis ?
                  </h3>
                  <ChoiceGroup
                    name="dejaPassePermis"
                    value={formData.dejaPassePermis}
                    onSelect={(v) => handleRadioChange("dejaPassePermis", v)}
                    options={YES_NO}
                  />
                </div>

                {/* Code */}
                <div>
                  <h3 className="text-[15px] font-bold text-[#00234b] mb-3.5">
                    As-tu obtenu ton code ?
                  </h3>
                  <ChoiceGroup
                    name="aLeCode"
                    value={formData.aLeCode}
                    onSelect={(v) => handleRadioChange("aLeCode", v)}
                    options={YES_NO}
                  />
                </div>

                {/* Handicap */}
                <div>
                  <h3 className="text-[15px] font-bold text-[#00234b] mb-3.5 leading-snug">
                    Avez-vous un handicap nécessitant un certificat médical pour vous inscrire en auto-école ?
                  </h3>
                  <ChoiceGroup
                    name="handicap"
                    value={formData.handicap}
                    onSelect={(v) => handleRadioChange("handicap", v)}
                    options={YES_NO}
                  />
                </div>

                {/* NEPH */}
                <Field label="Numéro NEPH (obligatoire)">
                  <input
                    type="text"
                    name="neph"
                    placeholder="Numéro NEPH (12 chiffres)"
                    value={formData.neph}
                    onChange={handleChange}
                    className={inputClass}
                    inputMode="numeric"
                    maxLength={12}
                    required
                  />
                </Field>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: RECAP & TOTAL */}
          <div className="lg:w-[400px] flex-shrink-0">
            <div className="bg-white border border-gray-200/80 rounded-2xl shadow-lg shadow-gray-200/60 p-6 sm:p-7 sticky top-8">
              <h2 className="text-[19px] font-extrabold tracking-tight text-[#00234b] mb-6">
                Récapitulatif de votre panier
              </h2>

              <div className="mb-6">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Formule
                </h3>
                <div className="flex justify-between items-start mb-2.5 gap-3">
                  <span className="font-bold text-[#00234b]">{stage.stage_type || "Stage intensif"}</span>
                  <span className="font-bold text-[#00234b] whitespace-nowrap">{stage.price.toLocaleString("fr-FR")},00 €</span>
                </div>
                <ul className="text-[13.5px] text-gray-600 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#1278CC] shrink-0" />
                    Du {startStr} au {endStr}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#1278CC] shrink-0" />
                    {transmission}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#1278CC] shrink-0 mt-2" />
                    {locationText}
                  </li>
                </ul>
              </div>

              <div className="border-t border-gray-100 mb-5" />

              <div className="mb-6">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Options
                </h3>
                <div className="flex justify-between items-start text-[14px] gap-3">
                  <div className="text-gray-600">
                    Accompagnement examen pratique{" "}
                    <span className="text-gray-400">(obligatoire)</span>
                  </div>
                  <span className="font-medium text-gray-900 whitespace-nowrap">{optionsPrice.toLocaleString("fr-FR")},00 €</span>
                </div>
              </div>

              <div className="border-t-2 border-gray-100 mb-5" />

              <div className="mb-7">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[16px] font-bold text-[#00234b]">Montant total</span>
                  <span className="text-[26px] font-extrabold tracking-tight text-[#00234b] leading-none">{totalPrice.toLocaleString("fr-FR")},00 €</span>
                </div>
                <div className="text-right text-[11.5px] text-gray-500">
                  TVA de {tva.toLocaleString("fr-FR")} € incluse
                </div>
              </div>

              <label className="flex items-start gap-3 mb-5 cursor-pointer group">
                <span
                  className={`w-5 h-5 mt-0.5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${
                    formData.attestation20h
                      ? "bg-[#1278CC] border-[#1278CC]"
                      : "bg-white border-gray-300 group-hover:border-[#1278CC]"
                  }`}
                >
                  {formData.attestation20h && (
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
                  )}
                </span>
                <span className="text-[13px] text-gray-700 leading-snug">
                  J&apos;atteste avoir déjà effectué 20h de conduite dans une école de
                  conduite
                </span>
                <input
                  type="checkbox"
                  name="attestation20h"
                  checked={formData.attestation20h}
                  onChange={handleChange}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleCheckout}
                disabled={loadingSubmit}
                className="w-full bg-[#ffcb00] hover:bg-[#f0bd00] text-[#00234b] py-4 rounded-full font-extrabold text-[15px] transition-all shadow-xl shadow-amber-200/60 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {loadingSubmit ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Continuer vers le paiement
                  </>
                )}
              </button>

              <div className="mt-5 flex items-center justify-center gap-3">
                <Image
                  src="/icons/securepayment.png"
                  alt=""
                  width={46}
                  height={46}
                  className="shrink-0"
                />
                <div className="flex flex-col items-start gap-1.5">
                  <span className="text-[12px] font-semibold text-gray-600">
                    Paiement sécurisé via Stripe
                  </span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wide px-3 py-1 rounded-full bg-[#5FA82B]">
                    4x sans frais possible
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
