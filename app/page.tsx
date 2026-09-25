import type { Metadata } from "next";
import { AgencyHome } from "@/components/agency-home";

export const metadata: Metadata = {
  title: { absolute: "Monova | Agencia de soluciones digitales" },
  description: "Diseño, desarrollo de software, inteligencia artificial y estrategia digital para impulsar tu negocio."
};

export default function Home() {
  return <AgencyHome />;
}
