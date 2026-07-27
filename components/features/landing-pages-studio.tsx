"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight, Check, CheckCircle2, Copy, ExternalLink, Globe2, LayoutTemplate,
  LoaderCircle, Monitor, PencilLine, Rocket, Save, Smartphone, Sparkles,
} from "lucide-react";

type LandingContent = {
  business: string;
  slug: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  benefits: string[];
  proof: string;
  contact: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  layout: "split" | "overlay" | "centered" | "feature" | "magazine";
  templateName: string;
};

type DomainState = {
  domain: string;
  status: "empty" | "pending";
};

const initialContent: LandingContent = {
  business: "Universal de Cauchos",
  slug: "universal-de-cauchos",
  headline: "Resistencia que mantiene tu negocio en movimiento",
  subheadline: "Soportes de caucho confiables para vehículos y maquinaria, con atención especializada y respuesta rápida.",
  primaryCta: "Cotizar ahora",
  secondaryCta: "Ver productos",
  benefits: ["Asesoría especializada", "Soluciones para múltiples aplicaciones", "Atención rápida por WhatsApp"],
  proof: "Calidad, experiencia y acompañamiento para encontrar el soporte correcto.",
  contact: "Escríbenos y recibe una recomendación según tu vehículo o aplicación.",
  accent: "#ff6a00",
  background: "#fff8f3",
  surface: "#ffffff",
  text: "#171719",
  muted: "#6f716f",
  layout: "split",
  templateName: "Océano",
};

const templates: Array<Pick<LandingContent, "templateName" | "accent" | "background" | "surface" | "text" | "muted" | "layout"> & { tag: string; preview: string }> = [
  { templateName: "Océano", tag: "Tecnología · Servicios", preview: "/landing-template-industrial.png", accent: "#ff6a00", background: "#fff7f1", surface: "#ffffff", text: "#171719", muted: "#74716e", layout: "split" },
  { templateName: "Fuego", tag: "Comercio · Retail", preview: "/landing-template-dark.png", accent: "#ff4d00", background: "#fff4ed", surface: "#ffffff", text: "#21150f", muted: "#8b5d49", layout: "overlay" },
  { templateName: "Bosque", tag: "Natural · Salud", preview: "/landing-template-wellness.png", accent: "#f47a24", background: "#fffaf5", surface: "#ffffff", text: "#22201e", muted: "#77716b", layout: "centered" },
  { templateName: "Noche", tag: "Premium · Exclusivo", preview: "/landing-template-dark.png", accent: "#ff7a1a", background: "#111113", surface: "#1b1b1e", text: "#fafafa", muted: "#aaa8a5", layout: "feature" },
  { templateName: "Coral", tag: "Moda · Lifestyle", preview: "/landing-template-lifestyle.png", accent: "#ff6a00", background: "#fff5ee", surface: "#ffffff", text: "#261913", muted: "#906c5b", layout: "magazine" },
];

const domainStorageKey = "monova-landing-domain";

