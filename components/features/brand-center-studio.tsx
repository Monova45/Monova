"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";
import { Check, ImageIcon, Palette, Save, Sparkles, Type, Upload } from "lucide-react";

interface BrandProfile {
  name: string; tagline: string; description: string; audience: string; tone: string;
  primaryFont: string; secondaryFont: string; colors: string[]; logo: string;
}
const storageKey = "monova-brand-profile-v1";
const initialBrand: BrandProfile = {
  name: "Universal de Cauchos", tagline: "Resistencia que mueve tu negocio.",
  description: "Soluciones en caucho diseñadas para responder a las exigencias de la industria y el transporte.",
  audience: "Empresas industriales, talleres, flotas y distribuidores.",
  tone: "Profesional, directo, confiable y técnico sin ser complicado.",
  primaryFont: "Inter", secondaryFont: "Arial",
  colors: ["#ff6a00", "#171719", "#414149", "#e5e5e8", "#ffffff"], logo: "",
};
type Tab = "Identidad" | "Colores" | "Tipografías" | "Logo";
const initials = (name: string) => name.split(" ").filter((word) => !["de", "del", "la", "las", "el", "los"].includes(word.toLowerCase())).map((word) => word[0]).slice(0, 2).join("").toUpperCase();

export function BrandCenterStudio() {
  const [brand, setBrand] = useState(initialBrand);
  const [tab, setTab] = useState<Tab>("Identidad");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) setBrand(JSON.parse(stored) as BrandProfile);
      } catch { /* Default identity remains available. */ }
    });
    return () => { active = false; };
  }, []);

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(brand)); } catch { /* Optional persistence. */ }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }
  function updateColor(index: number, color: string) {
    setBrand({ ...brand, colors: brand.colors.map((item, itemIndex) => itemIndex === index ? color : item) });
  }
  function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || file.size > 2_000_000) return;
    const reader = new FileReader();
    reader.onload = () => setBrand((current) => ({ ...current, logo: typeof reader.result === "string" ? reader.result : "" }));
    reader.readAsDataURL(file);
  }

  return <section className="brand-studio-live">
    <header className="brand-live-head"><div><span><Sparkles size={13}/> BRAND BRAIN</span><h1>Brand Center</h1><p>La identidad que guía todo el contenido generado por Monova.</p></div><button className={saved ? "brand-save saved" : "brand-save"} onClick={save}>{saved ? <Check size={15}/> : <Save size={15}/>} {saved ? "Guardado" : "Guardar cambios"}</button></header>
    <div className="brand-progress"><div><strong>Perfil de marca</strong><small>Completa esta información para mejorar los resultados de IA.</small></div><span><i style={{ width: `${Math.round(([brand.name, brand.tagline, brand.description, brand.audience, brand.tone, brand.primaryFont, brand.logo].filter(Boolean).length / 7) * 100)}%` }}/></span></div>
    <nav className="brand-tabs" aria-label="Secciones de marca">{(["Identidad", "Colores", "Tipografías", "Logo"] as Tab[]).map((item) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item === "Identidad" ? <Sparkles size={14}/> : item === "Colores" ? <Palette size={14}/> : item === "Tipografías" ? <Type size={14}/> : <ImageIcon size={14}/>} {item}</button>)}</nav>
    <div className="brand-workspace">
      <main>
        {tab === "Identidad" && <div className="brand-form"><header><h2>Identidad de marca</h2><p>Describe quién eres y cómo debe comunicarse la marca.</p></header><label>Nombre de la marca<input value={brand.name} onChange={(event) => setBrand({ ...brand, name: event.target.value })}/></label><label>Frase principal<input value={brand.tagline} onChange={(event) => setBrand({ ...brand, tagline: event.target.value })}/></label><label>Descripción<textarea value={brand.description} onChange={(event) => setBrand({ ...brand, description: event.target.value })}/></label><label>Público objetivo<textarea value={brand.audience} onChange={(event) => setBrand({ ...brand, audience: event.target.value })}/></label><label>Tono de comunicación<textarea value={brand.tone} onChange={(event) => setBrand({ ...brand, tone: event.target.value })}/></label></div>}
        {tab === "Colores" && <div className="brand-form"><header><h2>Paleta de colores</h2><p>Estos colores se usarán en Creative Studio, Video y Landing Pages.</p></header><div className="brand-color-list">{brand.colors.map((color, index) => <label key={`${index}-${color}`}><input type="color" value={color} onChange={(event) => updateColor(index, event.target.value)}/><span><strong>{index === 0 ? "Color principal" : index === 1 ? "Color oscuro" : `Color ${index + 1}`}</strong><input value={color} onChange={(event) => updateColor(index, event.target.value)}/></span></label>)}</div></div>}
        {tab === "Tipografías" && <div className="brand-form"><header><h2>Tipografías</h2><p>Selecciona una combinación coherente para títulos y contenido.</p></header><label>Tipografía principal<select value={brand.primaryFont} onChange={(event) => setBrand({ ...brand, primaryFont: event.target.value })}>{["Inter", "Arial", "Georgia", "Verdana", "Times New Roman"].map((font) => <option key={font}>{font}</option>)}</select></label><label>Tipografía secundaria<select value={brand.secondaryFont} onChange={(event) => setBrand({ ...brand, secondaryFont: event.target.value })}>{["Arial", "Inter", "Georgia", "Verdana", "Times New Roman"].map((font) => <option key={font}>{font}</option>)}</select></label><div className="brand-type-preview" style={{ fontFamily: brand.primaryFont }}><span>TÍTULO DE MARCA</span><strong>Resistencia y confianza</strong><p style={{ fontFamily: brand.secondaryFont }}>Una identidad consistente hace que cada comunicación sea reconocible.</p></div></div>}
        {tab === "Logo" && <div className="brand-form"><header><h2>Logo principal</h2><p>Sube un PNG, JPG o WebP de máximo 2 MB.</p></header><label className="brand-logo-upload"><Upload size={25}/><strong>Seleccionar archivo</strong><small>La imagen se guarda únicamente en este navegador.</small><input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo}/></label>{brand.logo && <button className="brand-remove-logo" onClick={() => setBrand({ ...brand, logo: "" })}>Quitar logo</button>}</div>}
      </main>
      <aside className="brand-preview"><header><span>VISTA PREVIA</span><small>Aplicación automática</small></header><div className="brand-preview-card" style={{ background: brand.colors[1], color: brand.colors[4] }}><div className="brand-preview-logo">{brand.logo ? <Image src={brand.logo} width={150} height={70} alt={`Logo de ${brand.name}`}/> : <span style={{ borderColor: brand.colors[0], color: brand.colors[0] }}>{initials(brand.name)}</span>}</div><small style={{ color: brand.colors[0] }}>{brand.name.toUpperCase()}</small><h2 style={{ fontFamily: brand.primaryFont }}>{brand.tagline}</h2><p style={{ fontFamily: brand.secondaryFont }}>{brand.description}</p><button style={{ background: brand.colors[0] }}>CONOCER MÁS</button></div><div className="brand-preview-swatches">{brand.colors.map((color) => <i key={color} style={{ background: color }} title={color}/>)}</div></aside>
    </div>
  </section>;
}
