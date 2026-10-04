"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ArrowLeft, ArrowRight, X, Globe, ShoppingBag, PanelsTopLeft, Smartphone, Users, Rocket, Bot, FileSearch, ChartColumn, Workflow, BellRing, CalendarClock, Palette, MousePointer2, Route, TabletSmartphone, Search, Plug, Waypoints, Braces, CircleCheck, Lightbulb, ShieldCheck, Network, Activity, BookOpen, Layers, PenTool, AppWindow, Brain, Settings, Brush } from "lucide-react";
import styles from "./services-fire.module.css";
const serviceIcons = {
  web: { main: AppWindow, solutions: [Globe, ShoppingBag, PanelsTopLeft], deliverables: [TabletSmartphone, Search, Plug] },
  apps: { main: Smartphone, solutions: [Smartphone, Users, Rocket], deliverables: [Waypoints, Braces, CircleCheck] },
  ai: { main: Brain, solutions: [Bot, FileSearch, ChartColumn], deliverables: [Lightbulb, Plug, ShieldCheck] },
  automation: { main: Settings, solutions: [Workflow, BellRing, CalendarClock], deliverables: [Route, Network, Activity] },
  brand: { main: Brush, solutions: [Palette, MousePointer2, Route], deliverables: [BookOpen, PenTool, Layers] },
};
const services = [
  { id: "web", name: "Desarrollo Web", color: "#ff5106", ink: "#000000", accent: "#000000", tint: "#ffffff", text: "Tu negocio, abierto al mundo.", detail: "Sitios y plataformas que combinan una identidad propia con una experiencia rápida y clara en cada dispositivo.", solutions: ["Sitios corporativos y landing pages", "Tiendas online y catálogos", "Plataformas y portales a medida"], deliverables: ["Diseño adaptable a móvil", "SEO técnico y analítica", "Formularios e integraciones"] },
  { id: "apps", name: "Aplicaciones", color: "#000000", ink: "#ffffff", accent: "#000000", tint: "#ffffff", text: "Grandes ideas. Al alcance de tu mano.", detail: "Productos digitales diseñados alrededor de tus usuarios y de los procesos que hacen único a tu negocio.", solutions: ["Aplicaciones móviles y web", "Portales de clientes y proveedores", "MVP para validar tu producto"], deliverables: ["Flujos y prototipo interactivo", "Desarrollo e integración de APIs", "Pruebas y acompañamiento al lanzamiento"] },
  { id: "ai", name: "Inteligencia Artificial", color: "#ffffff", ink: "#000000", accent: "#000000", tint: "#ffffff", text: "Una nueva forma de hacer posible.", detail: "Integramos inteligencia artificial para resolver necesidades concretas, con criterios de calidad y supervisión humana.", solutions: ["Asistentes para clientes y equipos", "Búsqueda sobre tus documentos", "Clasificación y análisis de información"], deliverables: ["Diseño de casos de uso", "Integración con tus herramientas", "Evaluación y controles de respuesta"] },
  { id: "automation", name: "Automatización", color: "#ff5106", ink: "#000000", accent: "#000000", tint: "#ffffff", text: "Menos tareas. Más posibilidades.", detail: "Conectamos tus herramientas, información y operaciones para reducir tareas repetitivas y recuperar tiempo.", solutions: ["Flujos entre CRM, ventas y operaciones", "Seguimiento de leads y notificaciones", "Reportes y tareas programadas"], deliverables: ["Mapa del proceso", "Integraciones y reglas de negocio", "Monitoreo y manejo de errores"] },
  { id: "brand", name: "Branding & UX/UI", color: "#000000", ink: "#ffffff", accent: "#000000", tint: "#ffffff", text: "Una identidad que se siente tuya.", detail: "Damos forma a tu marca y diseñamos experiencias intuitivas, coherentes y centradas en las personas.", solutions: ["Identidad visual y dirección de marca", "Interfaces web y móviles", "Mejora de experiencias y flujos"], deliverables: ["Sistema visual y guía de marca", "Prototipos navegables", "Componentes y archivos para desarrollo"] },
];