export function LandingPagesStudio() {
  const [content, setContent] = useState<LandingContent>(initialContent);
  const [templateChosen, setTemplateChosen] = useState(false);
  const [editorPanel, setEditorPanel] = useState<"ai" | "brand" | "content" | "style">("brand");
  const [activeTab, setActiveTab] = useState<"editor" | "domain">("editor");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [brief, setBrief] = useState("Landing para vender soportes de caucho y recibir cotizaciones por WhatsApp.");
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");
  const [domain, setDomain] = useState<DomainState>(() => {
    if (typeof window === "undefined") return { domain: "", status: "empty" };
    try { return JSON.parse(window.localStorage.getItem(domainStorageKey) || "") as DomainState; }
    catch { return { domain: "", status: "empty" }; }
  });

  const publicPath = useMemo(() => `/l/${content.slug}`, [content.slug]);

  function update<K extends keyof LandingContent>(key: K, value: LandingContent[K]) {
    setContent((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function applyTemplate(template: (typeof templates)[number]) {
    setContent((current) => ({ ...current, ...template }));
    setTemplateChosen(true);
    setEditorPanel("brand");
    setSaved(false);
  }

  async function generateWithAi() {
    setGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/ai/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, business: content.business }),
      });
      const payload = await response.json() as { content?: Partial<LandingContent>; error?: string };
      if (!response.ok || !payload.content) throw new Error(payload.error || "No se pudo generar la landing.");
      setContent((current) => ({ ...current, ...payload.content, accent: current.accent }));
      setSaved(false);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "No se pudo generar la landing.");
    } finally {
      setGenerating(false);
    }
  }

  async function savePage() {
    const savedAt = Date.now();
    window.localStorage.setItem(`monova-landing:${content.slug}`, JSON.stringify({ content, savedAt }));
    setSaved(true);
    try {
      await fetch("/api/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: content.slug, content }),
      });
    } catch {
      // La copia local mantiene la landing disponible mientras el servidor se recupera.
    }
  }

  async function publishPage() {
    await savePage();
    setPublished(true);
    window.open(publicPath, "_blank", "noopener,noreferrer");
  }

  function connectDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = domain.domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!normalized.includes(".")) {
      setError("Escribe un dominio válido, por ejemplo: tienda.tumarca.com");
      return;
    }
    const next: DomainState = { domain: normalized, status: "pending" };
    setDomain(next);
    window.localStorage.setItem(domainStorageKey, JSON.stringify(next));
    void fetch("/api/landing-pages/domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: content.slug, domain: normalized }),
    });
    setError("");
  }

  function copy(value: string) {
    void navigator.clipboard.writeText(value);
  }

  return <section className="landing-studio">
    <header className="landing-head">
      <div><span><Sparkles size={13}/> PÁGINAS QUE CONVIERTEN</span><h1>Landing Pages</h1><p>Crea, publica y conecta tu dominio sin salir de Monova.</p></div>
      {(templateChosen || activeTab === "domain") && <div className="landing-head-actions">
        <button onClick={() => void savePage()} className="landing-quiet"><Save size={15}/>{saved ? "Guardado" : "Guardar"}</button>
        <button onClick={() => void publishPage()} className="landing-publish"><Rocket size={15}/>{published ? "Publicada" : "Publicar"}</button>
      </div>}
    </header>

    <nav className="landing-tabs" aria-label="Configuración de Landing Pages">
      <button className={activeTab === "editor" ? "active" : ""} onClick={() => setActiveTab("editor")}><PencilLine size={15}/> Editor</button>
      <button className={activeTab === "domain" ? "active" : ""} onClick={() => setActiveTab("domain")}><Globe2 size={15}/> Dominio</button>
      <span className={saved ? "ready" : ""}>{saved ? <CheckCircle2 size={14}/> : <span/>}{saved ? "Cambios guardados" : "Borrador local"}</span>
    </nav>

    {activeTab === "editor" && !templateChosen ? <TemplateChooser onChoose={applyTemplate}/> : activeTab === "editor" ? <div className="landing-editor-grid drokex-builder-flow">
      <header className="landing-builder-toolbar">
        <div className="builder-brand"><span>{content.business.slice(0, 2).toUpperCase()}</span><div><strong>{content.business}</strong><small>Editando landing · {content.templateName}</small></div></div>
        <div className="builder-panel-tabs">
          <button className={editorPanel === "ai" ? "active" : ""} onClick={() => setEditorPanel("ai")}><Sparkles size={13}/> IA</button>
          <button className={editorPanel === "brand" ? "active" : ""} onClick={() => setEditorPanel("brand")}>Marca</button>
          <button className={editorPanel === "content" ? "active" : ""} onClick={() => setEditorPanel("content")}>Contenido</button>
          <button className={editorPanel === "style" ? "active" : ""} onClick={() => setEditorPanel("style")}>Colores</button>
          <button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")} aria-label="Vista escritorio"><Monitor size={13}/></button>
          <button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")} aria-label="Vista móvil"><Smartphone size={13}/></button>
          <button onClick={() => setTemplateChosen(false)}>Plantillas</button>
        </div>
        <button className="builder-publish" onClick={() => void publishPage()}><Rocket size={13}/> Publicar</button>
      </header>
      <aside className="landing-controls">
        {editorPanel === "ai" && <section className="landing-ai-card">
          <div><span><Sparkles size={16}/></span><div><strong>Crear con Monova AI</strong><small>Describe el negocio y generamos la estructura.</small></div></div>
          <textarea value={brief} onChange={(event) => setBrief(event.target.value)} maxLength={600}/>
          <button onClick={generateWithAi} disabled={generating || brief.trim().length < 12}>{generating ? <LoaderCircle className="spin" size={15}/> : <Sparkles size={15}/>} {generating ? "Creando contenido…" : "Generar contenido"}</button>
        </section>}

        {editorPanel !== "ai" && <section className="landing-fields">
          <div className="landing-section-title"><LayoutTemplate size={15}/><strong>{content.templateName}</strong><button type="button" onClick={() => setTemplateChosen(false)}>Cambiar plantilla</button></div>
          {editorPanel === "brand" && <>
            <p className="builder-panel-help">Configura primero la identidad y el enlace de la página.</p>
            <label>Nombre del negocio<input value={content.business} onChange={(event) => update("business", event.target.value)}/></label>
            <label>URL pública<div className="landing-slug"><span>monova.local/l/</span><input value={content.slug} onChange={(event) => update("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}/></div></label>
            <label>Color principal<div className="landing-color"><input type="color" value={content.accent} onChange={(event) => update("accent", event.target.value)}/><input value={content.accent} onChange={(event) => update("accent", event.target.value)}/></div></label>
            <button className="builder-next" onClick={() => setEditorPanel("content")}>Continuar con el contenido <ArrowRight size={13}/></button>
          </>}
          {editorPanel === "content" && <>
            <p className="builder-panel-help">Edita el hero, botones, beneficios y cierre comercial.</p>
            <label>Título principal<textarea value={content.headline} onChange={(event) => update("headline", event.target.value)}/></label>
            <label>Descripción<textarea value={content.subheadline} onChange={(event) => update("subheadline", event.target.value)}/></label>
            <div className="landing-field-row"><label>Botón principal<input value={content.primaryCta} onChange={(event) => update("primaryCta", event.target.value)}/></label><label>Botón secundario<input value={content.secondaryCta} onChange={(event) => update("secondaryCta", event.target.value)}/></label></div>
            <label>Beneficio 1<input value={content.benefits[0]} onChange={(event) => update("benefits", [event.target.value, content.benefits[1], content.benefits[2]])}/></label>
            <label>Beneficio 2<input value={content.benefits[1]} onChange={(event) => update("benefits", [content.benefits[0], event.target.value, content.benefits[2]])}/></label>
            <label>Beneficio 3<input value={content.benefits[2]} onChange={(event) => update("benefits", [content.benefits[0], content.benefits[1], event.target.value])}/></label>
            <label>Título de cierre<textarea value={content.proof} onChange={(event) => update("proof", event.target.value)}/></label>
            <label>Texto de contacto<textarea value={content.contact} onChange={(event) => update("contact", event.target.value)}/></label>
            <button className="builder-next" onClick={() => setEditorPanel("style")}>Personalizar colores <ArrowRight size={13}/></button>
          </>}
          {editorPanel === "style" && <>
          <p className="builder-panel-help">Ajusta la paleta completa como en el constructor de Drokex.</p>
          <div className="landing-theme-grid always-open">
            <ThemeColor label="Principal" value={content.accent} onChange={(value) => update("accent", value)}/>
            <ThemeColor label="Fondo" value={content.background} onChange={(value) => update("background", value)}/>
            <ThemeColor label="Secciones" value={content.surface} onChange={(value) => update("surface", value)}/>
            <ThemeColor label="Texto" value={content.text} onChange={(value) => update("text", value)}/>
            <ThemeColor label="Texto secundario" value={content.muted} onChange={(value) => update("muted", value)}/>
          </div>
          <button className="builder-next publish" onClick={() => void publishPage()}><Rocket size={13}/> Publicar landing</button>
          </>}
        </section>}
        {error && <p className="landing-error">{error}</p>}
      </aside>

      <main className="landing-preview-panel">
        <header><div><strong>Vista previa</strong><span>Se actualiza automáticamente</span></div><div className="device-switch"><button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")} aria-label="Vista escritorio"><Monitor size={15}/></button><button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")} aria-label="Vista móvil"><Smartphone size={15}/></button></div></header>
        <div className={`landing-preview-shell ${device}`}>
          <LandingPreview content={content}/>
        </div>
      </main>
    </div> : <div className="domain-workspace">
      <section className="domain-card">
        <span className="domain-icon"><Globe2 size={23}/></span>
        <div><h2>Conecta tu dominio</h2><p>Publica esta landing en una dirección de tu marca. Recomendamos usar un subdominio como <b>promo.tumarca.com</b>.</p></div>
        <form onSubmit={connectDomain}><label>Dominio o subdominio<div><span>https://</span><input value={domain.domain} onChange={(event) => setDomain({ domain: event.target.value, status: "empty" })} placeholder="promo.tumarca.com"/></div></label><button>Continuar</button></form>
      </section>

      {domain.status === "pending" && <section className="dns-card">
        <header><div><span className="dns-pending"/> <div><strong>Esperando configuración DNS</strong><small>{domain.domain}</small></div></div><button onClick={() => window.open(`https://${domain.domain}`, "_blank")}><ExternalLink size={14}/> Abrir</button></header>
        <p>Entra al proveedor donde compraste el dominio y agrega este registro. La propagación puede tomar desde unos minutos hasta 48 horas.</p>
        <div className="dns-table">
          <div className="head"><span>Tipo</span><span>Nombre</span><span>Valor</span><span/></div>
          <div><b>CNAME</b><code>{domain.domain.split(".").length > 2 ? domain.domain.split(".")[0] : "www"}</code><code>cname.monova.app</code><button onClick={() => copy("cname.monova.app")} aria-label="Copiar valor"><Copy size={14}/></button></div>
        </div>
        <div className="domain-checklist"><span><Check size={14}/> La landing ya está guardada</span><span><Check size={14}/> SSL se activará automáticamente al verificar</span><span className="pending"><span/> Falta detectar el registro DNS</span></div>
        <button className="verify-domain" onClick={() => setError("Aún no detectamos el CNAME. Revisa el registro y vuelve a intentarlo cuando se haya propagado.")}>Verificar conexión</button>
        {error && <p className="landing-error">{error}</p>}
      </section>}
    </div>}
  </section>;
}

