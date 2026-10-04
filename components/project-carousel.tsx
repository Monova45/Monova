"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Rocket, Zap, Blend, Pause, Play } from "lucide-react";
import styles from "./project-arc.module.css";

type Project = { name: string; category: string; description: string; image: string; url: string; asset?: string };

export function ProjectCarousel({ projects }: { projects: Project[] }) {
  const [paused, setPaused] = useState(false);
  const cards: Project[] = [...projects,
    { name: "Desarrollo Web", category: "MONOVA / SERVICIOS", description: "Sitios y plataformas a medida.", image: "", asset: "/assets/services-scene-web.jpg", url: "#servicios" },
    { name: "Inteligencia Artificial", category: "MONOVA / SERVICIOS", description: "Soluciones inteligentes para tu negocio.", image: "", asset: "/assets/services-scene-ai.jpg", url: "#servicios" },
  ];
  return <div className={styles.portfolio}>
    <div className={styles.scene}>
      <div className={styles.projects} data-paused={paused}>
        {cards.map(project => <a key={project.name} href={project.url} target={project.asset ? undefined : "_blank"} rel="noopener noreferrer" className={styles.project} aria-label={`Ver ${project.name}${project.asset ? "" : " (abre en otra pestaña)"}`}>
          <Image src={project.asset ?? `/assets/project-${project.image === "drokex" ? "drokex-updated" : project.image === "tuma" ? "tuma-site" : project.image}.${project.image === "peluvi" ? "jpg" : "png"}`} alt={project.description} fill sizes="(max-width: 700px) 45vw, 18vw" />
          <div className={styles.caption}><span>{project.category}</span><strong>{project.name}</strong><ArrowUpRight size={18} aria-hidden="true" /></div>
        </a>)}
      </div>
      <button className={styles.motionControl} type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? "Activar movimiento del arco" : "Pausar movimiento del arco"} title={paused ? "Activar movimiento" : "Pausar movimiento"}>{paused ? <Play size={17}/> : <Pause size={17}/>}</button>
      <div className={styles.mascot}><Image src="/assets/monova-mummy-cat.png" alt="El gato de Monova vestido de momia, con sus audífonos blancos y naranjas" fill sizes="(max-width: 700px) 70vw, 30vw" /></div>
      <div className={styles.signature}><Image src="/assets/monova-logo.png" alt="MONOVA" width={2172} height={724} sizes="(max-width: 700px) 75vw, 38vw" /><p>Ideas que funcionan<span>.</span></p></div>
    </div>
    <div className={styles.values}>
      <div><Rocket size={32}/><section><h3>Proyectos reales</h3><p>Marcas que generan impacto.</p></section></div>
      <div><Zap size={32}/><section><h3>Ejecución ágil</h3><p>De la idea al resultado, sin fricción.</p></section></div>
      <div><Blend size={32}/><section><h3>Visión integral</h3><p>Estrategia, diseño y tecnología.</p></section></div>
    </div>
  </div>;
}
