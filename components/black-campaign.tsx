import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { BlackPhoneReel } from "./black-phone-reel";
import styles from "./black-campaign.module.css";

export function BlackCampaign({ contact }: { contact: string }) {
  return <section className={styles.campaign} id="black-mode" aria-labelledby="black-title">
    <div className={styles.heading}><div><p className={styles.kicker}>TECNOLOGÍA + CREATIVIDAD</p><h2 id="black-title">Elige qué quieres<br/><span>hacer posible.</span></h2></div><p>Una nueva web. Una marca con personalidad. Contenido que se hace notar. Activamos tu siguiente paso.</p></div>
    <a className={styles.creativeBanner} href={`${contact.split("?")[0]}?text=${encodeURIComponent("Hola Monova, quiero cotizar producción audiovisual y diseño con la oferta Black Mode de hasta 30% de descuento.")}`} target="_blank" rel="noopener noreferrer">
      <Image src="/assets/black-mode/creative-wide-v1.webp" alt="Monova con su cámara profesional en un estudio creativo negro y naranja" fill sizes="100vw" />
      <div><p className={styles.kicker}>BLACK MODE / CREATIVO</p><h2 className={styles.offerTitle}>Tu marca. <span>Imposible de ignorar.</span></h2><div className={styles.blackTicket} aria-label="Hasta 30% de descuento"><div className={styles.ticketValue}><small>Hasta</small><strong>30<span>%</span></strong><b>OFF</b></div><div className={styles.ticketLabel}><span>PRECIO</span><strong>BLACK<span>⚡</span></strong><small>Tu siguiente gran proyecto.</small></div></div><p>Video, diseño, fotografía y animación.</p><span className={styles.creativeCta}>Cotiza tu proyecto <ArrowRight size={20}/></span></div>
    </a>
    <div className={styles.heading}><div><p className={styles.kicker}>MONOVA EN ACCIÓN</p><h2>Así se vive<br/><span>el Black Mode.</span></h2></div><p>Míralo en acción. Imagina lo que podemos crear para tu marca.</p></div>
    <BlackPhoneReel />
    <p className={styles.note}>Descuento de hasta el 30%. Solicita una cotización para conocer el descuento aplicable al alcance de tu proyecto.</p>
  </section>;
}
