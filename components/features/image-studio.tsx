"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Download, Film, ImagePlus, PackagePlus, Palette, Sparkles, UserRound, X } from "lucide-react";

type Format = "instagram-post" | "instagram-square" | "instagram-story" | "facebook-post" | "linkedin-post" | "tiktok-post" | "pinterest-pin" | "x-post";
type Size = "1024x1024" | "1024x1536" | "1536x1024";
type ReferenceType = "style" | "character" | "product";

const formats: Array<{ id: Format; network: string; label: string; aspectLabel: string; ratio: number; size: Size }> = [
  { id: "instagram-post", network: "instagram", label: "Post vertical", aspectLabel: "4:5", ratio: 4 / 5, size: "1024x1536" },
  { id: "instagram-square", network: "instagram", label: "Post cuadrado", aspectLabel: "1:1", ratio: 1, size: "1024x1024" },
  { id: "instagram-story", network: "instagram", label: "Historia / Reel", aspectLabel: "9:16", ratio: 9 / 16, size: "1024x1536" },
  { id: "facebook-post", network: "facebook", label: "Post horizontal", aspectLabel: "1.91:1", ratio: 1.91, size: "1536x1024" },
  { id: "linkedin-post", network: "linkedin", label: "Post horizontal", aspectLabel: "1.91:1", ratio: 1.91, size: "1536x1024" },
  { id: "tiktok-post", network: "tiktok", label: "Video / Story", aspectLabel: "9:16", ratio: 9 / 16, size: "1024x1536" },
  { id: "pinterest-pin", network: "pinterest", label: "Pin estándar", aspectLabel: "2:3", ratio: 2 / 3, size: "1024x1536" },
  { id: "x-post", network: "x", label: "Post horizontal", aspectLabel: "16:9", ratio: 16 / 9, size: "1536x1024" },
];

