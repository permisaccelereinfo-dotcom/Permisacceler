"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const steps = [
  {
    image: "/form.png",
    step: "1",
    title: "Inscription",
    description: "Remplissez notre formulaire. Nous évaluons votre niveau.",
  },
  {
    image: "/chain.png",
    step: "2",
    title: "Mise en relation avec l'auto école partenaire",
    description: "Nous vous mettons en relation avec votre expert dédié.",
  },
  {
    image: "/education.png",
    step: "3",
    title: "Conduite accélérée",
    description: "Accès e-learning et immersion totale : 3 à 4h de conduite par jour.",
  },
  {
    image: "/exam.png",
    step: "4",
    title: "Examen de conduite",
    description: "Placement prioritaire à l'examen sur vos parcours.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4"
          >
            Comment ça marche ?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Votre parcours permis accéléré, étape par étape
          </motion.p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center"
              >
                <div className="relative h-[80px] w-[80px] mb-6">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-lg font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-gray-600 mb-8">
              Inscrivez-vous dès maintenant et obtenez votre permis en accéléré.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors"
            >
              Je m&apos;inscris
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
