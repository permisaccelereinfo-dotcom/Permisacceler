import Link from "next/link";
import { XCircle, ArrowLeft } from "lucide-react";

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-3" style={{ fontFamily: "var(--ds-nb---font--primary)" }}>
          Paiement annulé
        </h1>
        <p className="text-gray-600 mb-8">
          Votre paiement n&apos;a pas abouti. Vous pouvez réessayer de régler votre stage à tout moment.
        </p>

        <div className="space-y-3">
          <Link
            href="/recherche"
            className="w-full flex items-center justify-center gap-2 bg-[#3647AC] text-white py-3.5 rounded-full font-medium text-[15px] hover:bg-[#2A3786] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Réessayer le paiement
          </Link>
          <Link
            href="/"
            className="w-full flex items-center justify-center py-3.5 rounded-full font-medium text-[15px] text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
