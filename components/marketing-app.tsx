"use client";

import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity, ArrowUpRight, BarChart3, Bell, Bot, BriefcaseBusiness, CalendarDays, Check, ChevronDown, CircleHelp,
  Clapperboard, Command, CreditCard, FileText, FolderOpen, Gauge, ImageIcon, Share2,
  LayoutDashboard, Mail, Menu, MessageCircle, Palette, PanelLeftClose, Plus, Search, Settings,
  Sparkles, Users, WandSparkles, Workflow, X, Zap
} from "lucide-react";
import { appNavigation, type NavigationIcon } from "@/config/navigation";
import { demoDashboardSummary } from "@/features/dashboard/data/demo-dashboard";
import { PRODUCT } from "@/config/product";
import { AssistantStudio } from "@/components/features/assistant-studio";
import { ImageStudio } from "@/components/features/image-studio";
import { MagnificStudio } from "@/components/features/magnific-studio";
import { ResourcesStudio } from "@/components/features/resources-studio";
import { VideoEditorStudio } from "@/components/features/video-editor-studio";
import { VideoStudio } from "@/components/features/video-studio";
import { WhatsAppStudio } from "@/components/features/whatsapp-studio";
import { LandingPagesStudio } from "@/components/features/landing-pages-studio";
import { PlannerStudio } from "@/components/features/planner-studio";
import { SocialStudio } from "@/components/features/social-studio";
import { MetaAdsStudio } from "@/components/features/meta-ads-studio";
import { EmailStudio } from "@/components/features/email-studio";
import { BlogStudio } from "@/components/features/blog-studio";
import { AutomationsStudio } from "@/components/features/automations-studio";
import { CrmStudio } from "@/components/features/crm-studio";
import { BrandCenterStudio } from "@/components/features/brand-center-studio";
import { TeamStudio } from "@/components/features/team-studio";
import { BillingStudio } from "@/components/features/billing-studio";
import { SettingsStudio } from "@/components/features/settings-studio";
import type { AuthUser } from "@/lib/auth/session";

const iconByName: Readonly<Record<NavigationIcon, LucideIcon>> = {
  dashboard: LayoutDashboard, assistant: Bot, creative: WandSparkles, image: ImageIcon,
  video: Clapperboard, magnific: Sparkles, resources: FolderOpen, planner: CalendarDays,
  social: Share2, whatsapp: MessageCircle, analytics: BarChart3, ads: Gauge, email: Mail,
  page: FileText, automation: Workflow, crm: BriefcaseBusiness, brand: Palette, team: Users,
  billing: CreditCard, settings: Settings,
};

const labels = Object.fromEntries(appNavigation.map(({ slug, label }) => [slug, label]));

