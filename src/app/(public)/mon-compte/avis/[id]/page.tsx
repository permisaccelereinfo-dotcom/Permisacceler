"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Save, Star, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDateFr } from "@/lib/utils";

export default function StudentReviewPage() {
  const params = useParams();
  const bookingId = params?.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Role guard: auto-ecoles are not allowed in student space
      const { data: roleData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (roleData?.role === "auto_ecole") {
        router.push("/dashboard");
        return;
      }

      const { data: bookingData } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          user_id,
          stage:stage_id (
            id,
            title,
            start_date,
            end_date,
            auto_ecole_id,
            auto_ecole:auto_ecole_id (name, city)
          )
        `)
        .eq("id", bookingId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!bookingData) {
        setError("Réservation introuvable.");
        setLoading(false);
        return;
      }

      if (bookingData.status !== "completed") {
        setError("Vous pourrez laisser un avis une fois le stage terminé.");
        setBooking(bookingData);
        setLoading(false);
        return;
      }

      setBooking(bookingData);

      const { data: review } = await supabase
        .from("reviews")
        .select("id, rating, comment")
        .eq("booking_id", bookingId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (review) {
        setExistingReviewId(review.id);
        setRating(review.rating);
        setComment(review.comment ?? "");
      }

      setLoading(false);
    };

    fetchBooking();
  }, [bookingId, router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating < 1) {
      setError("Merci de sélectionner une note entre 1 et 5 étoiles.");
      return;
    }

    const autoEcoleId = booking?.stage?.auto_ecole_id;
    if (!autoEcoleId) {
      setError("Auto-école introuvable pour cette réservation.");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { error: writeError } = existingReviewId
        ? await supabase
            .from("reviews")
            .update({ rating, comment: comment.trim() || null })
            .eq("id", existingReviewId)
        : await supabase.from("reviews").insert({
            user_id: user.id,
            auto_ecole_id: autoEcoleId,
            booking_id: bookingId,
            rating,
            comment: comment.trim() || null,
          });

      if (writeError) throw writeError;

      setSuccess(true);
      setTimeout(() => router.push("/mon-compte/reservations"), 1200);
    } catch (err: any) {
      setError(err?.message || "Impossible d'enregistrer votre avis. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const stage = booking?.stage;
  const canReview = booking?.status === "completed";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/mon-compte/reservations"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à mes réservations
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {existingReviewId ? "Modifier mon avis" : "Laisser un avis"}
              </h1>
              <p className="text-gray-600">Votre retour aide les autres élèves à choisir</p>
            </div>
          </div>

          {stage && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <p className="font-semibold text-gray-900">{stage.title}</p>
              <p className="text-sm text-gray-600">
                {[stage.auto_ecole?.name, stage.auto_ecole?.city].filter(Boolean).join(" - ")}
              </p>
              {stage.start_date && (
                <p className="text-sm text-gray-500 mt-1">
                  Du {formatDateFr(stage.start_date)} au {formatDateFr(stage.end_date)}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Merci ! Votre avis a bien été enregistré.
            </div>
          )}

          {canReview && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Votre note</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                      className="p-1 rounded-lg hover:bg-yellow-50 transition-colors"
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          value <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 font-bold text-gray-700">{rating}/5</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Votre commentaire <span className="font-normal text-gray-400">(optionnel)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                  maxLength={1000}
                  placeholder="Comment s'est passé votre stage ? Moniteurs, organisation, résultats..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{comment.length}/1000</p>
              </div>

              <div className="flex gap-4 pt-4">
                <Link
                  href="/mon-compte/reservations"
                  className="flex-1 py-4 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-gray-300 transition-colors text-center"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={saving || success || rating < 1}
                  className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {existingReviewId ? "Mettre à jour" : "Publier mon avis"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
