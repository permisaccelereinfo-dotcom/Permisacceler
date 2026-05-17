"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

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
    logement: "",
    dejaPassePermis: "",
    aLeCode: "",
    neph: "",
    
    // Raison
    raison: "",
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
      <div className="min-h-screen bg-[#fafbfc] flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3647AC]" />
      </div>
    );
  }

  if (!stage) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col justify-center items-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h1>
        <p className="text-gray-500">Stage introuvable.</p>
        <button 
          onClick={() => window.history.back()}
          className="mt-8 bg-[#3647AC] text-white px-6 py-2 rounded-full font-medium hover:bg-[#2A3786]"
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
  
  const region = stage.auto_ecole?.region || "ILE DE FRANCE";
  const mockZip = region === "ILE DE FRANCE" ? "93160" : "30000";
  const lines = ["RER A", "RER B", "RER C", "Ligne J", "T9", "Métro"];
  const charCode = stage.id.charCodeAt(0) || 0;
  const locationText = `${lines[charCode % lines.length]} - ${region === "ILE DE FRANCE" ? "Noisy-le-Grand - Mont d'Est" : stage.auto_ecole?.name} (${mockZip})`;

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

      // 1. If not logged in, create account
      if (!user) {
        if (!formData.email || !formData.password || !formData.prenom || !formData.nom) {
          throw new Error("Veuillez remplir vos informations personnelles et créer un mot de passe.");
        }
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });
        
        if (signUpError) throw new Error(signUpError.message);
        if (!authData.user) throw new Error("Erreur lors de la création du compte.");
        
        finalUserId = authData.user.id;

        // Insert into public.users
        const { error: profileError } = await supabase.from("users").insert({
          id: finalUserId,
          email: formData.email,
          name: `${formData.prenom} ${formData.nom}`.trim(),
          phone: formData.telephone,
          role: 'student'
        });

        if (profileError) console.error("Could not create user profile:", profileError);
      }

      // 2. Call our API to create Stripe Checkout Session
      const res = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: stage.id,
          userId: finalUserId,
          formData,
          optionsPrice
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
    <div className="min-h-screen bg-[#fafbfc] pt-12 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Progress Bar */}
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="flex gap-2 sm:gap-4 items-center">
            <div className="w-8 sm:w-12 h-1 bg-[#3647AC] rounded-full"></div>
            <div className="w-8 sm:w-12 h-1 bg-[#3647AC] rounded-full"></div>
            <div className="w-8 sm:w-12 h-1 bg-[#3647AC] rounded-full"></div>
            <div className="w-8 sm:w-12 h-1 bg-[#3647AC] rounded-full"></div>
            <div className="w-8 sm:w-12 h-1 bg-[#3647AC] rounded-full"></div>
            <div className="w-8 sm:w-12 h-1 bg-gray-200 rounded-full"></div>
          </div>
        </div>

        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-[28px] sm:text-[36px] font-medium text-gray-900 mb-3 tracking-tight" style={{ fontFamily: 'var(--ds-nb---font--primary)' }}>
            Vos informations sont-elles correctes ?
          </h1>
          <p className="text-gray-600 text-[15px]">
            Assurez-vous que vos coordonnées personnelles sont correctes.
          </p>
          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm max-w-2xl mx-auto">
              {errorMsg}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* LEFT COLUMN: FORM */}
          <div className="flex-1 lg:max-w-2xl">

            {/* Connected banner */}
            {user && (
              <div className="flex items-center gap-3 mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-green-800">Connecté en tant que</p>
                  <p className="text-[13px] text-green-700">{formData.email}</p>
                </div>
              </div>
            )}

            <div className="space-y-4 mb-10">
              <input
                type="text"
                name="prenom"
                placeholder="Prénom"
                value={formData.prenom}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#3647AC] focus:ring-1 focus:ring-[#3647AC] text-[15px]"
              />
              <input
                type="text"
                name="nom"
                placeholder="Nom"
                value={formData.nom}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#3647AC] focus:ring-1 focus:ring-[#3647AC] text-[15px]"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                readOnly={!!user}
                className={`w-full px-4 py-3.5 rounded-lg border text-[15px] focus:outline-none ${
                  user
                    ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "border-gray-200 focus:border-[#3647AC] focus:ring-1 focus:ring-[#3647AC]"
                }`}
              />
              
              {!user && (
                <input
                  type="password"
                  name="password"
                  placeholder="Créer un mot de passe (min. 6 caractères)"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#3647AC] focus:ring-1 focus:ring-[#3647AC] text-[15px]"
                />
              )}

              <input
                type="tel"
                name="telephone"
                placeholder="Téléphone"
                value={formData.telephone}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#3647AC] focus:ring-1 focus:ring-[#3647AC] text-[15px]"
              />
              <input
                type="date"
                name="dateNaissance"
                placeholder="Date de naissance"
                value={formData.dateNaissance}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#3647AC] focus:ring-1 focus:ring-[#3647AC] text-[15px] text-gray-500"
              />

              <input
                type="text"
                name="adresse"
                placeholder="Adresse"
                value={formData.adresse}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#3647AC] focus:ring-1 focus:ring-[#3647AC] text-[15px]"
              />

              <input
                type="text"
                name="codePostal"
                placeholder="Code postal - Ville"
                value={formData.codePostal}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#3647AC] focus:ring-1 focus:ring-[#3647AC] text-[15px]"
              />
            </div>

            <div className="space-y-10">
              
              {/* Raison de permis */}
              <div>
                <h3 className="text-[17px] font-semibold text-gray-900 mb-4">Raison de permis accéléré ?</h3>
                <div className="space-y-3">
                  {[
                    { id: 'annulation', label: 'Annulation / Suspension / Invalidation' },
                    { id: 'pas_de_date', label: 'Je ne trouve pas de date d\'examen' },
                    { id: 'manque_temps', label: 'Manque de temps' },
                    { id: 'representation', label: 'Représentation suite à un échec' }
                  ].map((option) => (
                    <label key={option.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.raison === option.id ? 'border-[#3647AC]' : 'border-gray-300 group-hover:border-[#3647AC]'}`}>
                        {formData.raison === option.id && <div className="w-2.5 h-2.5 bg-[#3647AC] rounded-full"></div>}
                      </div>
                      <span className="text-[15px] text-gray-700">{option.label}</span>
                      <input 
                        type="radio" 
                        name="raison" 
                        value={option.id} 
                        checked={formData.raison === option.id} 
                        onChange={() => handleRadioChange('raison', option.id)} 
                        className="hidden" 
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Deja passe le permis */}
              <div>
                <h3 className="text-[17px] font-semibold text-gray-900 mb-4">As-tu déjà passé le permis ?</h3>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.dejaPassePermis === 'oui' ? 'border-[#3647AC]' : 'border-gray-300'}`}>
                      {formData.dejaPassePermis === 'oui' && <div className="w-2.5 h-2.5 bg-[#3647AC] rounded-full"></div>}
                    </div>
                    <span className="text-[15px] text-gray-700">Oui</span>
                    <input type="radio" className="hidden" name="dejaPassePermis" checked={formData.dejaPassePermis === 'oui'} onChange={() => handleRadioChange('dejaPassePermis', 'oui')} />
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.dejaPassePermis === 'non' ? 'border-[#3647AC]' : 'border-gray-300'}`}>
                      {formData.dejaPassePermis === 'non' && <div className="w-2.5 h-2.5 bg-[#3647AC] rounded-full"></div>}
                    </div>
                    <span className="text-[15px] text-gray-700">Non</span>
                    <input type="radio" className="hidden" name="dejaPassePermis" checked={formData.dejaPassePermis === 'non'} onChange={() => handleRadioChange('dejaPassePermis', 'non')} />
                  </label>
                </div>
              </div>

              {/* Code */}
              <div>
                <h3 className="text-[17px] font-semibold text-gray-900 mb-4">As-tu obtenu ton code ?</h3>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.aLeCode === 'oui' ? 'border-[#3647AC]' : 'border-gray-300'}`}>
                      {formData.aLeCode === 'oui' && <div className="w-2.5 h-2.5 bg-[#3647AC] rounded-full"></div>}
                    </div>
                    <span className="text-[15px] text-gray-700">Oui</span>
                    <input type="radio" className="hidden" name="aLeCode" checked={formData.aLeCode === 'oui'} onChange={() => handleRadioChange('aLeCode', 'oui')} />
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.aLeCode === 'non' ? 'border-[#3647AC]' : 'border-gray-300'}`}>
                      {formData.aLeCode === 'non' && <div className="w-2.5 h-2.5 bg-[#3647AC] rounded-full"></div>}
                    </div>
                    <span className="text-[15px] text-gray-700">Non</span>
                    <input type="radio" className="hidden" name="aLeCode" checked={formData.aLeCode === 'non'} onChange={() => handleRadioChange('aLeCode', 'non')} />
                  </label>
                </div>
              </div>

              {/* Handicap */}
              <div>
                <h3 className="text-[17px] font-semibold text-gray-900 mb-4 leading-snug">Avez-vous un handicap nécessitant un certificat médical pour vous inscrire en auto-école ?</h3>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.handicap === 'oui' ? 'border-[#3647AC]' : 'border-gray-300'}`}>
                      {formData.handicap === 'oui' && <div className="w-2.5 h-2.5 bg-[#3647AC] rounded-full"></div>}
                    </div>
                    <span className="text-[15px] text-gray-700">Oui</span>
                    <input type="radio" className="hidden" name="handicap" checked={formData.handicap === 'oui'} onChange={() => handleRadioChange('handicap', 'oui')} />
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.handicap === 'non' ? 'border-[#3647AC]' : 'border-gray-300'}`}>
                      {formData.handicap === 'non' && <div className="w-2.5 h-2.5 bg-[#3647AC] rounded-full"></div>}
                    </div>
                    <span className="text-[15px] text-gray-700">Non</span>
                    <input type="radio" className="hidden" name="handicap" checked={formData.handicap === 'non'} onChange={() => handleRadioChange('handicap', 'non')} />
                  </label>
                </div>
              </div>

              {/* Logement */}
              <div>
                <h3 className="text-[17px] font-semibold text-gray-900 mb-4">Avez-vous votre propre logement ?</h3>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className={`w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center ${formData.logement === 'oui' ? 'border-[#3647AC]' : 'border-gray-300'}`}>
                      {formData.logement === 'oui' && <div className="w-2.5 h-2.5 bg-[#3647AC] rounded-full"></div>}
                    </div>
                    <span className="text-[15px] text-gray-700">Oui, j'ai des factures à mon nom</span>
                    <input type="radio" className="hidden" name="logement" checked={formData.logement === 'oui'} onChange={() => handleRadioChange('logement', 'oui')} />
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className={`w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center ${formData.logement === 'non' ? 'border-[#3647AC]' : 'border-gray-300'}`}>
                      {formData.logement === 'non' && <div className="w-2.5 h-2.5 bg-[#3647AC] rounded-full"></div>}
                    </div>
                    <span className="text-[15px] text-gray-700">Non, je n'ai pas de factures à mon nom</span>
                    <input type="radio" className="hidden" name="logement" checked={formData.logement === 'non'} onChange={() => handleRadioChange('logement', 'non')} />
                  </label>
                </div>
              </div>

              {/* NEPH */}
              <div>
                <label className="block text-[15px] text-gray-700 mb-3">Si vous disposez d'un numéro NEPH, renseignez-le (facultatif)</label>
                <input
                  type="text"
                  name="neph"
                  placeholder="Numéro NEPH"
                  value={formData.neph}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#3647AC] focus:ring-1 focus:ring-[#3647AC] text-[15px]"
                />
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: RECAP & TOTAL */}
          <div className="lg:w-[420px] flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-xl p-7 sticky top-8">
              <h2 className="text-[20px] font-medium text-gray-900 mb-6 tracking-tight">Récapitulatif de votre panier</h2>
              
              <div className="mb-6">
                <h3 className="text-[15px] text-gray-700 mb-3">Formule</h3>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-gray-900">{stage.stage_type || "Stage intensif"}</span>
                  <span className="font-semibold text-gray-900">{stage.price.toLocaleString("fr-FR")},00 €</span>
                </div>
                <ul className="text-[13.5px] text-gray-600 space-y-1.5 list-disc pl-4 marker:text-gray-400">
                  <li>Du {startStr} au {endStr}</li>
                  <li>{transmission}</li>
                  <li>{locationText}</li>
                </ul>
              </div>

              <div className="border-t border-gray-100 mb-5"></div>

              <div className="mb-6">
                <h3 className="text-[15px] text-gray-700 mb-3">Options</h3>
                <div className="flex justify-between items-start text-[14px]">
                  <div className="text-gray-600 pr-4">
                    Accompagnement examen pratique
                    <br />
                    <span className="text-gray-400">(obligatoire)</span>
                  </div>
                  <span className="font-medium text-gray-900 whitespace-nowrap">{optionsPrice.toLocaleString("fr-FR")},00 €</span>
                </div>
              </div>

              <div className="border-t border-gray-200 mb-6"></div>

              <div className="mb-8">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[18px] font-medium text-gray-900">Montant total</span>
                  <span className="text-[24px] font-bold text-gray-900 leading-none">{totalPrice.toLocaleString("fr-FR")},00 €</span>
                </div>
                <div className="text-right text-[11.5px] text-gray-500">
                  TVA de {tva.toLocaleString("fr-FR")} € incluse
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={loadingSubmit}
                className="w-full bg-[#3647AC] text-white py-3.5 rounded-full font-medium text-[15px] hover:bg-[#2A3786] transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loadingSubmit ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  "Continuer"
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
