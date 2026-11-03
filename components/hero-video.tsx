import Image from "next/image";
import styles from "./agency-home.module.css";

export function HeroVideo() {
  return <div className={styles.heroMedia}>
    <Image className={styles.heroPoster} src="/assets/santa-portada.webp" alt="Monova ata una cinta naranja a un regalo de Navidad" fill priority sizes="100vw" />
  </div>;
}
