"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ImagePlus, Sparkles, Upload } from "lucide-react";

type ScaleFactor = "2x" | "4x" | "8x" | "16x";
type JobState = "idle" | "uploading" | "queued" | "processing" | "completed" | "failed";

export function MagnificStudio() {
  const [imageData, setImageData] = useState("");
  const [preview, setPreview] = useState("");
  const [scaleFactor, setScaleFactor] = useState<ScaleFactor>("2x");
  const [creativity, setCreativity] = useState(0);
  const [resemblance, setResemblance] = useState(2);
  const [hdr, setHdr] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState<JobState>("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState("");
  const [error, setError] = useState("");
  const pollRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (pollRef.current) window.clearTimeout(pollRef.current);
  }, []);

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Usa una imagen JPG, PNG o WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar 5 MB mientras Storage no esté conectado.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result);
      setImageData(value);
      setPreview(value);
      setResultUrl("");
      setStatus("idle");
      setError("");
    };
    reader.readAsDataURL(file);
  }

  async function poll(id: string) {
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(id)}`);
      const payload = await response.json() as { status?: JobState; progress?: number; generated?: string[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "No se pudo consultar el trabajo.");
      const nextStatus = payload.status ?? "processing";
      setStatus(nextStatus);
      setProgress(payload.progress ?? 0);
      if (nextStatus === "completed" && payload.generated?.[0]) {
        setResultUrl(payload.generated[0]);
        return;
      }
      if (nextStatus === "failed") throw new Error(payload.error || "Magnific no pudo procesar la imagen.");
      pollRef.current = window.setTimeout(() => void poll(id), 3_000);
    } catch (pollError) {
      setStatus("failed");
      setError(pollError instanceof Error ? pollError.message : "No se pudo consultar el trabajo.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!imageData) return setError("Selecciona una imagen primero.");
    setStatus("uploading");
    setProgress(2);
    setError("");
    try {
      const response = await fetch("/api/ai/magnific", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          scaleFactor,
          optimizedFor: "standard",
          creativity,
          resemblance,
          hdr,
          fractality: 0,
          prompt: prompt || undefined,
        }),
      });
      const payload = await response.json() as { jobId?: string; status?: JobState; error?: string };
      if (!response.ok || !payload.jobId) throw new Error(payload.error || "No se pudo crear el trabajo.");
      setJobId(payload.jobId);
      setStatus(payload.status ?? "queued");
      setProgress(5);
      await poll(payload.jobId);
    } catch (submitError) {
      setStatus("failed");
      setError(submitError instanceof Error ? submitError.message : "No se pudo mejorar la imagen.");
    }
  }

  const working = ["uploading", "queued", "processing"].includes(status);
  return <section className="magnific-live">
    <header className="tool-title"><div><h1>Escalar imagen</h1><p>Aumenta la resolución y recupera detalles sin perder la calidad original.</p></div><span className="connected-badge">MAGNIFIC CONECTADO</span></header>
    <div className="magnific-live-grid">
      <form onSubmit={submit}>
        <label className="upload-zone"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectImage}/><Upload size={22}/><strong>{preview ? "Cambiar imagen" : "Seleccionar imagen"}</strong><small>JPG, PNG o WebP · máximo temporal 5 MB</small></label>
        <label>Instrucción opcional<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe los detalles que quieres conservar o mejorar."/></label>
        <div className="field-row"><label>Escala<select value={scaleFactor} onChange={(event) => setScaleFactor(event.target.value as ScaleFactor)}><option>2x</option><option>4x</option><option>8x</option><option>16x</option></select></label><label>Modo<select><option value="standard">Estándar</option></select></label></div>
        <Range label="Creatividad" value={creativity} onChange={setCreativity}/>
        <Range label="Parecido" value={resemblance} onChange={setResemblance}/>
        <Range label="HDR / detalle" value={hdr} onChange={setHdr}/>
        <button className="generate-main" disabled={!preview || working}>{working ? `Escalando ${progress}%` : "Escalar imagen"}</button>
        {jobId && <small className="job-reference">Job: {jobId}</small>}
        {error && <p className="tool-error">{error}</p>}
      </form>
      <div className="live-comparison">
        <Preview title="Original" source={preview}/>
        <Preview title="Resultado" source={resultUrl}/>
        {!preview && <div className="comparison-empty"><ImagePlus size={30}/><p>Selecciona una imagen para comenzar.</p></div>}
        {working && <div className="processing-overlay"><Sparkles size={22}/><strong>Escalando y recuperando detalles</strong><span>{progress}%</span></div>}
      </div>
    </div>
  </section>;
}

function Range({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="range-control"><span>{label}<b>{value}</b></span><input type="range" min="-10" max="10" value={value} onChange={(event) => onChange(Number(event.target.value))}/></label>;
}

function Preview({ title, source }: { title: string; source: string }) {
  if (!source) return null;
  return <div className="live-preview"><Image src={source} width={900} height={900} unoptimized alt={`${title} para comparación`}/><b>{title}</b></div>;
}
