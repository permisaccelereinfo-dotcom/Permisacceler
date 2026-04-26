"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  { name: "Starter", price: "699", popular: false, features: ["20h de conduite", "Accès plateforme code", "Frais d'examen"] },
  { name: "Accéléré", price: "999", popular: true, features: ["30h de conduite", "Accès illimité code", "Support prioritaire", "1h perfectionnement"] },
  { name: "Premium", price: "1,299", popular: false, features: ["40h de conduite", "Accès illimité", "Support 24/7", "5h perfectionnement"] },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Nos forfaits</h2>
          <p className="mt-4 text-gray-600">Des tarifs transparents, sans frais cachés.</p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-8 ${plan.popular ? "bg-blue-600 text-white scale-105" : "border border-gray-200"}`}
            >
              {plan.popular && <div className="-mt-4 mb-4 text-center"><span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">Le plus choisi</span></div>}
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <div className="mt-4 text-4xl font-bold">{plan.price}€</div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className={`h-5 w-5 ${plan.popular ? "text-white" : "text-green-600"}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className={`mt-8 w-full rounded-full py-3 font-semibold ${plan.popular ? "bg-white text-blue-600" : "bg-blue-600 text-white"}`}>
                Choisir
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
