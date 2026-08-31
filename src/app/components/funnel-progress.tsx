"use client";

import { Check } from "lucide-react";

const STEPS = ["Recherche", "Récapitulatif", "Informations", "Paiement"];

/**
 * Labeled progress stepper for the booking funnel.
 * `current` is the 1-based index of the active step.
 */
export function FunnelProgress({ current }: { current: number }) {
  return (
    <nav aria-label="Progression de la réservation" className="mb-10">
      <ol className="flex items-start justify-center max-w-xl mx-auto">
        {STEPS.map((label, i) => {
          const step = i + 1;
          const isDone = step < current;
          const isCurrent = step === current;

          return (
            <li
              key={label}
              className={`flex items-start ${step > 1 ? "flex-1" : ""}`}
            >
              {step > 1 && (
                <div
                  className={`h-0.5 flex-1 mt-4 rounded-full ${
                    step <= current ? "bg-[#1278CC]" : "bg-gray-200"
                  }`}
                />
              )}
              <div className="flex flex-col items-center gap-1.5 px-1.5 sm:px-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-colors ${
                    isDone
                      ? "bg-[#1278CC] text-white"
                      : isCurrent
                        ? "bg-[#00234b] text-white ring-4 ring-[#00234b]/10"
                        : "bg-white border-2 border-gray-200 text-gray-400"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" strokeWidth={3} /> : step}
                </div>
                <span
                  className={`text-[11px] sm:text-xs font-semibold whitespace-nowrap ${
                    isCurrent
                      ? "text-[#00234b]"
                      : isDone
                        ? "text-[#1278CC]"
                        : "text-gray-400"
                  } ${isCurrent ? "" : "hidden sm:block"}`}
                >
                  {label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
