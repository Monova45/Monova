"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import styles from "./agency-home.module.css";

const videos = ["/assets/monova-hero-halloween.mp4", "/assets/monova-hero-commercial-01.mp4?v=2"];

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState(1);
  const [playing, setPlaying] = useState(false);

  const [needsPlay, setNeedsPlay] = useState(false);

  const playVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    void video.play().catch(() => setNeedsPlay(true));
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    void video.play().catch(() => setNeedsPlay(true));
  }, [activeVideo]);

  const changeVideo = (direction: number) => {
    setNeedsPlay(false);
    setPlaying(false);
    setActiveVideo(index => (index + direction + videos.length) % videos.length);
  };

  return <div className={styles.heroMedia} data-contest={activeVideo === 1}>
    <Image className={styles.heroPoster} src="/assets/monova-hero-light.png" alt="" fill priority sizes="100vw" />
    <video key={activeVideo} src={videos[activeVideo]} ref={videoRef} className={`${styles.heroImage} ${playing ? styles.heroImagePlaying : ""}`} autoPlay muted playsInline preload="auto" poster="/assets/monova-hero-light.png" onLoadedData={() => setPlaying(true)} onCanPlay={playVideo} onPlaying={() => { setPlaying(true); setNeedsPlay(false); }} onError={() => setNeedsPlay(true)} onEnded={() => changeVideo(1)} aria-label="Video de presentación de Monova">
    </video>
    {activeVideo === 1 && <Link className={styles.heroGameLink} href="/juego" aria-label="Entrar al juego de Halloween de Monova" />}
    {needsPlay && <button type="button" className={styles.heroVideoPlay} onClick={playVideo}><Play size={22} aria-hidden="true" /> Reproducir video</button>}
    <button type="button" className={`${styles.heroVideoArrow} ${styles.heroVideoPrevious}`} onClick={() => changeVideo(-1)} aria-label="Video anterior" title="Video anterior"><ChevronLeft size={26} aria-hidden="true" /></button>
    <button type="button" className={`${styles.heroVideoArrow} ${styles.heroVideoNext}`} onClick={() => changeVideo(1)} aria-label="Video siguiente" title="Video siguiente"><ChevronRight size={26} aria-hidden="true" /></button>
  </div>;
}
