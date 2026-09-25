"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Bot, Camera, Code2, Layers3, MousePointer2, RefreshCw, Smartphone, Sparkles, Workflow, X } from "lucide-react";
import styles from "./monova-web-ar.module.css";

const services = [
  { title: "Desarrollo web", tag: "01 / EXPERIENCIAS", description: "Sitios y plataformas creados para atraer, conectar y convertir.", icon: Code2 },
  { title: "Aplicaciones", tag: "02 / PRODUCTOS", description: "Apps útiles que acercan tu negocio a las personas.", icon: Smartphone },
  { title: "Inteligencia artificial", tag: "03 / INNOVACIÓN", description: "IA aplicada a ideas, datos y tareas reales.", icon: Bot },
  { title: "Automatización", tag: "04 / EFICIENCIA", description: "Procesos conectados para trabajar mejor y avanzar más rápido.", icon: Workflow },
  { title: "Branding & UX/UI", tag: "05 / DISEÑO", description: "Marcas e interfaces memorables, intuitivas y coherentes.", icon: Layers3 },
];

type CameraStatus = "idle" | "loading" | "ready" | "unavailable";

export function MonovaWebAR() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [active, setActive] = useState(0);
  const [danceVideoReady, setDanceVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const service = services[active];
  const Icon = service.icon;

  const stopCamera = useCallback(() => {
    requestRef.current += 1;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const close = useCallback(() => {
    stopCamera();
    setOpen(false);
    setStatus("idle");
  }, [stopCamera]);

  const startCamera = async () => {
    stopCamera();
    setOpen(true);
    setStatus("loading");
    const request = requestRef.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera unavailable");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "environment" } });
      if (request !== requestRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("ready");
    } catch {
      if (request === requestRef.current) {
        stopCamera();
        setStatus("unavailable");
      }
    }
  };

  useEffect(() => {
    if (!open || status !== "ready" || !videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    void video.play().catch(() => {
      stopCamera();
      setStatus("unavailable");
    });
  }, [open, status, stopCamera]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  useEffect(() => () => {
    requestRef.current += 1;
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  return <>
    <button type="button" className={styles.launcher} onClick={startCamera} aria-label="Abrir Monova AR"><span className={styles.launcherIcon}><Camera size={23} strokeWidth={1.9}/><span>AR</span></span><span className={styles.launcherText}>Explora Monova en AR</span></button>
    {open && <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="monova-ar-title">
      <video ref={videoRef} className={styles.camera} autoPlay muted playsInline aria-hidden="true" />
      {status !== "ready" && <div className={styles.preview} aria-hidden="true" />}
      <div className={styles.tint} aria-hidden="true" />
      <header className={styles.topbar}><div className={styles.brand}><span><Image src="/assets/monova-mark.svg" alt="" width={26} height={21}/></span><strong>MONOVA</strong><small>AR EXPERIENCE</small></div><button ref={closeRef} type="button" onClick={close} aria-label="Cerrar experiencia AR"><X size={23}/></button></header>
      <div className={styles.content}>
        <p className={styles.overline}><span className={styles.liveDot}/> {status === "ready" ? "MONOVA BAILA EN TU ESPACIO" : "MONOVA EN MOVIMIENTO"}</p>
        <h2 id="monova-ar-title">Ideas que<br/><em>cobran vida.</em></h2>
        <div className={styles.hologram}>
          <div className={styles.orbit} aria-hidden="true" />
          <div className={styles.orbitTwo} aria-hidden="true" />
          <div className={styles.danceFloor} aria-hidden="true" />
          <div className={styles.danceStage} aria-hidden="true">
            <Image className={`${styles.danceFallback} ${danceVideoReady ? styles.danceFallbackHidden : ""}`} src="/assets/monova-dance-step-one.webp" alt="" fill sizes="(max-width: 700px) 76vw, 36vw" priority />
            <video className={styles.danceVideo} src="/assets/monova-dance-alpha.webm" autoPlay loop muted playsInline preload="auto" onLoadedData={() => setDanceVideoReady(true)} onError={() => setDanceVideoReady(false)} />
          </div>
          <div className={styles.serviceCard} key={service.title}><span className={styles.serviceIcon}><Icon size={24}/></span><span className={styles.serviceTag}>{service.tag}</span><h3>{service.title}</h3><p>{service.description}</p><span className={styles.cardFooter}>MONOVA / LO HACEMOS REAL <ArrowRight size={15}/></span></div>
        </div>
        <div className={styles.servicePicker} aria-label="Explorar servicios de Monova">{services.map((item, index) => <button key={item.title} type="button" className={index === active ? styles.selected : ""} onClick={() => setActive(index)} aria-pressed={index === active}><item.icon size={17}/><span>{item.title}</span></button>)}</div>
      </div>
      <footer className={styles.bottombar}><span><MousePointer2 size={14}/> Toca un servicio para descubrirlo</span>{status === "loading" && <span>Iniciando cámara…</span>}{status === "unavailable" && <div className={styles.cameraHelp}><span>Cámara no disponible aquí. Prueba en Chrome o Safari y permite el acceso.</span><button type="button" onClick={startCamera}><RefreshCw size={15}/> Reintentar</button></div>}{status === "ready" && <span><Sparkles size={15}/> Cámara activa · solo en tu navegador</span>}</footer>
    </div>}
  </>;
}
