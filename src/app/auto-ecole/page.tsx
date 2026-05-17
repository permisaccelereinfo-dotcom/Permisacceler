"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Mail, Lock, Eye, EyeOff, User, Phone, MapPin, TrendingUp, Calendar, Percent, Star, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AutoEcolePage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerData, setRegisterData] = useState({
    autoEcoleName: "",
    responsibleName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const benefits = [
    {
      icon: TrendingUp,
      title: "Visibilité maximale",
      description: "Apparaissez en tête des résultats de recherche des candidats de votre zone.",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Calendar,
      title: "Réservations directes",
      description: "Recevez des demandes de stage en temps réel, sans intermédiaire.",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Building2,
      title: "Gestion simplifiée",
      description: "Planifiez vos créneaux, suivez vos élèves et gérez vos paiements en un seul endroit.",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Percent,
      title: "Commission réduite",
      description: "Seulement 10% de commission par réservation validée.",
      bgColor: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      setSuccess("Connexion réussie ! Redirection...");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (registerData.password !== registerData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    if (!registerData.acceptTerms) {
      setError("Vous devez accepter les conditions d'utilisation");
      setLoading(false);
      return;
    }

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            name: registerData.responsibleName,
            role: "auto_ecole",
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create public.users record first (required for FK)
        const { error: userError } = await supabase.from("users").upsert({
          id: authData.user.id,
          email: registerData.email,
          name: registerData.responsibleName,
          phone: registerData.phone,
          role: "auto_ecole",
        }, { onConflict: "id" });

        if (userError && !userError.message.includes("duplicate")) {
          console.error("User creation error:", userError);
        }

        // 3. Create auto_ecole record
        const { error: profileError } = await supabase.from("auto_ecoles").insert({
          user_id: authData.user.id,
          name: registerData.autoEcoleName,
          email: registerData.email,
          phone: registerData.phone,
          address: registerData.address,
          city: registerData.city,
          postal_code: registerData.postalCode,
          is_verified: false,
          commission_rate: 10,
        });

        if (profileError) throw profileError;
      }

      setSuccess("Compte créé ! Vérifiez votre email pour confirmer.");
      setActiveTab("login");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      setError("Veuillez entrer votre email");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess("Email de réinitialisation envoyé !");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-6xl">


          <div className="flex flex-col gap-16 items-center">
            {/* Top - Forms */}
            <div className="w-full max-w-2xl">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden border border-white/50"
              >
              {/* Tabs */}
              <div className="flex bg-gradient-to-r from-gray-50/80 to-gray-100/50 p-2">
                <button
                  onClick={() => { setActiveTab("login"); setError(null); setSuccess(null); }}
                  className={`flex-1 py-4 text-sm font-bold rounded-xl transition-all duration-300 relative ${
                    activeTab === "login"
                      ? "text-blue-600 bg-white shadow-md"
                      : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                  }`}
                >
                  Connexion
                </button>
                <button
                  onClick={() => { setActiveTab("register"); setError(null); setSuccess(null); }}
                  className={`flex-1 py-4 text-sm font-bold rounded-xl transition-all duration-300 relative ${
                    activeTab === "register"
                      ? "text-blue-600 bg-white shadow-md"
                      : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                  }`}
                >
                  Créer un compte
                </button>
              </div>

              <div className="p-8 lg:p-10">
                {/* Error/Success Messages */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {activeTab === "login" ? (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Bon retour !</h3>
                        <p className="text-gray-600">Connectez-vous à votre espace partenaire</p>
                      </div>
                      <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                              type="email"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              placeholder="contact@autoecole.fr"
                              required
                              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                              type={showPassword ? "text" : "password"}
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              className="w-full pl-12 pr-12 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2" />
                            <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Se souvenir de moi</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            disabled={loading}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all disabled:opacity-50"
                          >
                            Mot de passe oublié ?
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                          Se connecter
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Rejoignez-nous !</h3>
                        <p className="text-gray-600">Créez votre compte partenaire en quelques minutes</p>
                      </div>
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de l&apos;auto-école</label>
                            <div className="relative group">
                              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="text"
                                value={registerData.autoEcoleName}
                                onChange={(e) => setRegisterData({...registerData, autoEcoleName: e.target.value})}
                                placeholder="Auto-École du Centre"
                                required
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du responsable</label>
                            <div className="relative group">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="text"
                                value={registerData.responsibleName}
                                onChange={(e) => setRegisterData({...registerData, responsibleName: e.target.value})}
                                placeholder="Jean Dupont"
                                required
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <div className="relative group">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="email"
                                value={registerData.email}
                                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                                placeholder="contact@autoecole.fr"
                                required
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                            <div className="relative group">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="tel"
                                value={registerData.phone}
                                onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                                placeholder="01 23 45 67 89"
                                required
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse</label>
                          <div className="relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                              type="text"
                              value={registerData.address}
                              onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                              placeholder="123 Avenue des Champs-Élysées"
                              required
                              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ville</label>
                            <div className="relative group">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="text"
                                value={registerData.city}
                                onChange={(e) => setRegisterData({...registerData, city: e.target.value})}
                                placeholder="Paris"
                                required
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Code postal</label>
                            <div className="relative group">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="text"
                                value={registerData.postalCode}
                                onChange={(e) => setRegisterData({...registerData, postalCode: e.target.value})}
                                placeholder="75008"
                                required
                                maxLength={5}
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
                            <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="password"
                                value={registerData.password}
                                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer le mot de passe</label>
                            <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="password"
                                value={registerData.confirmPassword}
                                onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                                placeholder="••••••••"
                                required
                                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer group py-2">
                          <input 
                            type="checkbox" 
                            checked={registerData.acceptTerms}
                            onChange={(e) => setRegisterData({...registerData, acceptTerms: e.target.checked})}
                            className="mt-1 w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2" 
                          />
                          <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                            J&apos;accepte les <Link href="#" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">conditions d&apos;utilisation</Link> et la <Link href="#" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">politique de confidentialité</Link>.
                          </span>
                        </label>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 mt-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                          Créer mon compte
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              </motion.div>
            </div>

            {/* Bottom - Benefits */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full mt-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: 'var(--ds-nb---font--primary)' }}>
                Pourquoi nous rejoindre ?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
                {benefits.map((benefit, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="flex flex-col items-center text-center gap-3 group px-4"
                  >
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${benefit.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <benefit.icon className={`w-5 h-5 ${benefit.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{benefit.title}</h3>
                      <p className="text-gray-500 mt-1.5 leading-relaxed text-sm">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
