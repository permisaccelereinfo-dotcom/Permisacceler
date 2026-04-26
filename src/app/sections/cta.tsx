"use client";

import { motion } from "framer-motion";
import { Phone, Mail, MapPin } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 bg-blue-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Prêt à démarrer votre formation ?
            </h2>
            <p className="mt-4 text-lg text-blue-200">
              Contactez-nous dès maintenant pour vérifier votre éligibilité et réserver votre semaine de formation.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-blue-100">
                <Phone className="h-5 w-5" />
                <span>01 23 45 67 89</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <Mail className="h-5 w-5" />
                <span>contact@permisaccelere.fr</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <MapPin className="h-5 w-5" />
                <span>123 Avenue des Champs-Élysées, 75008 Paris</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-white p-8"
          >
            <h3 className="text-xl font-semibold text-gray-900">
              Demandez un rappel gratuit
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Un conseiller vous contactera sous 24h.
            </p>

            <form className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Prénom" className="rounded-lg border px-4 py-2" />
                <input type="text" placeholder="Nom" className="rounded-lg border px-4 py-2" />
              </div>
              <input type="tel" placeholder="Téléphone" className="w-full rounded-lg border px-4 py-2" />
              <input type="email" placeholder="Email" className="w-full rounded-lg border px-4 py-2" />
              <button type="submit" className="w-full rounded-full bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700">
                Demander un rappel
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
