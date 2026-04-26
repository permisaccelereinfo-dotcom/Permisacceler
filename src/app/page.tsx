import { Hero } from "@/app/sections/hero";
import { Features } from "@/app/sections/features";
import { HowItWorks } from "@/app/sections/how-it-works";
import { AlertSection } from "@/app/sections/alert-section";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Features />
      <HowItWorks />
      <AlertSection />
    </div>
  );
}
