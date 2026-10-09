"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./agency-home.module.css";

const videos = ["/assets/monova-hero-halloween.mp4", "/assets/monova-hero-commercial-01.mp4"];

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState(1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => {});
  }, [activeVideo]);

  const changeVideo = (direction: number) => {
    setPlaying(false);
    setActiveVideo(index => (index + direction + videos.length) % videos.length);
  };

  return <div className={styles.heroMedia} data-contest={activeVideo === 1}>
    <Image className={styles.heroPoster} src="/assets/monova-hero-light.png" alt="" fill priority sizes="100vw" />
    <video key={activeVideo} src={videos[activeVideo]} ref={videoRef} className={`${styles.heroImage} ${playing ? styles.heroImagePlaying : ""}`} autoPlay muted playsInline preload="auto" poster="/assets/monova-hero-light.png" onPlaying={() => setPlaying(true)} onEnded={() => changeVideo(1)} aria-label="Video de presentación de Monova">
    </video>
    {activeVideo === 1 && <Link className={styles.heroGameLink} href="/juego" aria-label="Entrar al juego de Halloween de Monova" />}
    <button type="button" className={`${styles.heroVideoArrow} ${styles.heroVideoPrevious}`} onClick={() => changeVideo(-1)} aria-label="Video anterior" title="Video anterior"><ChevronLeft size={26} aria-hidden="true" /></button>
    <button type="button" className={`${styles.heroVideoArrow} ${styles.heroVideoNext}`} onClick={() => changeVideo(1)} aria-label="Video siguiente" title="Video siguiente"><ChevronRight size={26} aria-hidden="true" /></button>
  </div>;
}
