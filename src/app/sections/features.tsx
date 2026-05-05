"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Image from "next/image";

const features = [
  {
    image: "/time.png",
    title: "Date d'examen garanti",
    description: "Obtenez des dates d'évaluation et de formation en accéléré, sans liste d'attente.",
  },
  {
    image: "/learning.png",
    title: "Auto école partenaires",
    description: "Des professionnels certifiés par l'État pour un apprentissage serein et sur-mesure.",
  },
  {
    image: "/winner.png",
    title: "Rapidité record",
    description: "La majorité de nos élèves réussissent leur examen du premier coup grâce à notre méthode.",
  },
];

const missionItems = [
  "Vous accompagner jusqu'au permis en 15 jours",
  "Garantir votre place d'examen dès 72h",
  "Sécuriser votre passage avec nos partenaires",
  "Réduire votre temps d'attente de 50%",
  "Simplifier vos démarches administratives",
  "Vous garantir satisfaction ou remboursement",
  "Être disponible 7j/7 pour vous aider",
];

const cities = [
  {
    name: "Paris",
    image: "/paris.png",
    availability: "Nombreuses dates disponibles",
  },
  {
    name: "Lyon",
    image: "/lyon.png",
    availability: "Nombreuses dates disponibles",
  },
  {
    name: "Marseille",
    image: "/marseille.png",
    availability: "Nombreuses dates disponibles",
  },
  {
    name: "Bordeaux",
    image: "/bordeaux.png",
    availability: "Nombreuses dates disponibles",
  },
  {
    name: "Nantes",
    image: "/nantes.png",
    availability: "Nombreuses dates disponibles",
  },
  {
    name: "Montpellier",
    image: "/montpellier.png",
    availability: "Nombreuses dates disponibles",
  },
  {
    name: "Nice",
    image: "/nice.png",
    availability: "Nombreuses dates disponibles",
  },
  {
    name: "Aix-en-Provence",
    image: "/aix.png",
    availability: "Nombreuses dates disponibles",
  },
  {
    name: "Toulouse",
    image: "/toulouse.png",
    availability: "Nombreuses dates disponibles",
  },
  {
    name: "Strasbourg",
    image: "/strasbourg.png",
    availability: "Nombreuses dates disponibles",
  },
  {
    name: "Lille",
    image: "/lille.png",
    availability: "Nombreuses dates disponibles",
  },
  {
    name: "Rennes",
    image: "/rennes.png",
    availability: "Nombreuses dates disponibles",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl lg:text-4xl" style={{ fontFamily: 'var(--ds-nb---font--primary)' }}>
            Le chemin le plus rapide vers ton permis
          </h2>
        </div>

        {/* Desktop: Grid / Mobile: Scrolling Marquee */}
        <div className="hidden md:grid md:grid-cols-3 gap-x-8 gap-y-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              {/* Organic Blob Icon Container matched to Doctolib style */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#e5f4fd] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] w-24 h-24 -ml-2 top-1 rotate-12"></div>
                <div className="relative z-10 flex h-20 w-20 items-center justify-center">
                  <Image src={feature.image} alt={feature.title} width={96} height={96} className="object-contain drop-shadow-sm w-auto h-auto" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-navy mb-3" style={{ fontFamily: 'var(--oxygen-font-semantic-title-s-bold)' }}>
                {feature.title}
              </h3>
              <p className="text-base text-gray-600 leading-relaxed max-w-xs">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Mobile: Infinite Scrolling Marquee */}
        <div className="md:hidden overflow-hidden">
          <div className="flex animate-marquee">
            {/* First set */}
            {features.map((feature, index) => (
              <div key={`first-${index}`} className="flex-shrink-0 w-[280px] px-4 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-[#e5f4fd] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] w-20 h-20 -ml-2 top-1 rotate-12"></div>
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center">
                    <Image src={feature.image} alt={feature.title} width={64} height={64} className="object-contain drop-shadow-sm w-auto h-auto" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
            {/* Duplicate set for seamless loop */}
            {features.map((feature, index) => (
              <div key={`second-${index}`} className="flex-shrink-0 w-[280px] px-4 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-[#e5f4fd] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] w-20 h-20 -ml-2 top-1 rotate-12"></div>
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center">
                    <Image src={feature.image} alt={feature.title} width={64} height={64} className="object-contain drop-shadow-sm w-auto h-auto" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Two-column section: Notre Mission + Près de chez vous */}
        <div className="mt-6 lg:mt-12 border-t border-gray-100 pt-6 lg:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-12 lg:gap-16">

            {/* Left Column – Notre Mission */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:sticky lg:top-32 lg:self-start"
            >
              <div className="bg-[#faf8f5] rounded-2xl p-7 border border-[#ece7df]">
                <h3 className="text-lg font-bold text-gray-900 mb-5">
                  Notre Mission :
                </h3>
                <ul className="space-y-3.5">
                  {missionItems.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="h-4.5 w-4.5 text-gray-700 shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-sm text-gray-700 leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Section */}
              <div className="mt-6 bg-[#1278CC] rounded-2xl p-6 text-white">
                <h4 className="text-lg font-bold mb-2">Votre Stage accéléré près de chez vous</h4>
                <p className="text-sm text-white/90 mb-4">Un Stage rapide avec une date garanti Ça change tout</p>
                <a
                  href="/recherche"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-white text-[#1278CC] font-bold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Je cherche mon stage
                </a>
              </div>
            </motion.div>

            {/* Right Column – Près de chez vous - Hidden on mobile */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="hidden lg:block"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Près de chez vous
              </h3>
              <p className="text-base text-gray-600 mb-3 leading-relaxed">
                Nos stages arrivent progressivement dans de nouvelles zones. En attendant, retrouvez les sessions ouvertes à{" "}
                <span className="text-primary font-medium">Paris</span>,{" "}
                <span className="text-primary font-medium">Marseille</span>,{" "}
                <span className="text-primary font-medium">Lyon</span>,{" "}
                <span className="text-primary font-medium">Nantes</span>,{" "}
                <span className="text-primary font-medium">Bordeaux</span>,{" "}
                <span className="text-primary font-medium">Montpellier</span>,{" "}
                <span className="text-primary font-medium">Nice</span> et{" "}
                <span className="text-primary font-medium">Aix-en-Provence</span>.
              </p>

              <h4 className="text-base font-semibold text-gray-800 mb-5 mt-6">
                Nos lieux de stage actuellement disponibles
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {cities.map((city, index) => (
                  <motion.a
                    key={city.name}
                    href="#"
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="group flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-3 hover:border-primary/40 hover:shadow-md transition-all duration-200"
                  >
                    <div className="relative h-20 w-24 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={city.image}
                        alt={city.name}
                        fill
                        sizes="(max-width: 640px) 150px, 100px"
                        priority={index < 2}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-base font-bold text-gray-900 mb-0.5">{city.name}</h5>
                      <p className="text-xs text-primary font-medium mb-1.5">{city.availability}</p>
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600 group-hover:text-primary transition-colors duration-200">
                        Voir les disponibilités
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                      </span>
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
