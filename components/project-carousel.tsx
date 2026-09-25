"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import styles from "./agency-home.module.css";

type Project = { name: string; category: string; description: string; image: string; url: string };

export function ProjectCarousel({ projects }: { projects: Project[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const move = (direction: number) => {
    const container = rail.current;
    if (!container) return;
    const target = container.children[Math.max(0, Math.min(projects.length - 1, active + direction))] as HTMLElement;
    container.scrollTo({ left: target.offsetLeft - (container.firstElementChild as HTMLElement).offsetLeft, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  return <>
    <div className={styles.carouselControls}><span>DESLIZA Y EXPLORA <ArrowRight size={17}/></span><div><span>{String(active + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</span><button aria-label="Proyecto anterior" disabled={active === 0} onClick={() => move(-1)}><ArrowLeft size={21}/></button><button aria-label="Proyecto siguiente" disabled={active === projects.length - 1} onClick={() => move(1)}><ArrowRight size={21}/></button></div></div>
    <div className={styles.carouselRail} ref={rail} tabIndex={0} role="region" aria-label="Galería de proyectos, desplázate horizontalmente" onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); } }} onScroll={() => { const container = rail.current; if (!container) return; const cards = Array.from(container.children) as HTMLElement[]; const first = cards[0].offsetLeft; let nearest = 0; cards.forEach((card, index) => { if (Math.abs(card.offsetLeft - first - container.scrollLeft) < Math.abs(cards[nearest].offsetLeft - first - container.scrollLeft)) nearest = index; }); setActive(nearest); }}>
      {projects.map((project, index) => <a className={styles.carouselCard} key={project.name} href={project.url} target="_blank" rel="noreferrer"><div className={styles.carouselVisual}><Image src={`/assets/project-${project.image}.png`} alt={`Proyecto ${project.name}`} fill sizes="(max-width: 700px) 85vw, 65vw"/><span className={styles.carouselNumber}>0{index + 1}</span><span className={styles.carouselOpen}><ArrowUpRight size={28}/></span></div><div className={styles.carouselCaption}><div><span>{project.category}</span><h3>{project.name}</h3></div><p>{project.description}</p></div></a>)}
    </div>
  </>;
}
