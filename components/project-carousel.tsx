"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import styles from "./agency-home.module.css";

type Project = { name: string; category: string; description: string; image: string; url: string };
const INTERVAL = 5600;
const ease = [0.22, 1, 0.36, 1] as const;
const positions = [
  { left: "35%", top: "16%", scale: 1, rotate: 0, opacity: 1, zIndex: 3 },
  { left: "61%", top: "23%", scale: .78, rotate: 10, opacity: .88, zIndex: 2 },
  { left: "79%", top: "28%", scale: .62, rotate: 16, opacity: .58, zIndex: 1 },
  { left: "9%", top: "23%", scale: .78, rotate: -10, opacity: .88, zIndex: 2 },
];
const mobilePositions = [
  { left: "17%", top: "17%", scale: 1, rotate: 0, opacity: 1, zIndex: 3 },
  { left: "66%", top: "24%", scale: .72, rotate: 10, opacity: .78, zIndex: 2 },
  { left: "88%", top: "28%", scale: .55, rotate: 15, opacity: .48, zIndex: 1 },
  { left: "-32%", top: "24%", scale: .72, rotate: -10, opacity: .78, zIndex: 2 },
];

export function ProjectCarousel({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [inView, setInView] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const reduceMotion = useReducedMotion();
  const count = projects.length;
  const current = projects[active];
  const playing = !userPaused && inView && !reduceMotion;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const sync = () => setMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => setInView(entries[0].isIntersecting), { threshold: .25 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || count < 2) return;
    const timer = window.setTimeout(() => setActive(index => (index + 1) % count), INTERVAL);
    return () => window.clearTimeout(timer);
  }, [active, count, playing, cycle]);

  if (!count) return null;

  const select = (index: number) => {
    setActive((index + count) % count);
    setCycle(value => value + 1);
  };

  return <div ref={root} className={styles.coverflow}>
    <div className={styles.coverflowScene}>
      <div className={styles.coverflowGlow} aria-hidden="true" />
      <div className={styles.coverflowBrand}><span className={styles.coverflowBrandMark}><Image src="/assets/monova-mark.svg" width={27} height={22} alt="" /></span><span>MONOVA</span></div>
      <span className={styles.coverflowKicker}>IDEAS QUE FUNCIONAN / PROYECTOS REALES</span>
      <div className={styles.coverflowDeck}>
        {projects.map((project, index) => {
          const slot = (index - active + count) % count;
          const position = (mobile ? mobilePositions : positions)[slot] ?? positions[2];
          return <motion.button key={project.name} type="button" className={styles.coverflowCard} onClick={() => select(index)} aria-label={`Mostrar proyecto ${project.name}`} aria-current={slot === 0 ? "true" : undefined} initial={false} animate={position} transition={{ duration: reduceMotion ? 0 : 1.05, ease }} style={{ zIndex: position.zIndex }}>
            <div className={styles.coverflowCardImage}><Image src={`/assets/project-${project.image}.png`} alt="" fill sizes="(max-width: 700px) 65vw, 32vw" /></div>
            <div className={styles.coverflowCardCaption}><span>0{index + 1} / 0{count}</span><strong>{project.name}</strong></div>
          </motion.button>;
        })}
      </div>
      <motion.div className={styles.coverflowMascot} aria-hidden="true" animate={reduceMotion ? undefined : { y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}><Image src="/assets/monova-portfolio-mascot-v2.png" alt="" fill sizes="(max-width: 700px) 65vw, 38vw" /></motion.div>
      <span className={styles.coverflowSceneLabel}>DISEÑO · TECNOLOGÍA · IMPACTO</span>
    </div>
    <div className={styles.coverflowPlayer}>
      <div className={styles.coverflowPlayerControls}>
        <button type="button" onClick={() => select(active - 1)} aria-label="Proyecto anterior"><ArrowLeft size={19}/></button>
        <button type="button" onClick={() => { setUserPaused(value => !value); setCycle(value => value + 1); }} aria-label={userPaused ? "Reproducir portafolio" : "Pausar portafolio"}>{userPaused ? <Play size={18} fill="currentColor"/> : <Pause size={18} fill="currentColor"/>}</button>
        <button type="button" onClick={() => select(active + 1)} aria-label="Proyecto siguiente"><ArrowRight size={19}/></button>
      </div>
      <div className={styles.coverflowNow}><span>AHORA EN PANTALLA · 0{active + 1} / 0{count}</span><strong>{current.name}</strong><small>{current.category}</small></div>
      <div className={styles.coverflowPlayerEnd}><div className={styles.coverflowTimeline} aria-hidden="true"><span key={`${active}-${cycle}-${playing}`} style={{ animationPlayState: playing ? "running" : "paused" }} /></div><a href={current.url} target="_blank" rel="noreferrer" aria-label={`Visitar proyecto ${current.name} (abre en una pestaña nueva)`}>Ver proyecto <ArrowUpRight size={19}/></a></div>
    </div>
  </div>;
}
