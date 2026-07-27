"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";
import {
  ChevronDown,
  Clock3,
  Film,
  Gauge,
  Link2,
  MonitorPlay,
  PackagePlus,
  Settings2,
  Sparkles,
  WandSparkles,
} from "lucide-react";

const examples = [
  "Reel de producto",
  "Anuncio dinámico",
  "Video cinematográfico",
];

export function VideoStudio() {
  const [prompt, setPrompt] = useState("Reel de 15 segundos mostrando la resistencia de nuestros soportes de caucho");
  const [format, setFormat] = useState("9:16");
  const [duration, setDuration] = useState("15 s");
  const [style, setStyle] = useState("Cinematográfico");
  const [camera, setCamera] = useState("Acercamiento suave");
  const [quality, setQuality] = useState("1080p");
  const [configOpen, setConfigOpen] = useState(false);
  const [sourceImage, setSourceImage] = useState("");
  const [providerConfigured, setProviderConfigured] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const transferredImage = sessionStorage.getItem("monova-video-source");
        const transferredPrompt = sessionStorage.getItem("monova-video-prompt");
        if (transferredImage) setSourceImage(transferredImage);
        if (transferredPrompt) setPrompt(`Anima esta pieza manteniendo el producto y la identidad visual. ${transferredPrompt}`);
      } catch {
        // The studio remains usable when browser storage is unavailable.
      }
    });
    const controller = new AbortController();
    fetch("/api/ai/video/status", { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: { configured?: boolean }) => setProviderConfigured(Boolean(payload.configured)))
      .catch(() => undefined);
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  function loadSourceImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => setSourceImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  function selectExample(example: string) {
    const prompts: Record<string, string> = {
      "Reel de producto": "Reel vertical mostrando la resistencia de un soporte de caucho, prueba de presión, iluminación de estudio y cierre con el producto en primer plano.",
      "Anuncio dinámico": "Anuncio rápido de soportes de caucho para vehículos pesados, cortes dinámicos, texto contundente y estética industrial premium.",
      "Video cinematográfico": "Toma cinematográfica de un soporte de caucho en un taller oscuro, luz naranja lateral, cámara lenta y detalle extremo del material.",
    };
    setPrompt(prompts[example]);
  }

  return <section className="video-studio">
    <header className="video-studio-head">
      <div>
        <span className="video-eyebrow"><Sparkles size={13}/> CREACIÓN CON IA</span>
        <h1>Video Studio</h1>
        <p>Convierte una idea en un video listo para redes sociales.</p>
      </div>
      <button type="button" className="video-provider-status" onClick={() => setConfigOpen((value) => !value)}>
        <i/><span><strong>{providerConfigured ? "Proveedor conectado" : "Proveedor pendiente"}</strong><small>{providerConfigured ? "Motor listo para integrar" : "Configurar motor de video"}</small></span><ChevronDown size={15}/>
      </button>
    </header>

    {configOpen && <section className="video-provider-panel">
      <div><span><Link2 size={18}/></span><div><strong>Conecta un proveedor para generar</strong><p>La interfaz está lista. Añade las credenciales del motor de video que quieras utilizar.</p></div></div>
      <div className="video-provider-options">
        {["Runway", "Kling AI", "Google Veo"].map((provider) => <button type="button" key={provider}><Film size={15}/>{provider}<small>Configurar</small></button>)}
      </div>
    </section>}

    <div className="video-studio-grid">
      <aside className="video-controls">
        <section className="video-source-card">
          <header><div><PackagePlus size={17}/><strong>Imagen de partida</strong></div><small>OPCIONAL</small></header>
          {sourceImage ? <div className="video-source-preview"><Image src={sourceImage} width={640} height={640} unoptimized alt="Imagen de partida para el video"/><button type="button" onClick={() => setSourceImage("")}>Quitar</button></div> : <label className="video-source-upload"><Film size={20}/><strong>Sube una imagen o créala en Creative Studio</strong><small>JPG, PNG o WebP</small><input type="file" accept="image/png,image/jpeg,image/webp" onChange={loadSourceImage}/></label>}
        </section>
        <section className="video-prompt-card">
          <header><div><WandSparkles size={17}/><strong>Describe tu video</strong></div><span>{prompt.length}/600</span></header>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value.slice(0, 600))} placeholder="Describe la escena, el movimiento y el estilo…"/>
          <div className="video-example-row">{examples.map((example) => <button type="button" onClick={() => selectExample(example)} key={example}>{example}</button>)}</div>
        </section>

        <section className="video-settings-card">
          <header><div><Settings2 size={16}/><strong>Configuración</strong></div><small>PERSONALIZADA</small></header>
          <label>Formato<div className="video-format-pills">{["9:16", "1:1", "16:9"].map((value) => <button type="button" className={format === value ? "active" : ""} onClick={() => setFormat(value)} key={value}>{value}<small>{value === "9:16" ? "Reel" : value === "1:1" ? "Post" : "YouTube"}</small></button>)}</div></label>
          <div className="video-field-pair">
            <label><span><Clock3 size={13}/> Duración</span><select value={duration} onChange={(event) => setDuration(event.target.value)}><option>5 s</option><option>10 s</option><option>15 s</option><option>30 s</option></select></label>
            <label><span><Gauge size={13}/> Calidad</span><select value={quality} onChange={(event) => setQuality(event.target.value)}><option>720p</option><option>1080p</option><option>4K</option></select></label>
          </div>
          <label>Estilo visual<select value={style} onChange={(event) => setStyle(event.target.value)}><option>Cinematográfico</option><option>Producto premium</option><option>UGC natural</option><option>Industrial</option><option>Minimalista</option></select></label>
          <label>Movimiento de cámara<select value={camera} onChange={(event) => setCamera(event.target.value)}><option>Acercamiento suave</option><option>Órbita del producto</option><option>Cámara fija</option><option>Travelling lateral</option><option>Plano detalle</option></select></label>
        </section>

        <button type="button" className="video-generate-button" onClick={() => setConfigOpen(true)}>
          <Sparkles size={16}/><span><strong>Generar video</strong><small>{providerConfigured ? "Integración de generación pendiente" : "Requiere conectar un proveedor"}</small></span>
        </button>
      </aside>

      <main className="video-preview-panel">
        <header><div><MonitorPlay size={16}/><strong>Vista previa</strong></div><small>{format} · {duration} · {quality}</small></header>
        <div className={`video-preview-frame video-preview-empty ratio-${format.replace(":", "-")}`}>
          {sourceImage ? <div className="video-storyboard-ready"><Image src={sourceImage} width={960} height={960} unoptimized alt="Fotograma inicial seleccionado"/><span>FOTOGRAMA INICIAL</span></div> : <div className="generation-empty"><Film size={32}/><strong>Tu video aparecerá aquí</strong><p>Describe tu idea, configura el formato y genera la primera propuesta.</p></div>}
        </div>
      </main>
    </div>
  </section>;
}