export function MarketingApp({ section, user }: { section: string; user: AuthUser }) {
  const [menuOpen,setMenuOpen] = useState(false);
  const [collapsed,setCollapsed] = useState(false);
  const [createOpen,setCreateOpen] = useState(false);
  const current = labels[section] ?? "Dashboard";
  return <div className={`os-shell ${collapsed?"is-collapsed":""}`}>
    <aside className={`os-sidebar ${menuOpen?"mobile-open":""}`}>
      <div className="os-brand"><span className="brand-mark">M</span><div><strong>MONOVA</strong><small>MARKETING OS</small></div><button className="icon-button collapse-button" onClick={()=>setCollapsed(!collapsed)} aria-label="Contraer navegación"><PanelLeftClose size={18}/></button><button className="icon-button mobile-close" onClick={()=>setMenuOpen(false)} aria-label="Cerrar navegación"><X size={18}/></button></div>
      <button className="workspace-switch" disabled title="Workspace de la sesión actual"><span>{user.workspaceName.slice(0,2).toUpperCase()}</span><div><strong>{user.workspaceName}</strong><small>Workspace activo</small></div><ChevronDown size={15}/></button>
      <nav className="os-nav" aria-label="Navegación principal">{appNavigation.map(({ slug, label, icon, badge }) => { const Icon = iconByName[icon]; return <Link key={slug} onClick={()=>setMenuOpen(false)} href={`/app/${slug}`} className={section===slug?"active":""} title={label}><Icon size={18}/><span>{label}</span>{badge&&<b>{badge}</b>}</Link>; })}</nav>
      <div className="sidebar-commercial"><span>PLAN PRO</span><strong>Potencia tu crecimiento</strong><p>Activa más créditos, equipo e integraciones.</p><Link href="/app/billing">Ver planes <ArrowUpRight size={13}/></Link></div>
      <div className="sidebar-user"><div className="usage"><span><small>Uso de IA mensual</small><b>68%</b></span><i><em/></i></div><div className="user-row"><span>{initials(user.fullName)}</span><div><strong>{user.fullName}</strong><small>Owner · Plan Pro</small></div><form action="/api/auth/logout" method="post"><button className="icon-button" title="Cerrar sesión" aria-label="Cerrar sesión"><ChevronDown size={14}/></button></form></div></div>
    </aside>
    {menuOpen&&<button className="sidebar-scrim" onClick={()=>setMenuOpen(false)} aria-label="Cerrar menú"/>}
    <main className="os-main">
      <header className="os-header"><button className="icon-button mobile-menu" onClick={()=>setMenuOpen(true)} aria-label="Abrir menú"><Menu size={20}/></button><div className="global-search" title="La búsqueda global requiere datos persistidos"><Search size={17}/><input disabled aria-label="Buscar" placeholder="Buscar campañas, clientes o contenido"/><kbd><Command size={12}/> K</kbd></div><div className="header-actions"><Link className="header-upgrade" href="/app/billing">Mejorar plan <ArrowUpRight size={14}/></Link><button className="create-button" onClick={()=>setCreateOpen(!createOpen)}><Plus size={17}/> Crear</button><button className="icon-button" disabled title="Centro de ayuda próximamente" aria-label="Ayuda"><CircleHelp size={18}/></button><button className="icon-button" disabled title="Requiere Realtime" aria-label="Notificaciones"><Bell size={18}/></button><span className="header-avatar">{initials(user.fullName)}</span></div></header>
      {createOpen&&<div className="create-popover"><strong>Crear nuevo</strong><Link onClick={()=>setCreateOpen(false)} href="/app/creative-studio"><Plus size={15}/>Imagen con IA</Link><Link onClick={()=>setCreateOpen(false)} href="/app/creative-studio"><Plus size={15}/>Pieza creativa</Link><Link onClick={()=>setCreateOpen(false)} href="/app/magnific"><Plus size={15}/>Mejorar imagen</Link><Link onClick={()=>setCreateOpen(false)} href="/app/assistant"><Plus size={15}/>Consultar a Monova AI</Link></div>}
      {section==="dashboard"?<Dashboard userName={user.fullName} workspaceName={user.workspaceName}/>:<ModulePage section={section} title={current}/>}
    </main>
  </div>;
}

function initials(name:string){return name.trim().split(/\s+/).slice(0,2).map(part=>part[0]?.toUpperCase()).join("")||"U"}

