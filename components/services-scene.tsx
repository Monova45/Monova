"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ArrowLeft, Globe, ShoppingBag, PanelsTopLeft, Smartphone, Users, Rocket, Bot, FileSearch, ChartColumn, Workflow, BellRing, CalendarClock, Palette, MousePointer2, Route, TabletSmartphone, Search, Plug, Waypoints, Braces, CircleCheck, Lightbulb, ShieldCheck, Network, Activity, BookOpen, Layers, PenTool } from "lucide-react";
import styles from "./services-spectrum.module.css";

const serviceIcons = {
  web: { main: Globe, solutions: [Globe, ShoppingBag, PanelsTopLeft], deliverables: [TabletSmartphone, Search, Plug] },
  apps: { main: Smartphone, solutions: [Smartphone, Users, Rocket], deliverables: [Waypoints, Braces, CircleCheck] },
  ai: { main: Bot, solutions: [Bot, FileSearch, ChartColumn], deliverables: [Lightbulb, Plug, ShieldCheck] },
  automation: { main: Workflow, solutions: [Workflow, BellRing, CalendarClock], deliverables: [Route, Network, Activity] },
  brand: { main: Palette, solutions: [Palette, MousePointer2, Route], deliverables: [BookOpen, PenTool, Layers] },
};
const services = [
  { id: "web", name: "Desarrollo Web", color: "#ff5106", ink: "#000000", accent: "#000000", tint: "#ffffff", text: "Tu negocio, abierto al mundo.", detail: "Sitios y plataformas que combinan una identidad propia con una experiencia rápida y clara en cada dispositivo.", solutions: ["Sitios corporativos y landing pages", "Tiendas online y catálogos", "Plataformas y portales a medida"], deliverables: ["Diseño adaptable a móvil", "SEO técnico y analítica", "Formularios e integraciones"] },
  { id: "apps", name: "Aplicaciones", color: "#000000", ink: "#ffffff", accent: "#000000", tint: "#ffffff", text: "Grandes ideas. Al alcance de tu mano.", detail: "Productos digitales diseñados alrededor de tus usuarios y de los procesos que hacen único a tu negocio.", solutions: ["Aplicaciones móviles y web", "Portales de clientes y proveedores", "MVP para validar tu producto"], deliverables: ["Flujos y prototipo interactivo", "Desarrollo e integración de APIs", "Pruebas y acompañamiento al lanzamiento"] },
  { id: "ai", name: "Inteligencia Artificial", color: "#ffffff", ink: "#000000", accent: "#000000", tint: "#ffffff", text: "Una nueva forma de hacer posible.", detail: "Integramos inteligencia artificial para resolver necesidades concretas, con criterios de calidad y supervisión humana.", solutions: ["Asistentes para clientes y equipos", "Búsqueda sobre tus documentos", "Clasificación y análisis de información"], deliverables: ["Diseño de casos de uso", "Integración con tus herramientas", "Evaluación y controles de respuesta"] },
  { id: "automation", name: "Automatización", color: "#ff5106", ink: "#000000", accent: "#000000", tint: "#ffffff", text: "Menos tareas. Más posibilidades.", detail: "Conectamos tus herramientas, información y operaciones para reducir tareas repetitivas y recuperar tiempo.", solutions: ["Flujos entre CRM, ventas y operaciones", "Seguimiento de leads y notificaciones", "Reportes y tareas programadas"], deliverables: ["Mapa del proceso", "Integraciones y reglas de negocio", "Monitoreo y manejo de errores"] },
  { id: "brand", name: "Branding & UX/UI", color: "#000000", ink: "#ffffff", accent: "#000000", tint: "#ffffff", text: "Una identidad que se siente tuya.", detail: "Damos forma a tu marca y diseñamos experiencias intuitivas, coherentes y centradas en las personas.", solutions: ["Identidad visual y dirección de marca", "Interfaces web y móviles", "Mejora de experiencias y flujos"], deliverables: ["Sistema visual y guía de marca", "Prototipos navegables", "Componentes y archivos para desarrollo"] },
];

