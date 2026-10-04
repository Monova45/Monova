import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { MonovaGame } from "@/components/monova-game";
import styles from "@/components/monova-game.module.css";

export const metadata: Metadata = { title: "Juega con Monova", description: "Ayuda a Monova a limpiar la montaña de zombies, calabazas y fantasmas este Halloween." };

const contact = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573107598999"}?text=${encodeURIComponent("Hola Monova, jugué Juega con Monova y quiero conversar sobre un proyecto.")}`;

export default function GamePage() {
  return <main className={styles.page}>
    <header className={styles.top}>
      <Link href="/" aria-label="Monova, inicio"><Image className={styles.logo} src="/assets/monova-logo.png" width={2172} height={724} alt="MONOVA" priority /></Link>
      <Link className={styles.back} href="/"><ArrowLeft size={16}/> Volver al inicio</Link>
    </header>
    <section className={styles.intro}>
      <p className={styles.kicker}>EDICIÓN HALLOWEEN 🎃</p>
      <h1>Juega con <span>Monova</span></h1>
      <p>Corre, salta entre las rocas y lanza calabazas para limpiar la montaña de zombies y fantasmas. También puedes caerles encima.</p>
    </section>
    <MonovaGame contact={contact} />
    <section className={styles.cta}>
      <div><h2>¿Te divertiste?</h2><p>Imagina lo que podemos crear para tu marca.</p></div>
      <a href={contact} target="_blank" rel="noreferrer">Hablemos <ArrowUpRight size={18}/></a>
    </section>
  </main>;
}
