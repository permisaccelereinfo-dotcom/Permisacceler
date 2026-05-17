"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function HowItWorks() {
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

  return (
    <section id="how-it-works" className="py-24 bg-white border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl" style={{ fontFamily: 'var(--ds-nb---font--primary)' }}>
            Votre parcours, étape par étape
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative h-[72px] w-[72px] mb-6">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="72px"
                  className="object-contain"
                />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