function Dashboard({userName,workspaceName}:{userName:string;workspaceName:string}) {
  const { metrics: stats, assistantInsights, channelPerformance, calendarItems } = demoDashboardSummary;
  return <div className="os-content">
    <div className="page-heading corporate-heading"><div><span className="dashboard-workspace">{workspaceName}</span><h1>Buenos días, {userName.split(/\s+/)[0]}</h1><p>Todo lo importante de tu operación de marketing, en un solo lugar.</p></div><button className="date-filter" disabled title="Periodo fijo para los datos demo"><CalendarDays size={16}/> Últimos 30 días <ChevronDown size={15}/></button></div>
    <section className="dashboard-value-banner"><div><span>MONOVA MARKETING OS</span><h2>Convierte estrategia en resultados medibles.</h2><p>Crea contenido, coordina canales y detecta oportunidades sin cambiar de plataforma.</p><div><small><Check size={13}/>Marca configurada</small><small><Check size={13}/>Equipo centralizado</small><small><Check size={13}/>IA disponible</small></div></div><aside><strong>3</strong><span>oportunidades detectadas hoy</span><Link href="/app/assistant">Ver recomendaciones <ArrowUpRight size={14}/></Link></aside></section>
    <section className="stats-grid">{stats.map(({id,label,formattedValue,changePercent,trend},i)=><article className="stat-card" key={id}><div><span>{label}</span><Activity size={16}/></div><strong>{formattedValue}</strong><small className={trend}>+{changePercent}% <span>vs. periodo anterior</span></small><svg viewBox="0 0 140 30"><path d={`M0 ${24-i} C30 ${28-i}, 35 ${7+i}, 65 ${16-i/2} S100 ${5+i}, 140 ${9+i/2}`} fill="none" stroke={trend==="negative"?"#ef4444":"#ff6a00"} strokeWidth="2"/></svg></article>)}</section>
    <section className="dashboard-grid">
      <article className="panel quick-create"><div className="panel-head"><div><div><h2>¿Qué quieres crear hoy?</h2><p>Empieza con una idea. Monova le da contexto.</p></div></div><Link href="/app/creative-studio">Más opciones →</Link></div><div className="creation-types">{[["Imagen",ImageIcon,"/app/creative-studio"],["Video",Clapperboard,"/app/video-studio"],["Reel",Share2,"/app/creative-studio"],["Historia",ImageIcon,"/app/creative-studio"],["Anuncio",Zap,"/app/creative-studio"],["Logo",Palette,"/app/creative-studio"]].map(([x,I,href])=><Link href={href as string} key={x as string}><I size={18}/><span>{x as string}</span><small>{x==="Imagen"?"Post, banner, etc.":x==="Video"?"Estado de integración":"Crear con IA"}</small></Link>)}</div></article>
      <article className="panel ai-insights"><div className="panel-head"><div><span className="panel-icon dark"><Bot size={17}/></span><div><h2>Monova AI</h2><p>{assistantInsights.length} recomendaciones para hoy</p></div></div><span className="demo-badge">DEMO</span></div>{assistantInsights.map((insight)=><div className="insight" key={insight.id}><span><Sparkles size={15}/></span><div><strong>{insight.title}</strong><p>{insight.description}</p><Link href={insight.actionHref}>{insight.actionLabel} →</Link></div></div>)}</article>
      <article className="panel performance"><div className="panel-head"><div><h2>Rendimiento general</h2><p>Alcance e interacciones</p></div><span className="demo-badge">30 DÍAS</span></div><div className="chart-summary"><strong>248.9K</strong><span>+18.4%</span></div><svg viewBox="0 0 700 190" aria-label="Rendimiento demo"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff6a00" stopOpacity=".23"/><stop offset="1" stopColor="#ff6a00" stopOpacity="0"/></linearGradient></defs><path d="M0 150 C70 148 78 106 145 120 S230 50 300 82 S390 128 450 60 S570 95 700 20 L700 190 L0 190Z" fill="url(#g)"/><path d="M0 150 C70 148 78 106 145 120 S230 50 300 82 S390 128 450 60 S570 95 700 20" fill="none" stroke="#ff6a00" strokeWidth="4"/></svg></article>
      <article className="panel channels"><div className="panel-head"><div><h2>Canales</h2><p>Contribución al alcance</p></div><Link href="/app/analytics">Ver análisis</Link></div>{channelPerformance.map((channel)=><div className="channel" key={channel.id}><span>{channel.name}</span><i><em style={{width:`${channel.contributionPercent}%`,background:channel.color}}/></i><b>{channel.contributionPercent}%</b></div>)}</article>
      <article className="panel schedule"><div className="panel-head"><div><h2>Calendario de contenidos</h2><p>Semana del 20 al 26 de julio</p></div><Link href="/app/planner">Ver calendario</Link></div><div className="week-row">{["Lun 20","Mar 21","Mié 22","Jue 23","Vie 24","Sáb 25","Dom 26"].map((day,i)=>{const item=calendarItems[i]; return <div className={i===3?"today":""} key={day}><span>{day}</span>{item&&<><b className={`content-dot dot-${i}`}>{item.title}</b><DemoCreative variant={i}/></>}</div>})}</div><div className="calendar-legend"><span>● Programado</span><span>● Publicado</span><span>● Borrador</span></div></article>
    </section>
  </div>;
}

