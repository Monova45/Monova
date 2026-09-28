"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, BrainCircuit, Code2, PenTool, Settings, Smartphone, X } from "lucide-react";
import styles from "./agency-home.module.css";

const services = [
  { name: "Desarrollo Web", text: "Sitios y plataformas que generan resultados.", detail: "Creamos sitios corporativos, tiendas y plataformas a medida, con una experiencia rápida y clara en cada dispositivo.", image: "services-scene-web.jpg", icon: Code2 },
  { name: "Aplicaciones", text: "Apps que conectan personas y negocios.", detail: "Diseñamos productos digitales alrededor de tus usuarios y los procesos que hacen único a tu negocio.", image: "services-scene-apps.jpg", icon: Smartphone },
  { name: "Inteligencia Artificial", text: "IA para automatizar, analizar y escalar.", detail: "Integramos asistentes y herramientas de inteligencia artificial para resolver necesidades concretas de tu equipo.", image: "services-scene-ai.jpg", icon: BrainCircuit },
  { name: "Automatización", text: "Procesos más simples, negocios más eficientes.", detail: "Conectamos tus herramientas, información y operaciones para reducir tareas repetitivas y ahorrar tiempo.", image: "services-scene-automation.jpg", icon: Settings },
  { name: "Branding & UX/UI", text: "Marcas y experiencias que inspiran y convierten.", detail: "Damos forma a tu identidad y diseñamos interfaces intuitivas, coherentes y centradas en las personas.", image: "services-scene-brand.jpg", icon: PenTool },
];
const ease = [0.22, 1, 0.36, 1] as const;

export function ServicesScene({ contact }: { contact: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [compact, setCompact] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .25 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || open || userInteracted || reduceMotion) return;
    const timer = window.setInterval(() => setActive(index => (index + 1) % services.length), 5200);
    return () => window.clearInterval(timer);
  }, [visible, open, userInteracted, reduceMotion]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!root.current?.contains(document.activeElement)) return;
      if (event.key === "Escape" && open) setOpen(false);
      if (open) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        setUserInteracted(true);
        setActive(index => (index + (event.key === "ArrowRight" ? 1 : services.length - 1)) % services.length);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const step = (direction: number) => {
    setUserInteracted(true);
    setOpen(false);
    setActive(index => (index + direction + services.length) % services.length);
  };
  const current = services[active];
  const CurrentIcon = current.icon;

  return <div className={styles.servicesScene} ref={root} onMouseEnter={() => setUserInteracted(true)} onTouchStart={() => setUserInteracted(true)}>
    <div className={styles.servicesSceneTop}><span>MONOVA / EXPLORA</span><span>0{active + 1} / 0{services.length}</span></div>
    <div className={styles.servicesGallery} aria-label="Explora los servicios de Monova">
      {services.map((service, index) => {
        let offset = index - active;
        if (offset > 2) offset -= services.length;
        if (offset < -2) offset += services.length;
        const selected = offset === 0;
        const Icon = service.icon;
        const distance = compact ? 164 : 224;
        return <motion.button key={service.name} type="button" className={styles.servicesFloatingCard}
          aria-label={selected ? `Ver detalles de ${service.name}` : `Seleccionar ${service.name}`}
          aria-current={selected ? "true" : undefined}
          onClick={() => { setUserInteracted(true); if (selected) setOpen(true); else { setActive(index); setOpen(false); } }}
          initial={false}
          animate={{ x: offset * distance, y: selected ? 0 : 20 + Math.abs(offset) * 10, scale: selected ? 1.1 : Math.abs(offset) === 1 ? .88 : .75, rotateY: offset * -9, opacity: Math.abs(offset) === 2 ? .85 : 1, zIndex: 5 - Math.abs(offset) }}
          transition={{ duration: reduceMotion ? 0 : .8, ease }}>
          <div className={styles.servicesCardArt}><Image src={`/assets/${service.image}`} alt="" fill sizes="(max-width: 700px) 55vw, 240px" /></div>
          <div className={styles.servicesCardCopy}><span><Icon size={15}/><small>0{index + 1} / CAPACIDADES</small></span><strong>{service.name}</strong><p>{service.text}</p></div>
          <span className={styles.servicesCardArrow} aria-hidden="true"><ArrowUpRight size={17}/></span>
        </motion.button>;
      })}
    </div>
    <div className={styles.servicesFurniture} aria-hidden="true"><Image src="/assets/services-scene-furniture.png" alt="" fill sizes="(max-width: 700px) 330px, 540px" /></div>
    <div className={styles.servicesMascot}><Image src="/assets/monova-seated-v1.png" alt="Monova sentado junto a los servicios" fill sizes="(max-width: 700px) 48vw, 320px" /></div>
    <div className={styles.servicesSceneBottom}>
      <div><span className={styles.servicesSceneEyebrow}>IDEAS QUE FUNCIONAN</span><strong>{current.name}</strong><p>{current.text}</p></div>
    </div>
    <div className={styles.servicesNavigation}><button type="button" onClick={() => step(-1)} aria-label="Servicio anterior"><ArrowLeft size={20}/></button><button type="button" onClick={() => step(1)} aria-label="Siguiente servicio"><ArrowRight size={20}/></button></div>
    <AnimatePresence>
      {open && <motion.div className={styles.servicesDetailBackdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .28 }}>
        <motion.div className={styles.servicesDetailPanel} role="dialog" aria-modal="true" aria-labelledby="services-detail-title"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 28, scale: reduceMotion ? 1 : .93 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : 20, scale: reduceMotion ? 1 : .95 }}
          transition={{ duration: reduceMotion ? 0 : .45, ease }}>
          <div className={styles.servicesDetailArt}><Image src={`/assets/${current.image}`} alt="" fill sizes="(max-width: 700px) 80vw, 460px" /></div>
          <div className={styles.servicesDetailCopy}><span><CurrentIcon size={20}/> MONOVA / CAPACIDADES</span><h3 id="services-detail-title">{current.name}</h3><p>{current.detail}</p><a href={contact} target="_blank" rel="noopener noreferrer">Hablemos <ArrowUpRight size={18}/></a></div>
          <button className={styles.servicesDetailClose} type="button" onClick={() => setOpen(false)} aria-label="Cerrar detalle"><X size={22}/></button>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  </div>;
}
