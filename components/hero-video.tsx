import { isChristmas } from "@/config/campaign";
import Image from "next/image";
import { HeroLoop } from "./hero-loop";
import styles from "./agency-home.module.css";

export function HeroVideo() {
  return <div className={styles.heroMedia}>
    <Image className={styles.heroPoster} src={isChristmas ? "/assets/santa-portada.webp" : "/assets/black-mode/hero-wide-v1.webp"} alt={isChristmas ? "Monova ata una cinta naranja a un regalo de Navidad" : "Black Mode activado: hasta 30% de descuento en los servicios de Monova"} fill priority sizes="100vw" />
    {!isChristmas && <HeroLoop src="/assets/black-mode/hero-loop.mp4" mobileSrc="/assets/black-mode/hero-loop-mobile.mp4" />}
  </div>;
}
