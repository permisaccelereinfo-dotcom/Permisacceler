import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg shadow-gray-200/60 border border-gray-200/80 p-8 text-center">
        <Image
          src="/icons/error.png"
          alt=""
          width={96}
          height={96}
          className="mx-auto mb-6"
        />
        <h1 className="text-2xl font-extrabold tracking-tight text-[#00234b] mb-3">
          Paiement annulé
        </h1>
        <p className="text-gray-600 mb-8">
          Votre paiement n&apos;a pas abouti. Vous pouvez réessayer de régler votre stage à tout moment.
        </p>

        <div className="space-y-3">
          <Link
            href="/recherche"
            className="w-full flex items-center justify-center gap-2 bg-[#00234b] hover:bg-black text-white py-3.5 rounded-full font-bold text-[15px] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Réessayer le paiement
          </Link>
          <Link
            href="/"
            className="w-full flex items-center justify-center py-3.5 rounded-full font-semibold text-[15px] text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
