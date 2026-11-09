"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import styles from "./black-campaign.module.css";

type Slide = {
  name: string;
  description: string;
  poster: string;
  alt: string;
  /** Video slides play this file; image slides stay on screen for `seconds`. */
  video?: string;
  seconds?: number;
};

const asset = (file: string) => `/assets/black-mode/${file}`;

// The creativo and activado .mp4 files hold each other's footage, so they are crossed here on purpose.
const slides: Slide[] = [
  { name: "Black Mode: creativo", description: "Diseño, video y contenido para tu marca.", poster: asset("creativo.webp"), alt: "Black Mode: creativo", video: asset("activado.mp4") },
  { name: "Todo para crecer", description: "Web, branding, marketing e IA en un solo lugar.", poster: asset("crecer.webp"), alt: "Monova señala en un panel holográfico web y e-commerce, branding y diseño, marketing digital y automatización e IA", seconds: 5 },
  { name: "Black Mode: activado", description: "Tu próximo proyecto empieza aquí.", poster: asset("activado.webp"), alt: "Black Mode: activado", video: asset("creativo.mp4") },
  { name: "Soluciones digitales", description: "Desarrollo web, branding, marketing y automatización.", poster: asset("soluciones.webp"), alt: "Monova con gafas oscuras frente a pantallas de desarrollo web, branding, marketing digital y automatización", seconds: 5 },
  { name: "Precio Black", description: "Grandes ideas, precios especiales.", poster: asset("precio.webp"), alt: "Precio Black", video: asset("precio.mp4") },
  { name: "Ideas que funcionan", description: "Hasta 30% OFF en tu próximo proyecto.", poster: asset("ideas.webp"), alt: "Monova de brazos cruzados junto a sus servicios y un cupón de hasta 30% de descuento", seconds: 5 },
];

const phoneLines = (
  <>
    <rect x="10" y="10" width="340" height="720" rx="56" />
    <rect x="22" y="22" width="316" height="696" rx="44" />
    <rect x="135" y="36" width="90" height="26" rx="13" />
    <circle cx="208" cy="49" r="5" />
    <path d="M4 132v26M4 186v50M4 250v50M356 200v78" />
  </>
);

export function BlackPhoneReel() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [near, setNear] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLElement>(null);
  const visible = useRef(false);
  const activeRef = useRef(0);
  const imageElapsed = useRef(0);
  const reducedMotion = useRef(false);
  // True while the reel must stay still: the visitor paused it, or prefers reduced motion.
  const held = useRef(false);

  const play = useCallback(() => {
    if (slides[activeRef.current].seconds) {
      setPlaying(true);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    video.play().catch((error: DOMException) => {
      if (error.name !== "NotAllowedError") return;
      // Browsers can refuse audible playback without a gesture; keep the reel moving silently.
      if (!video.muted) {
        video.muted = true;
        setMuted(true);
        video.play().catch(() => setPlaying(false));
      } else {
        setPlaying(false);
      }
    });
  }, []);

  const pause = useCallback(() => {
    if (slides[activeRef.current].seconds) setPlaying(false);
    else videoRef.current?.pause();
  }, []);

  const advance = useCallback(() => {
    if (reducedMotion.current) {
      held.current = true;
      imageElapsed.current = 0;
      setPlaying(false);
      return;
    }
    setActive((current) => (current + 1) % slides.length);
  }, []);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    held.current = reducedMotion.current;
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      if (entry.isIntersecting) {
        setNear(true);
        if (!held.current) play();
      } else {
        pause();
      }
    }, { threshold: 0.35 });
    observer.observe(root);
    return () => observer.disconnect();
  }, [play, pause]);

  useEffect(() => {
    activeRef.current = active;
    imageElapsed.current = 0;
    if (progressRef.current) progressRef.current.style.transform = "scaleX(0)";
    const video = videoRef.current;
    // The hidden element may already hold the upcoming film; keep it silent and rewound.
    if (video && slides[active].seconds) {
      video.pause();
      video.currentTime = 0;
    }
    if (visible.current && !held.current) play();
  }, [active, play]);

  useEffect(() => {
    const seconds = slides[active].seconds;
    if (!playing || !seconds) return;
    const total = seconds * 1000;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      imageElapsed.current += now - last;
      last = now;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${Math.min(imageElapsed.current / total, 1)})`;
      if (imageElapsed.current >= total) advance();
      else frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [active, playing, advance]);

  const select = (index: number) => {
    held.current = false;
    if (index === active) play();
    else setActive(index);
  };

  const toggle = () => {
    if (playing) {
      held.current = true;
      pause();
    } else {
      held.current = false;
      play();
    }
  };

  // Video events must not drive the play state while an image slide is timing itself.
  const syncVideoPlaying = (value: boolean) => {
    if (!slides[activeRef.current].seconds) setPlaying(value);
  };

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const { currentTime, duration } = event.currentTarget;
    if (progressRef.current && duration) progressRef.current.style.transform = `scaleX(${currentTime / duration})`;
  };

  const slide = slides[active];
  // During an image slide the hidden video element buffers the film that comes next.
  const videoSlide = slide.video ? slide : slides[(active + 1) % slides.length];

  return (
    <div className={styles.reel} ref={rootRef}>
      <div className={styles.phone}>
        <div className={styles.phoneScreen}>
          <video
            ref={videoRef}
            src={videoSlide.video}
            poster={videoSlide.poster}
            preload={near ? "auto" : "none"}
            muted={muted}
            playsInline
            aria-label={videoSlide.name}
            onClick={toggle}
            onPlay={() => syncVideoPlaying(true)}
            onPause={() => syncVideoPlaying(false)}
            onEnded={advance}
            onTimeUpdate={handleTimeUpdate}
          />
          {slides.map((item, index) => item.seconds ? (
            <Image
              key={item.poster}
              className={styles.phoneImage}
              data-active={index === active}
              src={item.poster}
              alt={index === active ? item.alt : ""}
              fill
              sizes="340px"
              onClick={toggle}
            />
          ) : null)}
          <span key={active} className={styles.phoneFlash} aria-hidden="true" />
          <div className={styles.phoneTop} aria-hidden="true">
            <div className={styles.phoneBars}>
              {slides.map((item, index) => (
                <i key={item.poster} data-state={index < active ? "done" : index === active ? "active" : "next"}>
                  <b ref={index === active ? progressRef : undefined} />
                </i>
              ))}
            </div>
            <p>monova <span>· Black Mode</span></p>
          </div>
          <div className={styles.phoneControls}>
            <button type="button" onClick={toggle} aria-label={playing ? "Pausar" : "Reproducir"}>
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? "Activar sonido" : "Silenciar"}>
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>
        <svg className={styles.phoneFrame} viewBox="0 0 360 740" aria-hidden="true">
          <g className={styles.phoneTube}>{phoneLines}</g>
          <g className={styles.phoneCore}>{phoneLines}</g>
        </svg>
      </div>
      <ol className={styles.reelList}>
        {slides.map((item, index) => (
          <li key={item.poster}>
            <button type="button" onClick={() => select(index)} aria-current={index === active ? "true" : undefined}>
              <small>0{index + 1}</small>
              <span>
                <strong>{item.name}</strong>
                <em>{item.description}</em>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
