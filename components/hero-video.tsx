"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./agency-home.module.css";

// The paw reaches the camera near the end of this ten-second clip.
const IMPACT_TIME = 6.7;

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const page = video?.closest("main");
    if (!video || !page) return;
    void video.play().catch(() => {});
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let previousTime = 0;
    let animations: Animation[] = [];
    const syncImpact = () => {
      const time = video.currentTime;
      if (time < previousTime) previousTime = 0;
      if (!reducedMotion.matches && previousTime < IMPACT_TIME && time >= IMPACT_TIME && time < IMPACT_TIME + 0.6) {
        animations.forEach(animation => animation.cancel());
        animations = [page.animate([
          { transform: "translate3d(0, 0, 0)", offset: 0 },
          { transform: "translate3d(-26px, 14px, 0)", offset: 0.06 },
          { transform: "translate3d(24px, -12px, 0)", offset: 0.13 },
          { transform: "translate3d(-21px, -8px, 0)", offset: 0.21 },
          { transform: "translate3d(19px, 11px, 0)", offset: 0.29 },
          { transform: "translate3d(-15px, -9px, 0)", offset: 0.38 },
          { transform: "translate3d(12px, 7px, 0)", offset: 0.47 },
          { transform: "translate3d(-9px, -5px, 0)", offset: 0.57 },
          { transform: "translate3d(6px, 4px, 0)", offset: 0.67 },
          { transform: "translate3d(-4px, -2px, 0)", offset: 0.77 },
          { transform: "translate3d(2px, 1px, 0)", offset: 0.88 },
          { transform: "translate3d(0, 0, 0)", offset: 1 },
        ], { duration: 1000, easing: "linear" })];
      }
      previousTime = time;
    };
    video.addEventListener("timeupdate", syncImpact);
    return () => {
      video.removeEventListener("timeupdate", syncImpact);
      animations.forEach(animation => animation.cancel());
    };
  }, []);

  return <div className={styles.heroMedia}>
    <Image className={styles.heroPoster} src="/assets/monova-hero-light.png" alt="" fill priority sizes="100vw" />
    <video ref={videoRef} className={`${styles.heroImage} ${playing ? styles.heroImagePlaying : ""}`} autoPlay muted loop playsInline preload="auto" poster="/assets/monova-hero-light.png" onPlaying={() => setPlaying(true)} aria-label="Mascota de Monova animada: un gato naranja con traje negro y casco futurista">
      <source src="/assets/monova-mascot-motion.mp4" type="video/mp4" />
    </video>
  </div>;
}
