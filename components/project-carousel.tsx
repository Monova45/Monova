"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Rocket, Zap, Blend, Pause, Play } from "lucide-react";
import styles from "./project-arc.module.css";

type Project = { name: string; category: string; description: string; image: string; url: string; asset?: string };

export function ProjectCarousel({ projects }: { projects: Project[] }) {
  const [paused, setPaused] = useState(false);
  const [out, setOut] = useState(false);
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = scene.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setOut(true); observer.disconnect(); } }, { threshold: 0.25 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const cards = projects;
  const slots = Array.from({ length: Math.max(16, cards.length) }, (_, index) => ({ project: cards[index % cards.length], duplicate: index >= cards.length }));
  return <div className={styles.portfolio}>
    <div ref={scene} className={styles.scene}>
      <div className={styles.projects} data-paused={paused} data-out={out}>
        {slots.map(({ project, duplicate }, index) => {
          return <div key={index} className={styles.slot} data-duplicate={duplicate} aria-hidden={duplicate || undefined} style={{ "--a": `${(360 / slots.length) * index}deg`, "--i": index } as React.CSSProperties}><a href={project.url} tabIndex={duplicate ? -1 : undefined} target={project.asset ? undefined : "_blank"} rel="noopener noreferrer" className={styles.project} data-brand={project.image} aria-label={`Ver ${project.name}${project.asset ? "" : " (abre en otra pestaña)"}`}>
          {project.image === "peluvi" ? <Image src="/assets/project-peluvi.jpg" alt={project.description} fill sizes="(max-width: 700px) 70vw, 18vw" /> : <Image className={styles.posterArtwork} src={`/assets/posters/${project.image}.svg`} alt={project.description} fill sizes="(max-width: 700px) 70vw, 18vw" />}
          <div className={project.image === "peluvi" ? styles.peluviPosterTitle : styles.posterTitle} aria-hidden="true"><span>{({ kliniu: "ESPACIOS QUE BRILLAN", drokex: "SIN FRONTERAS", unipars: "SIEMPRE EN MARCHA", "4ustudio": "ENCUENTRA TU SONIDO", tuma: "OBJETOS CON ALMA", geu: "PRECISIÓN INDUSTRIAL", peluvi: "SU MUNDO, MÁS FELIZ", lorigine: "BELLEZA NATURAL" } as Record<string, string>)[project.image]}</span><strong>{project.image === "peluvi" ? <>peluvi<span>®</span></> : project.name}</strong></div>
          <div className={styles.caption}><span>{project.category.split(" · ")[0]}</span><strong>{project.name}</strong><ArrowUpRight size={18} aria-hidden="true" /></div>
        </a></div>; })}
      </div>
      <button className={styles.motionControl} type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? "Activar movimiento del arco" : "Pausar movimiento del arco"} title={paused ? "Activar movimiento" : "Pausar movimiento"}>{paused ? <Play size={17}/> : <Pause size={17}/>}</button>
      <div className={styles.mascot}><video src="/assets/monova-mummy-walk.mp4" poster="/assets/monova-mummy-cat.png" autoPlay muted loop playsInline preload="auto" aria-label="El gato de Monova vestido de momia caminando hacia el frente, con sus audífonos blancos y naranjas" /></div>
      <div className={styles.signature}><Image src="/assets/monova-logo.png" alt="MONOVA" width={2172} height={724} sizes="(max-width: 700px) 75vw, 38vw" /><p>Ideas que funcionan<span>.</span></p></div>
    </div>
    <div className={styles.values}>
      <div><Rocket size={32}/><section><h3>Proyectos reales</h3><p>Marcas que generan impacto.</p></section></div>
      <div><Zap size={32}/><section><h3>Ejecución ágil</h3><p>De la idea al resultado, sin fricción.</p></section></div>
      <div><Blend size={32}/><section><h3>Visión integral</h3><p>Estrategia, diseño y tecnología.</p></section></div>
    </div>
  </div>;
}
