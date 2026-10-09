import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { MonovaGame } from "@/components/monova-game";
import styles from "@/components/monova-game.module.css";

export const metadata: Metadata = { title: "Concurso Halloween | Gana una web con Monova", description: "Haz el mejor puntaje en el juego de Halloween de Monova y compite por una web 100% gratis. Supera las 3 montañas y demuestra lo que puedes lograr." };

const contact = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573107598999"}?text=${encodeURIComponent("Hola Monova, quiero conocer los detalles del concurso de Halloween para ganar una web 100% gratis.")}`;

export default function GamePage() {
  return <main className={styles.page}>
    <header className={styles.top}>
      <Link href="/" aria-label="Monova, inicio"><Image className={styles.logo} src="/assets/monova-logo.png" width={2172} height={724} alt="MONOVA" priority /></Link>
      <Link className={styles.back} href="/"><ArrowLeft size={16}/> Volver al inicio</Link>
    </header>
    <section className={styles.intro}>
      <p className={styles.kicker}>EDICIÓN HALLOWEEN 🎃</p>
      <h1>Haz el mejor puntaje y <span>gana una web</span></h1>
      <p>Este Halloween, juega con Monova y compite por una web 100% gratis. Supera las 3 montañas, derrota zombies y fantasmas y consigue tu mejor puntaje.</p>
    </section>
    <MonovaGame contact={contact} />
    <section className={styles.contestRanking} aria-labelledby="ranking-title">
      <p className={styles.kicker}>EL RETO ESTÁ ABIERTO</p>
      <h2 id="ranking-title">El primer lugar está por escribirse.</h2>
      <p>Aún no hay puntajes publicados. Juega, envía tu resultado con «Subir puntaje» y reta a tus amigos.</p>
      <div className={styles.rankingEmpty}><span aria-hidden="true">🏆</span><strong>Tu nombre podría estar aquí</strong><p>La clasificación mostrará los puntajes validados por Monova. Compartir una tarjeta no registra tu participación: envía tu resultado por WhatsApp.</p></div>
    </section>
    <section className={styles.cta}>
      <div><h2>Tu mejor puntaje puede ganar</h2><p>Una web 100% gratis está en juego. Escríbenos para conocer los detalles del concurso.</p></div>
      <a href={contact} target="_blank" rel="noreferrer">Consultar el concurso <ArrowUpRight size={18}/></a>
    </section>
  </main>;
}