function ModulePage({ section,title }: { section:string; title:string }) {
  if (["assistant","creative-studio","video-studio","video-editor","magnific","resources","planner","social","whatsapp","analytics","meta-ads","email","brand-center","automations","landing-pages","blog","crm","team","billing","settings"].includes(section)) {
    return <ToolModule section={section} title={title}/>;
  }
  const special: Record<string,string> = { "assistant":"Chat, ideas, análisis, copywriter y estrategia con contexto de Brand Brain.", "creative-studio":"Crea una pieza de principio a fin: formato, canal, producto, estilo, modelo y aprobación.", "video-studio":"Jobs asíncronos con progreso, reintentos y registro de consumo.", "resources":"Biblioteca central de imágenes, videos, logos, plantillas y generaciones.", "planner":"Calendario compartido de campañas, contenidos, tareas y aprobaciones.", "analytics":"Métricas demostrativas por canal, campaña, producto y periodo.", "brand-center":"Identidad, tono, audiencias, productos y activos que alimentan Brand Brain." };
  const configured = ["assistant"].includes(section);
  return <div className="os-content module-page"><div className="page-heading"><div><span className="demo-badge">{configured?"ADAPTER DISPONIBLE":"MODO DEMO"}</span><h1>{title}</h1><p>{special[section]??`El módulo ${title} está preparado dentro de la navegación de Monova Marketing OS.`}</p></div><button className="create-button" disabled title="Requiere conectar el proveedor de este módulo"><Plus size={17}/> Requiere conexión</button></div><section className="module-hero"><div className="module-visual"><span><Sparkles size={24}/></span><div><small>{PRODUCT.demoWorkspace}</small><h2>{configured?"Listo para trabajar con contexto":"Interfaz preparada · Integración pendiente"}</h2><p>{configured?"El endpoint existente de OpenAI se conserva y migrará a la capa multiproveedor.":"No hay credenciales válidas para este proveedor. Ninguna conexión real se presenta como activa."}</p></div></div><div className="module-steps">{["Configurar workspace","Conectar proveedor","Importar datos","Activar flujo"].map((x,i)=><div key={x}><span className={i===0?"done":""}>{i===0?<CheckIcon/>:i+1}</span><div><strong>{x}</strong><small>{i===0?"Datos demo disponibles":"Configuración pendiente"}</small></div></div>)}</div></section><section className="module-cards">{["Actividad reciente","Estado del sistema","Siguiente recomendación"].map((x,i)=><article key={x}><span className="panel-icon">{i===0?<Activity size={18}/>:i===1?<Gauge size={18}/>:<Bot size={18}/>}</span><h3>{x}</h3><p>{i===0?"Aún no hay actividad real en este workspace.":i===1?"La interfaz está operativa; el backend de este módulo es una fase posterior.":"Completa la configuración del Brand Center antes de conectar canales."}</p><button disabled>Integración pendiente</button></article>)}</section></div>;
}

function CheckIcon(){ return <span aria-label="Completado">✓</span> }