export function ServicesScene({ contact }: { contact: string }) {
  const [active, setActive] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const reduceMotion = useReducedMotion();
  const current = active === null ? null : services[active];
  const icons = current ? serviceIcons[current.id as keyof typeof serviceIcons] : null;
  const MainIcon = icons?.main;
  const close = () => { setActive(null); setHovered(null); opener.current?.focus({ preventScroll: true }); };
  useEffect(() => {
    if (active !== null) closeButton.current?.focus({ preventScroll: true });
    else opener.current?.focus({ preventScroll: true });
  }, [active]);
  const palette = (service: typeof services[number]) => ({ "--tone": service.color, "--tint": service.tint, "--ink": service.ink, "--accent": service.accent } as CSSProperties);
  const duration = reduceMotion ? 0 : .85;
  const ease = [.22, 1, .36, 1] as const;
  return <div className={styles.spectrum} onKeyDown={event => { if (event.key === "Escape" && active !== null) { event.preventDefault(); close(); } }}>
    <div className={styles.top}><span>UN EQUIPO. CINCO FORMAS DE CREAR.</span><span>MONOVA / SERVICIOS</span></div>
    <div className={styles.stage} style={{ background: current?.color }} data-open={active !== null} onMouseLeave={() => setHovered(null)}>
      {services.map((service, index) => {
        const selected = active === index;
        const width = active !== null ? (selected ? 55 : 20) : hovered === null ? 20 : hovered === index ? 28 : 18;
        const left = active !== null ? selected ? 0 : index < active ? -25 - (active - index) * 20 : 100 + (index - active) * 20 : hovered === null ? index * 20 : index * 18 + (index > hovered ? 10 : 0);
        return <motion.div key={service.id} className={styles.strip} style={palette(service)} data-selected={selected} aria-hidden={active !== null && !selected}
          initial={false} animate={{ left: `${left}%`, width: `${width}%` }} transition={{ duration, ease }}>
          <button ref={element => { if (selected && element) opener.current = element; }} type="button" className={styles.stripButton}
            onMouseEnter={() => { if (active === null) setHovered(index); }} onFocus={() => { if (active === null) setHovered(index); }} onBlur={() => setHovered(null)}
            onClick={event => { opener.current = event.currentTarget; setActive(index); }} aria-label={`Ver detalles de ${service.name}`} aria-expanded={selected} aria-controls="service-details" tabIndex={active === null ? 0 : -1} disabled={active !== null}>
            <motion.span className={styles.stripLabel} animate={{ opacity: active === null ? 1 : 0 }} transition={{ duration: reduceMotion ? 0 : .2 }}><small>0{index + 1} / MONOVA</small><strong>{service.name}</strong></motion.span>
            <motion.div className={styles.stripMascot} initial={false} animate={{ width: selected ? "76%" : "100%", left: selected ? "24%" : "0%", top: selected ? "22%" : "19%", height: selected ? "75%" : "67%" }} transition={{ duration, ease }}><Image src={`/assets/services/monova-${service.id}-standing.png`} alt={`Monova de ${service.name}`} fill unoptimized loading="eager" sizes="(max-width: 700px) 320px, 500px"/></motion.div>
            <motion.span className={styles.stripExplore} animate={{ opacity: active === null ? 1 : 0 }} transition={{ duration: reduceMotion ? 0 : .2 }}>EXPLORAR <ArrowUpRight size={19}/></motion.span>
          </button>
          <AnimatePresence>{selected && <motion.div className={styles.expandedTitle} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .45, delay: reduceMotion ? 0 : .25 }}><span>MONOVA / {service.name}</span><h3>{service.text}</h3></motion.div>}</AnimatePresence>
        </motion.div>;
      })}
      <AnimatePresence>{current && <motion.aside key={current.id} id="service-details" aria-labelledby="service-title" className={styles.inlineDetail} style={palette(current)} initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .65, ease, delay: reduceMotion ? 0 : .15 }}>
        <div className={styles.inlineCopy}>
          <div className={styles.detailEyebrow}><span>EL SIGUIENTE PASO PARA TU MARCA</span><span>0{active! + 1} / 05</span></div>
          <div className={styles.detailTitle}>{MainIcon && <span className={styles.serviceIcon}><MainIcon size={27} strokeWidth={1.7} aria-hidden="true"/></span>}<h2 id="service-title">{current.name}</h2></div><p>{current.detail}</p>
          <h4>Lo que podemos crear juntos</h4>
          <ul className={styles.solutionCards}>{current.solutions.map((item, index) => { const Icon = icons!.solutions[index]; return <li key={item}><span className={styles.solutionIcon}><Icon size={22} strokeWidth={1.6} aria-hidden="true"/></span><strong>{item}</strong></li>; })}</ul>
          <div className={styles.deliverables}><h4>De la idea a algo tangible</h4><ul>{current.deliverables.map((item, index) => { const Icon = icons!.deliverables[index]; return <li key={item}><Icon size={18} strokeWidth={1.6} aria-hidden="true"/><span>{item}</span></li>; })}</ul></div>
          <a className={styles.detailCta} href={`${contact.split("?")[0]}?text=${encodeURIComponent(`Hola Monova, me interesa el servicio de ${current.name}. Quiero conversar sobre mi proyecto.`)}`} target="_blank" rel="noopener noreferrer"><span>Cuéntanos tu idea<small>Hablemos por WhatsApp</small></span><ArrowUpRight size={23}/></a>
          <small>Alcance a tu medida. Definimos juntos los entregables.</small>
        </div>
      </motion.aside>}</AnimatePresence>
      {current && <button ref={closeButton} type="button" className={styles.back} onClick={close} aria-label="Volver a todos los servicios"><ArrowLeft size={16}/> Todos los servicios</button>}
    </div>
    <div className={styles.bottom}><strong>{current ? current.name : "Elige un color. Descubre lo que podemos crear."}</strong><span>ESTRATEGIA + DISEÑO + TECNOLOGÍA</span></div>
  </div>;
}
