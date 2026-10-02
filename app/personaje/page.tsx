import type { Metadata } from "next";
import { CharacterScene } from "@/components/character-scene";

export const metadata: Metadata = { title: "Personaje", description: "Explora el universo creativo de Monova." };
export default function CharacterPage() { return <CharacterScene />; }