function ToolModule({section,title}:{section:string;title:string}) {
  if(section==="assistant") return <div className="tool-layout"><ToolRail title={title} items={["Chat","Ideas","Análisis","Copywriter","Planificador"]}/><div className="tool-canvas"><AssistantStudio/></div></div>;
  if(section==="magnific") return <div className="tool-layout"><ToolRail title={title} items={["Mejorar"]}/><div className="tool-canvas"><MagnificStudio/></div></div>;
  if(section==="resources") return <div className="tool-layout"><ToolRail title={title} items={["Buscar","Descargas","Favoritos","Colecciones"]}/><div className="tool-canvas"><ResourcesStudio/></div></div>;
  if(section==="whatsapp") return <div className="tool-canvas whatsapp-full-canvas"><WhatsAppStudio/></div>;
  if(section==="video-editor") return <div className="tool-layout"><ToolRail title={title} items={["Editor","Mis proyectos","Plantillas","Exportaciones"]}/><div className="tool-canvas video-editor-canvas"><VideoEditorStudio/></div></div>;
  if(section==="landing-pages") return <div className="tool-canvas landing-canvas"><LandingPagesStudio/></div>;
  if(section==="blog") return <div className="tool-canvas blog-canvas"><BlogStudio/></div>;
  if(section==="automations") return <div className="tool-canvas automation-canvas-page"><AutomationsStudio/></div>;
  if(section==="crm") return <div className="tool-canvas crm-canvas"><CrmStudio/></div>;
  if(section==="brand-center") return <div className="tool-canvas brand-center-canvas"><BrandCenterStudio/></div>;
  if(section==="team") return <div className="tool-canvas team-canvas"><TeamStudio/></div>;
  if(section==="billing") return <div className="tool-canvas billing-canvas"><BillingStudio/></div>;
  if(section==="settings") return <div className="tool-canvas settings-live-canvas"><SettingsStudio/></div>;
  if(section==="creative-studio") return <div className="tool-layout"><ToolRail title={title} items={["Generar","Editor","Plantillas","Mis medios","Favoritos","Kit de marca"]}/><div className="tool-canvas"><ImageStudio creative/></div></div>;
  if(section==="video-studio") return <div className="tool-layout"><ToolRail title={title} items={["Generar","Editor","Plantillas","Mis medios","Favoritos","Kit de marca"]}/><div className="tool-canvas video-studio-canvas"><VideoStudio/></div></div>;
  if(section==="planner") return <div className="tool-canvas"><PlannerStudio/></div>;
  if(section==="social") return <div className="tool-canvas"><SocialStudio/></div>;
  if(section==="analytics") return <div className="tool-layout"><ToolRail title={title} items={["Resumen","Audiencia","Contenido","Conversiones","Informes"]}/><section className="tool-canvas"><div className="tool-title"><div><h1>Resumen general</h1><p>Rendimiento demostrado del 1 al 31 de julio.</p></div><span className="demo-badge">DATOS DEMO</span></div><div className="mini-metrics">{[["Alcance","125.8K"],["Interacciones","8.47K"],["Clics","2.34K"],["Conversiones","356"],["Ventas","$12,450"]].map(x=><div key={x[0]}><small>{x[0]}</small><b>{x[1]}</b><span>↑ 18.6%</span></div>)}</div><div className="analytics-chart"><svg viewBox="0 0 900 300"><path d="M0 230 C90 205 140 220 215 180 S330 210 410 135 S560 185 650 95 S770 130 900 54" fill="none" stroke="#ff6a00" strokeWidth="4"/><path d="M0 250 C100 240 160 200 240 215 S400 155 510 175 S680 95 900 120" fill="none" stroke="#587cff" strokeWidth="3"/><path d="M0 265 C160 250 230 270 360 220 S540 240 690 185 S820 170 900 150" fill="none" stroke="#43c486" strokeWidth="3"/></svg></div></section></div>;
  if(section==="meta-ads") return <div className="tool-canvas"><MetaAdsStudio/></div>;
  if(section==="email") return <div className="tool-canvas"><EmailStudio/></div>;
  return null;
}

function ToolRail({title,items}:{title:string;items:string[]}){return <aside className="tool-rail"><h2>{title}</h2>{items.map((x,i)=><button className={i===0?"active":""} disabled={i!==0} title={i===0?x:`${x}: próximamente`} key={x}>{i===0?<Sparkles size={14}/>:<Activity size={14}/>} {x}</button>)}</aside>}
function DemoCreative({variant=0,large=false}:{variant?:number;large?:boolean}){return <div className={`demo-creative creative-${variant%5} ${large?"large":""}`} role="img" aria-label="Vista previa visual neutra y reemplazable"><span/><i/><b>DEMO</b></div>}
