"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, User, Phone, Check, ChevronRight, X, Car, FileCheck, HelpCircle, IdCard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState({
    reason: "" as "annulation" | "pas-de-date" | "manque-temps" | "echec" | "",
    hasPermit: "" as "oui" | "non" | "",
    transmission: "" as "auto" | "manuelle" | "",
    hasCode: "" as "oui" | "non" | "",
    nephNumber: "",
  });
  const [nephError, setNepHError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
          },
        },
      });

      if (error) throw error;

      // Store user ID and show quiz
      if (data.user) {
        setUserId(data.user.id);
        setSuccess(true);
        setTimeout(() => {
          setShowQuiz(true);
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
            <p className="text-gray-600 mt-2">Inscrivez-vous pour réserver vos stages</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-xl text-sm">
              Compte créé ! Complétez votre profil en 30 secondes...
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom complet</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Jean Dupont"
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="votre@email.com"
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="06 12 34 56 78"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && (
          <QuizModal
            quizStep={quizStep}
            setQuizStep={setQuizStep}
            quizData={quizData}
            setQuizData={setQuizData}
            quizLoading={quizLoading}
            setQuizLoading={setQuizLoading}
            userId={userId}
            supabase={supabase}
            router={router}
            nephError={nephError}
            setNepHError={setNepHError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface QuizModalProps {
  quizStep: number;
  setQuizStep: (step: number) => void;
  quizData: {
    reason: "annulation" | "pas-de-date" | "manque-temps" | "echec" | "";
    hasPermit: "oui" | "non" | "";
    transmission: "auto" | "manuelle" | "";
    hasCode: "oui" | "non" | "";
    nephNumber: string;
  };
  setQuizData: (data: any) => void;
  quizLoading: boolean;
  setQuizLoading: (loading: boolean) => void;
  userId: string | null;
  supabase: any;
  router: any;
  nephError: string | null;
  setNepHError: (error: string | null) => void;
}

function QuizModal({ quizStep, setQuizStep, quizData, setQuizData, quizLoading, setQuizLoading, userId, supabase, router, nephError, setNepHError }: QuizModalProps) {
  const questions = [
    {
      id: "reason",
      icon: <Car className="w-8 h-8 text-blue-600" />,
      question: "Raison de permis accéléré ?",
      options: [
        { value: "annulation", label: "Annulation / Suspension / Invalidation" },
        { value: "pas-de-date", label: "Je ne trouve pas de date d'examen" },
        { value: "manque-temps", label: "Manque de temps" },
        { value: "echec", label: "Représentation suite à un échec" },
      ],
    },
    {
      id: "hasPermit",
      icon: <Car className="w-8 h-8 text-blue-600" />,
      question: "As-tu déjà passé le permis ?",
      options: [
        { value: "oui", label: "Oui" },
        { value: "non", label: "Non" },
      ],
    },
    {
      id: "transmission",
      icon: <HelpCircle className="w-8 h-8 text-purple-600" />,
      question: "Tu es intéressé par une boîte :",
      options: [
        { value: "auto", label: "Automatique" },
        { value: "manuelle", label: "Manuelle" },
      ],
    },
    {
      id: "hasCode",
      icon: <FileCheck className="w-8 h-8 text-green-600" />,
      question: "As-tu obtenu ton code ?",
      options: [
        { value: "oui", label: "Oui" },
        { value: "non", label: "Non" },
      ],
    },
    {
      id: "nephNumber",
      icon: <IdCard className="w-8 h-8 text-orange-600" />,
      question: "Renseigne ton numéro NEPH",
      input: true,
      placeholder: "12 chiffres exactement",
    },
  ];

  const currentQuestion = questions[quizStep];

  const handleOptionSelect = (value: string) => {
    setQuizData({ ...quizData, [currentQuestion.id]: value });
  };

  const handleNext = async () => {
    if (quizStep < questions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      setQuizLoading(true);
      try {
        const { error } = await supabase
          .from("users")
          .update({
            reason: quizData.reason,
            has_permit: quizData.hasPermit === "oui",
            transmission_preference: quizData.transmission,
            has_code: quizData.hasCode === "oui",
            neph_number: quizData.nephNumber || null,
            quiz_completed: true,
          })
          .eq("id", userId);

        if (error) throw error;
        router.push("/mon-compte");
      } catch (err) {
        console.error("Error saving quiz:", err instanceof Error ? err.message : JSON.stringify(err));
        router.push("/mon-compte");
      }
    }
  };

  const handleSkip = () => {
    router.push("/mon-compte");
  };

  const canProceed = () => {
    if (currentQuestion.input) {
      // NEPH is optional but if filled, must be exactly 12 digits
      if (quizData.nephNumber === "") return true; // Empty is allowed
      return quizData.nephNumber.length === 12; // Must be exactly 12
    }
    return quizData[currentQuestion.id as keyof typeof quizData] !== "";
  };

  const isLastStep = quizStep === questions.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Quelques questions...</h2>
              <p className="text-blue-100 text-sm mt-1">
                Étape {quizStep + 1} sur {questions.length}
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-blue-800/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((quizStep + 1) / questions.length) * 100}%` }}
              className="h-full bg-white rounded-full"
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={quizStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Question Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center">
                  {currentQuestion.icon}
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-xl font-bold text-gray-900 text-center mb-6">
                {currentQuestion.question}
              </h3>

              {/* Options or Input */}
              {currentQuestion.input ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={12}
                    value={quizData.nephNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                      setQuizData({ ...quizData, nephNumber: value });
                      if (value.length === 12) {
                        setNepHError(null);
                      } else if (value.length > 0) {
                        setNepHError("Le NEPH doit contenir exactement 12 chiffres");
                      } else {
                        setNepHError(null);
                      }
                    }}
                    placeholder={currentQuestion.placeholder}
                    className={`w-full px-4 py-4 rounded-xl border-2 focus:ring-2 outline-none text-center text-lg font-semibold tracking-wider transition-colors ${
                      nephError
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : quizData.nephNumber.length === 12
                        ? "border-green-500 focus:border-green-500 focus:ring-green-200"
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                    }`}
                  />
                  {nephError && (
                    <p className="text-sm text-red-500 text-center font-medium">
                      ⚠️ {nephError} ({quizData.nephNumber.length}/12)
                    </p>
                  )}
                  {quizData.nephNumber.length === 12 && (
                    <p className="text-sm text-green-600 text-center font-medium">
                      ✅ Numéro NEPH valide
                    </p>
                  )}
                  <p className="text-xs text-gray-400 text-center">
                    12 chiffres requis - Laisse vide pour l&apos;ajouter plus tard
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {currentQuestion.options?.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleOptionSelect(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        quizData[currentQuestion.id as keyof typeof quizData] === option.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-2xl mb-2 block">
                        {option.value === "oui" ? "✅" : option.value === "non" ? "❌" : option.value === "auto" ? "🚗" : "⚙️"}
                      </span>
                      <span className={`font-semibold ${
                        quizData[currentQuestion.id as keyof typeof quizData] === option.value
                          ? "text-blue-700"
                          : "text-gray-700"
                      }`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex gap-3">
            {quizStep > 0 && (
              <button
                onClick={() => setQuizStep(quizStep - 1)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 transition-colors"
              >
                Retour
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed() || quizLoading}
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {quizLoading ? (
                <span className="animate-pulse">Enregistrement...</span>
              ) : isLastStep ? (
                <>
                  <Check className="w-5 h-5" />
                  Terminer
                </>
              ) : (
                <>
                  Suivant
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleSkip}
            className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Passer pour l&apos;instant →
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
