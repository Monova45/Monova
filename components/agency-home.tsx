import Image from "next/image";
import { HeroVideo } from "./hero-video";
import { ProjectCarousel } from "./project-carousel";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BrainCircuit, Code2, Smartphone, Settings, PenTool, Search, ChartNoAxesColumnIncreasing, Phone, Globe, Mouse } from "lucide-react";
import styles from "./agency-home.module.css";

const contact = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573214198831"}?text=${encodeURIComponent("Hola Monova, quiero conversar sobre un proyecto.")}`;
const projects = [
  { name: "Kliniu", category: "Plataforma · Web / App", description: "Servicios de limpieza, una experiencia más simple.", image: "kliniu", url: "https://kliniu.vercel.app" },
  { name: "Drokex", category: "Marketplace · B2B", description: "Conectando negocios más allá de las fronteras.", image: "drokex", url: "https://drokex.com" },
  { name: "Unipars Tech", category: "Industria · Web", description: "Tecnología que impulsa nuevas posibilidades.", image: "unipars", url: "https://unipars-tech.vercel.app" },
  { name: "4U Studio Academy", category: "Educación · Experiencia digital", description: "Una nueva forma de conectar con la música.", image: "4ustudio", url: "https://4ustudioacademy.com" },
];
const services = [
  { name: "Desarrollo Web", text: "Sitios y plataformas que generan resultados.", detail: "Creamos sitios corporativos, tiendas y plataformas a medida, con una experiencia rápida y clara en cada dispositivo.", icon: Code2 },
  { name: "Aplicaciones", text: "Apps que conectan personas y negocios.", detail: "Diseñamos productos digitales alrededor de tus usuarios y los procesos que hacen único a tu negocio.", icon: Smartphone },
  { name: "Inteligencia Artificial", text: "IA para automatizar, analizar y escalar.", detail: "Integramos asistentes y herramientas de inteligencia artificial para resolver necesidades concretas de tu equipo.", icon: BrainCircuit },
  { name: "Automatización", text: "Procesos más simples, negocios más eficientes.", detail: "Conectamos tus herramientas, información y operaciones para reducir tareas repetitivas y ahorrar tiempo.", icon: Settings },
  { name: "Branding & UX/UI", text: "Marcas y experiencias que inspiran y convierten.", detail: "Damos forma a tu identidad y diseñamos interfaces intuitivas, coherentes y centradas en las personas.", icon: PenTool },
];
function Brand() { return <a href="#inicio" className={styles.brand} aria-label="Monova, inicio"><span><Image src="/assets/monova-mark.svg" width={30} height={25} alt="" /></span>MONOVA</a>; }
export function AgencyHome() {
  return <main className={styles.page} id="inicio">
    <div className={styles.heroWrap}>
      <header className={styles.header}><Brand /><span className={styles.tagline}>Ideas que funcionan.</span><nav aria-label="Navegación principal"><a href="#servicios">Servicios</a><a href="#proyectos">Proyectos</a><a href="#nosotros">Nosotros</a><a href="#contacto">Contacto</a></nav><a className={styles.primary} href={contact} target="_blank" rel="noreferrer">Hablemos <ArrowRight size={17}/></a></header>
      <section className={styles.hero} aria-labelledby="hero-title">
        <HeroVideo />
        <div className={styles.heroCopy}><p className={styles.eyebrow}>TECNOLOGÍA × CREATIVIDAD × RESULTADOS</p><h1 id="hero-title">Sistemas<br/>que convierten<br/>ideas en<br/>resultados<span>.</span></h1><p className={styles.intro}>Desarrollamos software, diseño, IA y automatización<br className={styles.desktopBreak}/> para empresas que piensan en grande.</p><div className={styles.actions}><a className={styles.primary} href={contact} target="_blank" rel="noreferrer">Comenzar un proyecto <ArrowRight size={17}/></a><a className={styles.secondary} href="#servicios">Conocer nuestros servicios</a></div><div className={styles.stats}><div><strong>+100</strong><span>Proyectos entregados</span></div><div><strong>+50</strong><span>Clientes felices</span></div><div><strong>+10</strong><span>Industrias impactadas</span></div></div></div>
        <div className={styles.heroBottom}><a href="#proyectos"><Mouse size={25}/><span>SCROLL<br/>PARA EXPLORAR</span></a><span className={styles.bigWord} aria-hidden="true">MONOV<span>Λ</span></span><p>TECNOLOGÍA<br/>PARA UN<br/>MAÑANA REAL.</p></div>
      </section>
    </div>
    <section className={styles.partners} aria-label="Proyectos de nuestro portafolio"><p className={styles.eyebrow}>IDEAS QUE YA SE CONVIRTIERON EN REALIDAD</p><div><span>kliniu<span className={styles.dot}>.</span></span><span>Drokex ↗</span><span>UNIPARS <small>TECH</small></span><span>4U <small>STUDIO ACADEMY</small></span><p>GRANDES IDEAS.<br/>MEJORES ALIADOS.</p></div></section>
    <section className={styles.portfolio} id="proyectos">
      <div className={styles.portfolioHeading}><p className={styles.eyebrow}>DE LA IDEA A LO REAL / PORTAFOLIO</p><div><h2>Hecho para<br/>hacer la diferencia<span>↗</span></h2><p>Cada negocio tiene su mundo.<br/>Nosotros lo llevamos al siguiente nivel.</p></div></div>
      <ProjectCarousel projects={projects} />
      <div className={styles.portfolioFooter}><span>EL PRÓXIMO GRAN PROYECTO PUEDE SER EL TUYO.</span><a href={contact} target="_blank" rel="noreferrer">Vamos a crearlo <ArrowRight size={22}/></a></div>
    </section>
    <section className={`${styles.section} ${styles.services}`} id="servicios"><div className={styles.sectionHead}><div><p className={styles.eyebrow}>CAPACIDADES</p><h2>Tecnología, diseño y<br/>automatización para crecer mejor<span>.</span></h2></div><p className={styles.sideNote}>SOLUCIONES REALES<br/>PARA DESAFÍOS REALES.</p></div><div className={styles.serviceGrid}>{services.map(s=><details key={s.name} className={styles.service}><summary><div><s.icon size={27}/><ArrowUpRight size={24}/></div><h3>{s.name}</h3><p>{s.text}</p></summary><p className={styles.serviceDetail}>{s.detail}</p><a href={contact} target="_blank" rel="noreferrer">Hablemos <ArrowRight size={14}/></a></details>)}</div></section>
    <section className={styles.method}><div><p className={styles.eyebrow}>NUESTRO MÉTODO</p><h2>Del concepto<br/>a la conversión<span>.</span></h2></div>{[{title:"Descubrimos",text:"Entendemos tu negocio, usuarios y oportunidades.",icon:Search},{title:"Diseñamos",text:"Convertimos ideas en estrategias y experiencias.",icon:PenTool},{title:"Construimos",text:"Desarrollamos soluciones escalables y robustas.",icon:Code2},{title:"Optimizamos",text:"Medimos, iteramos y hacemos crecer.",icon:ChartNoAxesColumnIncreasing}].map((s,i)=><article key={s.title}><div><span>0{i+1}</span><s.icon size={26}/></div><h3>{s.title}</h3><p>{s.text}</p></article>)}</section>
    <section className={styles.about} id="nosotros">
      <div className={styles.office}><Image src="/assets/monova-creative-world.png" alt="Mascota de Monova creando soluciones digitales en su estación futurista" fill sizes="(max-width: 700px) 100vw, 55vw"/><span>IDEAS QUE COBRAN VIDA</span></div>
      <div className={styles.aboutCopy}><p className={styles.eyebrow}>MUCHO GUSTO, SOMOS MONOVA</p><h2>Buenas ideas.<br/>Personas curiosas.<br/><span>Grandes posibilidades.</span></h2><p>Nos gusta hacer las preguntas correctas, imaginar lo que sigue y construirlo contigo. Unimos estrategia, diseño y tecnología para darle forma a eso que tienes en mente.</p><div className={styles.aboutPillars}><span>01 / Pensamos contigo</span><span>02 / Diseñamos con intención</span><span>03 / Hacemos que funcione</span></div><a className={styles.primary} href={contact} target="_blank" rel="noreferrer">Conozcámonos <ArrowUpRight size={18}/></a></div>
    </section>
    <section className={styles.contact} id="contacto"><div><p className={styles.eyebrow}>HABLEMOS</p><h2>¿Tienes una idea?<br/>Hagámosla funcionar<span>.</span></h2></div><a className={styles.phone} href="tel:+573214198831"><Phone size={26}/><span>321 419 8831<br/><small>Conversemos sobre tu proyecto</small></span></a><a className={styles.primary} href={contact} target="_blank" rel="noreferrer">Hablemos ahora <ArrowRight size={18}/></a></section>
    <footer className={styles.footer}><Brand/><span>Ideas que funcionan.</span><a href="#servicios">Servicios</a><a href="#proyectos">Proyectos</a><a href="#nosotros">Nosotros</a><Link href="/marketing">Monova Marketing <ArrowUpRight size={13}/></Link><span className={styles.footerEnd}><Globe size={16}/> Hecho para un mañana real.</span></footer>
  </main>;
}
