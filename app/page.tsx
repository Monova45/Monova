import Link from "next/link";
import { ArrowRight, BarChart3, Bot, CalendarDays, ImageIcon, Layers3, MessageCircle, Play, Sparkles } from "lucide-react";
import { PRODUCT } from "@/config/product";

const capabilities = [
  { icon: Bot, title: "IA que conoce tu marca", copy: "Brand Brain reúne tono, productos, audiencia y resultados para crear con contexto." },
  { icon: ImageIcon, title: "Estudio creativo unificado", copy: "Genera piezas, imágenes y video en los formatos de cada canal." },
  { icon: CalendarDays, title: "Planifica y publica", copy: "Organiza campañas, aprobaciones y contenidos desde un calendario compartido." },
  { icon: BarChart3, title: "Métricas accionables", copy: "Convierte datos de canales, campañas y ventas en próximas acciones." },
  { icon: MessageCircle, title: "Conversaciones en un lugar", copy: "Prepara WhatsApp, comentarios y leads para que tu equipo responda mejor." },
  { icon: Layers3, title: "Operación multiempresa", copy: "Separa marcas, equipos, archivos, consumo y permisos por workspace." }
];

export default function Home() {
  return (
    <main className="marketing-page">
      <nav className="marketing-nav">
        <Link href="/" className="brand-lockup"><span className="brand-mark">M</span><span>MONOVA</span></Link>
        <div className="nav-links">
          <Link href="/funciones">Funciones</Link><Link href="/soluciones">Soluciones</Link>
          <Link href="/agencias">Agencias</Link><Link href="/precios">Precios</Link>
        </div>
        <div className="nav-actions"><Link href="/login">Ingresar</Link><Link className="button primary small" href="/registro">Empezar gratis</Link></div>
      </nav>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={14} /> Tu equipo de marketing, aumentado por IA</div>
        <h1>Todo tu marketing.<br/><span>Un solo sistema operativo.</span></h1>
        <p>{PRODUCT.tagline}. Crea, planifica, publica, conversa y mide sin saltar entre diez herramientas.</p>
        <div className="hero-actions">
          <Link className="button primary" href="/registro">Crear mi workspace <ArrowRight size={17}/></Link>
          <Link className="button secondary" href="/app/dashboard"><Play size={16}/> Ver demo interactiva</Link>
        </div>
        <div className="trust-row"><span>Sin tarjeta</span><span>Datos demo claramente identificados</span><span>Configura a tu ritmo</span></div>
      </section>

      <section className="product-preview">
        <div className="preview-sidebar"><span className="brand-mark">M</span>{["Inicio","Asistente IA","Creative Studio","Planner","Analítica"].map((x,i)=><div className={i===0?"active":""} key={x}>{x}</div>)}</div>
        <div className="preview-main">
          <div className="preview-top"><span>Buenos días, Brandon</span><button>+ Crear</button></div>
          <p>Aquí tienes el resumen de tu marketing hoy.</p>
          <div className="preview-stats">{[["Alcance","248,9K","+18,4%"],["Interacciones","18,2K","+12,7%"],["Conversiones","1.284","+8,2%"],["ROAS","4,8×","+0,6"]].map(x=><div key={x[0]}><small>{x[0]}</small><strong>{x[1]}</strong><em>{x[2]}</em></div>)}</div>
          <div className="preview-chart"><div><small>Rendimiento general</small><strong>La estrategia está creciendo</strong></div><svg viewBox="0 0 700 140" aria-label="Gráfica demostrativa"><path d="M0 116 C70 110,95 84,150 95 S245 45,310 63 S390 87,450 42 S560 68,700 12" fill="none" stroke="#ff6a00" strokeWidth="4"/></svg></div>
        </div>
      </section>

      <section className="section centered"><div className="eyebrow">Una plataforma, toda la operación</div><h2>De la idea al resultado, sin perder el contexto.</h2><p className="section-lead">Una base modular para equipos pequeños, departamentos de marketing y agencias que necesitan crear y operar mejor.</p>
        <div className="capability-grid">{capabilities.map(({icon:Icon,title,copy})=><article key={title}><span><Icon size={20}/></span><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className="cta"><div><div className="eyebrow light">Monova Marketing OS</div><h2>Tu próxima campaña empieza con una idea.</h2><p>Monova convierte esa idea en un sistema de trabajo compartido.</p></div><Link className="button white" href="/registro">Comenzar ahora <ArrowRight size={17}/></Link></section>
      <footer><span>© 2026 Monova</span><div><Link href="/recursos">Recursos</Link><Link href="/contacto">Contacto</Link><Link href="/legacy">Experiencia Monova anterior</Link></div></footer>
    </main>
  );
}