export function ImageStudio({ creative = false }: { creative?: boolean }) {
  const router = useRouter();
  const [network, setNetwork] = useState("instagram");
  const [format, setFormat] = useState<Format>("instagram-post");
  const [size, setSize] = useState<Size>("1024x1536");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photographic");
  const [quality, setQuality] = useState("medium");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("");
  const [product, setProduct] = useState("");
  const [hasGraphicLine, setHasGraphicLine] = useState(false);
  const [graphicLine, setGraphicLine] = useState("");
  const [reference, setReference] = useState("");
  const [colors, setColors] = useState("");
  const [includeText, setIncludeText] = useState(false);
  const [headline, setHeadline] = useState("");
  const [supportingText, setSupportingText] = useState("");
  const [cta, setCta] = useState("");
  const [composition, setComposition] = useState("");
  const [avoid, setAvoid] = useState("Marcas de agua, logotipos inventados, texto adicional y elementos no solicitados");
  const [image, setImage] = useState("");
  const [variations, setVariations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [referenceImages, setReferenceImages] = useState<Partial<Record<ReferenceType, string>>>({});

  function selectFormat(next: (typeof formats)[number]) {
    setFormat(next.id);
    setSize(next.size);
  }

  function selectNetwork(value: string) {
    setNetwork(value);
    const nextFormat = formats.find((item) => item.network === value);
    if (nextFormat) selectFormat(nextFormat);
  }

  function loadReference(type: ReferenceType, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Las referencias deben ser JPG, PNG o WebP.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Cada referencia puede pesar máximo 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImages((current) => ({ ...current, [type]: String(reader.result) }));
      setError("");
    };
    reader.readAsDataURL(file);
  }

  function removeReference(type: ReferenceType) {
    setReferenceImages((current) => {
      const next = { ...current };
      delete next[type];
      return next;
    });
  }

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt, network, format, style, size, quality, objective, audience, product,
          graphicLine: hasGraphicLine ? graphicLine : "", reference, colors, composition, avoid,
          referenceImages: Object.entries(referenceImages).map(([type, data]) => ({ type, data })),
          headline: includeText ? headline : "",
          supportingText: includeText ? supportingText : "",
          cta: includeText ? cta : "",
        }),
      });
      const payload = await response.json() as { image?: string; error?: string };
      if (!response.ok || !payload.image) throw new Error(payload.error || "No se pudo generar la imagen.");
      const selectedFormat = formats.find((item) => item.id === format);
      const generatedImage = selectedFormat ? await cropToAspect(payload.image, selectedFormat.ratio) : payload.image;
      setImage(generatedImage);
      setVariations((current) => [generatedImage, ...current.filter((item) => item !== generatedImage)].slice(0, 4));
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "No se pudo generar la imagen.");
    } finally {
      setLoading(false);
    }
  }

  function animateInVideoStudio() {
    if (!image) return;
    try {
      sessionStorage.setItem("monova-video-source", image);
      sessionStorage.setItem("monova-video-prompt", prompt);
    } catch {
      setError("La imagen es demasiado grande para transferirla automáticamente. Descárgala y súbela en Video Studio.");
      return;
    }
    router.push("/app/video-studio");
  }

  return <section className="image-studio-live">
    <header className="tool-title"><div><h1>{creative ? "Creative Studio" : "Image Studio"}</h1><p>Generador visual rápido con referencias y formato para cada red social.</p></div><span className="connected-badge">OPENAI CONECTADO</span></header>
    <div className="generator-grid rich-generator-grid magnific-inspired">
      <form onSubmit={generate} className="creative-brief-form">
        <div className="generator-top-tabs"><button type="button" className="active">Imagen</button><button type="button" disabled>Video</button><button type="button" disabled>Audio</button></div>

        <label className="primary-control">Red social<select value={network} onChange={(event) => selectNetwork(event.target.value)}><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="linkedin">LinkedIn</option><option value="tiktok">TikTok</option><option value="pinterest">Pinterest</option><option value="x">X / Twitter</option></select></label>

        <div className="reference-section"><div className="reference-heading"><strong>Imágenes de referencia</strong><small>{Object.keys(referenceImages).length}/3 · opcionales</small></div><div className="reference-tiles upload-reference-tiles">
          <ReferenceUpload type="style" icon={Palette} label="Diseño base" value={referenceImages.style} onChange={loadReference} onRemove={removeReference}/>
          <ReferenceUpload type="character" icon={UserRound} label="Persona" value={referenceImages.character} onChange={loadReference} onRemove={removeReference}/>
          <ReferenceUpload type="product" icon={PackagePlus} label="Producto" value={referenceImages.product} onChange={loadReference} onRemove={removeReference}/>
        </div><small className="reference-help">Usa “Diseño base” para conservar la composición y cambiar solo lo que indiques · máximo 4 MB</small></div>

        <label className="prompt-control"><span className="prompt-label">Prompt <small><Sparkles size={10}/> Mejora profesional activa</small></span><textarea required minLength={10} maxLength={4000} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={referenceImages.style ? "Indica exactamente qué elementos o cifras quieres reemplazar…" : "Describe la imagen, el producto y el texto exacto que quieres ver…"}/></label>

        <div className="compact-controls">
          <label>Formato<select value={format} onChange={(event) => { const selected = formats.find((item) => item.id === event.target.value); if (selected) selectFormat(selected); }}>{formats.filter((item) => item.network === network).map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
          <label>Relación<input value={formats.find((item) => item.id === format)?.aspectLabel ?? ""} disabled aria-label="Relación final"/></label>
          <label>Calidad<select value={quality} onChange={(event) => setQuality(event.target.value)}><option value="low">Borrador</option><option value="medium">Alta</option><option value="high">Máxima</option></select></label>
        </div>

        <details className="advanced-brief"><summary>Ajustes avanzados <ChevronDown size={14}/></summary><div>
          <label>Objetivo de la pieza<input value={objective} onChange={(event) => setObjective(event.target.value)}/></label>
          <label>Producto o servicio<input value={product} onChange={(event) => setProduct(event.target.value)}/></label>
          <label>Público objetivo<input value={audience} onChange={(event) => setAudience(event.target.value)}/></label>
          <label>Referencia escrita<textarea value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Dirección creativa adicional"/></label>
          <div className="field-row"><label>Estilo<select value={style} onChange={(event) => setStyle(event.target.value)}><option value="photographic">Fotográfico</option><option value="editorial">Editorial</option><option value="product">Producto</option><option value="illustration">Ilustración</option></select></label><label>Colores<input value={colors} onChange={(event) => setColors(event.target.value)}/></label></div>
          <Toggle checked={hasGraphicLine} onChange={setHasGraphicLine} title="Usar línea gráfica" description="Aplicar colores y estilo de marca."/>
          {hasGraphicLine && <label>Línea gráfica<textarea value={graphicLine} onChange={(event) => setGraphicLine(event.target.value)}/></label>}
          <label>Composición<textarea value={composition} onChange={(event) => setComposition(event.target.value)}/></label>
          <Toggle checked={includeText} onChange={setIncludeText} title="Incluir texto en la pieza" description="Respeta literalmente el contenido."/>
          {includeText && <div className="embedded-copy"><label>Titular<input value={headline} maxLength={160} onChange={(event) => setHeadline(event.target.value)}/></label><label>Texto secundario<textarea value={supportingText} maxLength={240} onChange={(event) => setSupportingText(event.target.value)}/></label><label>CTA<input value={cta} maxLength={80} onChange={(event) => setCta(event.target.value)}/></label></div>}
          <label>Evitar<textarea value={avoid} onChange={(event) => setAvoid(event.target.value)}/></label>
        </div></details>

        <button className="generate-main" disabled={loading || prompt.trim().length < 10}>{loading ? "Generando imagen…" : image ? "Generar otra versión" : "Generar imagen"}</button>
        <small className="cost-notice">Esta acción consume créditos del proveedor.</small>
        {error && <p className="tool-error">{error}</p>}
      </form>
      <div className="generated-preview live-generated rich-preview">
        {image ? <><Image src={image} width={1536} height={1536} unoptimized alt="Imagen generada por Monova"/>{variations.length > 1 && <div className="generation-variations" aria-label="Variaciones generadas">{variations.map((variation, index) => <button type="button" className={variation === image ? "active" : ""} onClick={() => setImage(variation)} key={`${variation.slice(-24)}-${index}`} aria-label={`Seleccionar variación ${index + 1}`}><Image src={variation} width={72} height={72} unoptimized alt=""/></button>)}</div>}<div className="result-actions"><a href={image} download={`monova-${format}.png`}><Download size={14}/> Descargar</a><button type="button" onClick={animateInVideoStudio}><Film size={14}/> Animar en Video Studio</button><button disabled title="Requiere Supabase Storage">Guardar · requiere Storage</button></div></> :
          <div className="generation-empty"><ImagePlus size={32}/><strong>Tu creación aparecerá aquí</strong><p>Completa el brief creativo y genera la primera propuesta.</p></div>}
        {loading && <div className="processing-overlay"><Sparkles size={23}/><strong>OpenAI está creando la pieza</strong><span>Puede tardar algunos segundos</span></div>}
      </div>
    </div>
  </section>;
}

