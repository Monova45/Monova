"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./agency-home.module.css";

/** Silent animated layer that fades in over the hero poster once it can really play. */
export function HeroLoop({ src, mobileSrc }: { src: string; mobileSrc: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // A blocked autoplay simply leaves the poster on screen.
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <video
      ref={videoRef}
      className={`${styles.heroPoster} ${styles.heroLoop}`}
      data-ready={ready}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      onPlaying={() => setReady(true)}
    >
      <source media="(max-width: 700px)" src={mobileSrc} type="video/mp4" />
      <source src={src} type="video/mp4" />
    </video>
  );
}