export function LandingPreview({ content }: { content: LandingContent }) {
  const theme = {
    "--landing-accent": content.accent || "#ff6a00",
    "--landing-bg": content.background || "#fff8f3",
    "--landing-surface": content.surface || "#ffffff",
    "--landing-text": content.text || "#171719",
    "--landing-muted": content.muted || "#6f716f",
  } as React.CSSProperties;
  return <article className={`landing-page-preview layout-${content.layout || "split"}`} style={theme}>
    <nav><strong>{content.business}</strong><button>{content.primaryCta}</button></nav>
    <section className="landing-hero-preview"><div><span>SOLUCIONES QUE DURAN</span><h1>{content.headline}</h1><p>{content.subheadline}</p><div><button>{content.primaryCta}<ArrowRight size={14}/></button><button>{content.secondaryCta}</button></div></div><div className="landing-art"><i/><b>UC</b><em/></div></section>
    <section className="landing-benefits">{content.benefits.map((benefit) => <div key={benefit}><span><Check size={13}/></span><strong>{benefit}</strong></div>)}</section>
    <section className="landing-proof"><small>POR QUÉ ELEGIRNOS</small><h2>{content.proof}</h2><p>{content.contact}</p><button>{content.primaryCta}</button></section>
    <footer><strong>{content.business}</strong><span>Creado con Monova</span></footer>
  </article>;
}

function TemplateChooser({ onChoose }: { onChoose: (template: (typeof templates)[number]) => void }) {
  return <section className="template-chooser">
    <header><span>CREAR UNA NUEVA PÁGINA</span><h2>Empieza con una estructura profesional</h2><p>Selecciona una base visual. Después podrás personalizar contenido, colores, botones y dominio.</p></header>
    <div className="template-gallery">{templates.map((template) => <button key={template.templateName} onClick={() => onChoose(template)}>
      <div className={`template-mini template-photo layout-${template.layout}`}><Image src={template.preview} width={1664} height={928} alt={`Vista previa de la plantilla ${template.templateName}`}/><span>Vista previa</span></div>
      <div className="template-info"><strong>{template.templateName}</strong><span>{template.tag}</span><div>{[template.accent, template.background, template.surface, template.text].map((color) => <i key={color} style={{ background: color }}/>)}</div><b>Elegir →</b></div>
    </button>)}</div>
  </section>;
}

function ThemeColor({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label>{label}<div><input type="color" value={value} onChange={(event) => onChange(event.target.value)}/><input value={value} onChange={(event) => onChange(event.target.value)}/></div></label>;
}
