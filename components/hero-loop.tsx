"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./agency-home.module.css";

/** The left of the frame is clean again this many seconds before the film ends. */
const COPY_LEAD_SECONDS = 0.65;
const START_TIMEOUT_MS = 3000;
const PLAYBACK_TIMEOUT_MS = 15000;

/** Silent intro that plays once over the hero poster, rests on its last frame and hands over to the copy. */
export function HeroLoop({ src, mobileSrc }: { src: string; mobileSrc: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<number>(undefined);
  const [ready, setReady] = useState(false);
  const [copyVisible, setCopyVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // If the film cannot start promptly the visitor gets the poster and the copy instead.
    const skipFilm = () => {
      video.pause();
      setCopyVisible(true);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(skipFilm);
      return () => cancelAnimationFrame(frame);
    }
    timeoutRef.current = window.setTimeout(skipFilm, START_TIMEOUT_MS);
    video.play().catch(skipFilm);
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  const handlePlaying = () => {
    setReady(true);
    window.clearTimeout(timeoutRef.current);
    // A film that stalls midway must never leave the headline hidden.
    timeoutRef.current = window.setTimeout(() => setCopyVisible(true), PLAYBACK_TIMEOUT_MS);
  };

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const { currentTime, duration } = event.currentTarget;
    if (duration && currentTime >= duration - COPY_LEAD_SECONDS) setCopyVisible(true);
  };

  return (
    <>
      <video
        ref={videoRef}
        className={`${styles.heroPoster} ${styles.heroLoop}`}
        data-ready={ready}
        data-copy={copyVisible}
        muted
        playsInline
        preload="none"
        aria-hidden="true"
        onPlaying={handlePlaying}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setCopyVisible(true)}
      >
        <source media="(max-width: 700px)" src={mobileSrc} type="video/mp4" />
        <source src={src} type="video/mp4" />
      </video>
      <noscript>
        <style>{`.${styles.heroCopy} *,.${styles.heroBottom}{opacity:1!important;visibility:visible!important;transform:none!important}`}</style>
      </noscript>
    </>
  );
}
