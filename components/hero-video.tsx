"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./agency-home.module.css";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => {});
  }, []);

  return <div className={styles.heroMedia}>
    <Image className={styles.heroPoster} src="/assets/monova-hero-light.png" alt="" fill priority sizes="100vw" />
    <video ref={videoRef} className={`${styles.heroImage} ${playing ? styles.heroImagePlaying : ""}`} autoPlay muted loop playsInline preload="auto" poster="/assets/monova-hero-light.png" onPlaying={() => setPlaying(true)} aria-label="Video de presentación de Monova">
      <source src="/assets/monova-hero-halloween.mp4" type="video/mp4" />
    </video>
  </div>;
}
