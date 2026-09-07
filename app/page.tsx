import type { Metadata } from "next";
import { OfficeExperience } from "@/components/office-experience";

export const metadata: Metadata = {
  title: { absolute: "Monova | Agencia de soluciones digitales" },
  description: "Diseño, desarrollo de software, inteligencia artificial y estrategia digital para impulsar tu negocio."
};

export default function Home() {
  return <main className="overflow-hidden bg-monova-black text-white"><OfficeExperience /></main>;
}