function Toggle({ checked, onChange, title, description }: { checked: boolean; onChange: (value: boolean) => void; title: string; description: string }) {
  return <label className="switch-row"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)}/><span><strong>{title}</strong><small>{description}</small></span></label>;
}

function ReferenceUpload({ type, icon: Icon, label, value, onChange, onRemove }: { type: ReferenceType; icon: typeof Palette; label: string; value?: string; onChange: (type: ReferenceType, event: ChangeEvent<HTMLInputElement>) => void; onRemove: (type: ReferenceType) => void }) {
  return <div className={`reference-upload ${value ? "has-image" : ""}`}>
    <label>{value ? <Image src={value} width={110} height={90} unoptimized alt={`Referencia de ${label}`}/> : <><Icon size={18}/><span>{label}</span><small>Cargar</small></>}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onChange(type, event)}/></label>
    {value && <button type="button" onClick={() => onRemove(type)} aria-label={`Quitar referencia de ${label}`}><X size={12}/></button>}
  </div>;
}

async function cropToAspect(source: string, targetRatio: number): Promise<string> {
  return await new Promise((resolve) => {
    const sourceImage = new window.Image();
    sourceImage.crossOrigin = "anonymous";
    sourceImage.onload = () => {
      const sourceRatio = sourceImage.width / sourceImage.height;
      let sx = 0;
      let sy = 0;
      let sw = sourceImage.width;
      let sh = sourceImage.height;
      if (sourceRatio > targetRatio) {
        sw = sourceImage.height * targetRatio;
        sx = (sourceImage.width - sw) / 2;
      } else {
        sh = sourceImage.width / targetRatio;
        sy = (sourceImage.height - sh) / 2;
      }
      const maxSide = 1536;
      const width = targetRatio >= 1 ? maxSide : Math.round(maxSide * targetRatio);
      const height = targetRatio >= 1 ? Math.round(maxSide / targetRatio) : maxSide;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")?.drawImage(sourceImage, sx, sy, sw, sh, 0, 0, width, height);
      try { resolve(canvas.toDataURL("image/png")); } catch { resolve(source); }
    };
    sourceImage.onerror = () => resolve(source);
    sourceImage.src = source;
  });
}