export function ServicesScene({ contact }: { contact: string }) {
  const [selected, setSelected] = useState(2);
  const [expanded, setExpanded] = useState(false);
  const detail = useRef<HTMLDivElement>(null);
  const explore = useRef<HTMLButtonElement>(null);
  const current = services[selected];
  useEffect(() => { if (expanded) detail.current?.focus({ preventScroll: true }); }, [expanded]);
  const [hovering, setHovering] = useState(false);
  useEffect(() => {
    if (expanded || hovering || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setSelected(value => (value + 1) % services.length), 3800);
    return () => window.clearInterval(timer);
  }, [expanded, hovering]);
  const close = () => { setExpanded(false); explore.current?.focus({ preventScroll: true }); };
  return <div className={styles.scene} onKeyDown={event => { if (event.key === "Escape" && expanded) close(); }}>
    <div className={styles.mascot}><Image src="/assets/monova-services-skeleton.png" alt="Gato Monova con traje de esqueleto guiñando un ojo" fill sizes="(max-width: 700px) 80vw, 40vw" /></div>
    <div className={styles.shade} />
    <div className={styles.copy}>
      <p className={styles.eyebrow}>IDEAS QUE CREAN UN MUNDO MEJOR</p>
      <h3>Tecnología<br/>con <span>propósito.</span></h3>
      <p>Creamos soluciones digitales que impulsan personas, marcas y negocios hacia un futuro más grande.</p>
      <button ref={explore} className={styles.explore} onClick={() => setExpanded(true)} aria-expanded={expanded} aria-controls="service-details">Explorar <ArrowRight size={22}/></button>
    </div>
    <div className={styles.carousel} aria-label="Servicios" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)} onFocus={() => setHovering(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setHovering(false); }}>
      <button className={styles.previous} onClick={() => { setSelected((selected + 4) % 5); setExpanded(false); }} aria-label="Servicio anterior" title="Servicio anterior"><ArrowLeft/></button>
      <div className={styles.cards}>
        {services.map((service,index) => {
          const offset = (index - selected + 7) % 5 - 2;
          const Icon = serviceIcons[service.id as keyof typeof serviceIcons].main;
          return <button key={service.id} className={styles.card} data-offset={offset} aria-pressed={selected === index} aria-label={selected === index ? `Ver detalles de ${service.name}` : `Seleccionar ${service.name}`} onClick={() => { if (selected === index) setExpanded(true); else {setSelected(index); setExpanded(false);} }}>
            <span className={styles.iconTile}><Icon size={30} strokeWidth={1.8}/></span><strong>{service.name}</strong><span className={styles.cardText}>{service.text}</span><span className={styles.cardArrow}><ArrowRight size={20}/></span>
          </button>;
        })}
      </div>
      <button className={styles.next} onClick={() => {setSelected((selected + 1) % 5); setExpanded(false);}} aria-label="Servicio siguiente" title="Servicio siguiente"><ArrowRight/></button>
    </div>
    {expanded && <div className={styles.backdrop} onClick={close} aria-hidden="true" />}
    {expanded && (() => { const icons = serviceIcons[current.id as keyof typeof serviceIcons]; const MainIcon = icons.main; return <div ref={detail} tabIndex={-1} id="service-details" className={styles.detail} role="dialog" aria-labelledby="service-title">
      <button className={styles.close} onClick={close} aria-label="Cerrar detalles" title="Cerrar detalles"><X size={20}/></button>
      <div className={styles.detailHead}><span className={styles.detailIcon}><MainIcon size={30} strokeWidth={1.8}/></span><div><p className={styles.detailKicker}>SERVICIO {String(selected + 1).padStart(2, "0")} / 05</p><h3 id="service-title">{current.name}</h3></div></div>
      <p className={styles.detailLead}>{current.detail}</p>
      <h4>Lo que podemos crear juntos</h4>
      <ul className={styles.solutionList}>{current.solutions.map((item, index) => { const ItemIcon = icons.solutions[index]; return <li key={item}><span><ItemIcon size={18}/></span>{item}</li>; })}</ul>
      <h4>Entregables</h4>
      <ul className={styles.deliverableList}>{current.deliverables.map((item, index) => { const ItemIcon = icons.deliverables[index]; return <li key={item}><ItemIcon size={16}/>{item}</li>; })}</ul>
      <a className={styles.detailCta} href={`${contact.split("?")[0]}?text=${encodeURIComponent(`Hola Monova, me interesa el servicio de ${current.name}. Quiero conversar sobre mi proyecto.`)}`} target="_blank" rel="noopener noreferrer"><span>Cuéntanos tu idea</span><span className={styles.detailCtaIcon}><ArrowUpRight size={20}/></span></a>
    </div>; })()}
  </div>;
}
