"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Download, Pause, Play, RotateCcw, Scissors, Type, Upload, Volume2 } from "lucide-react";

type Aspect = "9:16" | "1:1" | "16:9" | "4:5";
type TextPosition = "top" | "center" | "bottom";
type TextEffect = "clean" | "shadow" | "outline" | "box" | "neon";
type TextAnimation = "none" | "fade" | "pop" | "slide";
type VideoFit = "cover" | "contain";
type BrandPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type ExportQuality = "720p" | "1080p";

const aspectDimensions: Record<Aspect, { width: number; height: number }> = {
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1280, height: 720 },
  "4:5": { width: 864, height: 1080 },
};

const highQualityDimensions: Record<Aspect, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
};

const stylePresets = [
  { id: "monova", label: "Monova", color: "#ff6a00", effect: "box" as TextEffect, font: "Inter, Arial, sans-serif", animation: "slide" as TextAnimation },
  { id: "minimal", label: "Minimal", color: "#ffffff", effect: "clean" as TextEffect, font: "Inter, Arial, sans-serif", animation: "fade" as TextAnimation },
  { id: "editorial", label: "Editorial", color: "#fff7e8", effect: "shadow" as TextEffect, font: "Georgia, serif", animation: "fade" as TextAnimation },
  { id: "impact", label: "Impacto", color: "#fff200", effect: "outline" as TextEffect, font: "Impact, Haettenschweiler, sans-serif", animation: "pop" as TextAnimation },
  { id: "neon", label: "Neón", color: "#75fff1", effect: "neon" as TextEffect, font: "Arial Black, Arial, sans-serif", animation: "pop" as TextAnimation },
];

export function VideoEditorStudio() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const objectUrlRef = useRef("");
  const [source, setSource] = useState("");
  const [fileName, setFileName] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [aspect, setAspect] = useState<Aspect>("9:16");
  const [overlayText, setOverlayText] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(48);
  const [textPosition, setTextPosition] = useState<TextPosition>("center");
  const [textEffect, setTextEffect] = useState<TextEffect>("shadow");
  const [textAnimation, setTextAnimation] = useState<TextAnimation>("fade");
  const [fontFamily, setFontFamily] = useState("Inter, Arial, sans-serif");
  const [textOpacity, setTextOpacity] = useState(1);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoFit, setVideoFit] = useState<VideoFit>("cover");
  const [stageColor, setStageColor] = useState("#111111");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [brandEnabled, setBrandEnabled] = useState(false);
  const [brandLabel, setBrandLabel] = useState("MONOVA");
  const [brandPosition, setBrandPosition] = useState<BrandPosition>("bottom-right");
  const [exportQuality, setExportQuality] = useState<ExportQuality>("1080p");
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState("");
  const [exportNotice, setExportNotice] = useState("");

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  function chooseVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) return setError("Selecciona un archivo de video válido.");
    if (file.size > 500 * 1024 * 1024) return setError("El video no puede superar 500 MB.");
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setSource(url);
    setFileName(file.name);
    setDuration(0);
    setCurrentTime(0);
    setTrimStart(0);
    setTrimEnd(0);
    setPlaying(false);
    setError("");
    setExportNotice("");
  }

  function loaded() {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    setDuration(video.duration);
    setTrimEnd(video.duration);
  }

  function updateTime() {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (video.currentTime >= trimEnd && trimEnd > trimStart) {
      video.pause();
      video.currentTime = trimStart;
      setPlaying(false);
    }
  }

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (video.currentTime < trimStart || video.currentTime >= trimEnd) video.currentTime = trimStart;
      await video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  function seek(value: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
  }

  function updateTrimStart(value: number) {
    const next = Math.min(value, Math.max(0, trimEnd - 0.1));
    setTrimStart(next);
    seek(next);
  }

  function updateTrimEnd(value: number) {
    const next = Math.max(value, Math.min(duration, trimStart + 0.1));
    setTrimEnd(next);
    if (currentTime > next) seek(next);
  }

  function reset() {
    setTrimStart(0);
    setTrimEnd(duration);
    setOverlayText("");
    setTextColor("#ffffff");
    setTextSize(48);
    setTextPosition("center");
    setTextEffect("shadow");
    setTextAnimation("fade");
    setFontFamily("Inter, Arial, sans-serif");
    setTextOpacity(1);
    setLetterSpacing(0);
    setVolume(1);
    setPlaybackRate(1);
    setVideoFit("cover");
    setStageColor("#111111");
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setShowSafeZones(false);
    setBrandEnabled(false);
    setBrandLabel("MONOVA");
    setBrandPosition("bottom-right");
    setExportQuality("1080p");
    if (videoRef.current) videoRef.current.playbackRate = 1;
    seek(0);
  }

  function cutStartAtPlayhead() {
    if (currentTime >= trimEnd - .1) return setError("El corte inicial debe quedar antes del final.");
    setTrimStart(currentTime);
    setError("");
  }

  function cutEndAtPlayhead() {
    if (currentTime <= trimStart + .1) return setError("El corte final debe quedar después del inicio.");
    setTrimEnd(currentTime);
    setError("");
  }

  function applyStylePreset(preset: (typeof stylePresets)[number]) {
    setTextColor(preset.color);
    setTextEffect(preset.effect);
    setFontFamily(preset.font);
    setTextAnimation(preset.animation);
  }

  async function exportVideo() {
    const video = videoRef.current;
    if (!video || !source || trimEnd <= trimStart) return;
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
      return setError("Este navegador no permite exportar video localmente. Intenta con Chrome o Edge.");
    }
    setExporting(true);
    setExportProgress(0);
    setError("");
    setExportNotice("");
    const previousMuted = video.muted;
    let recorder: MediaRecorder | null = null;
    let outputStream: MediaStream | null = null;
    let renderTimer = 0;
    let stopped = false;
    let watchdog = 0;

    try {
      const dimensions = exportQuality === "1080p" ? highQualityDimensions[aspect] : aspectDimensions[aspect];
      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No se pudo iniciar el renderizador.");

      const canvasStream = canvas.captureStream(30);
      const captured = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.();
      const audioTracks = volume > 0 ? (captured?.getAudioTracks() || []) : [];
      outputStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
      const candidates = ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
        .filter((type) => MediaRecorder.isTypeSupported(type));
      for (const mimeType of candidates) {
        try {
          recorder = new MediaRecorder(outputStream, { mimeType, videoBitsPerSecond: 8_000_000 });
          break;
        } catch {
          // Some browsers report codec support but reject it for a canvas stream.
        }
      }
      if (!recorder) throw new Error("El navegador no encontró un formato de exportación compatible.");

      const activeRecorder = recorder;
      const chunks: Blob[] = [];
      const finished = new Promise<void>((resolve, reject) => {
        activeRecorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        activeRecorder.onstop = () => resolve();
        activeRecorder.onerror = () => reject(new Error("El navegador interrumpió la exportación."));
      });

      video.muted = true;
      video.pause();
      await seekVideo(video, trimStart);
      activeRecorder.start(250);

      const outputDuration = (trimEnd - trimStart) / playbackRate;
      const renderStartedAt = performance.now();
      const render = () => {
        if (stopped) return;
        const elapsed = Math.max(0, (performance.now() - renderStartedAt) / 1_000);
        const desiredSourceTime = Math.min(trimEnd, trimStart + elapsed * playbackRate);
        if (Math.abs(video.currentTime - desiredSourceTime) > .08) {
          video.currentTime = desiredSourceTime;
        }
        drawVideoFrame(context, video, dimensions.width, dimensions.height, videoFit, stageColor, brightness, contrast, saturation);
        if (overlayText.trim()) drawText(context, overlayText, dimensions.width, dimensions.height, textPosition, textSize, textColor, textEffect, textAnimation, video.currentTime - trimStart, fontFamily, textOpacity, letterSpacing);
        if (brandEnabled && brandLabel.trim()) drawBrand(context, brandLabel, dimensions.width, dimensions.height, brandPosition, textColor);
        setExportProgress(Math.min(99, Math.round((elapsed / outputDuration) * 100)));
        if (elapsed >= outputDuration) {
          stopped = true;
          video.pause();
          if (activeRecorder.state !== "inactive") activeRecorder.stop();
          return;
        }
        renderTimer = window.setTimeout(render, 33);
      };

      await video.play().catch(() => undefined);
      render();
      const maximumRenderTime = Math.max(15_000, outputDuration * 3_000);
      const timedOut = new Promise<never>((_, reject) => {
        watchdog = window.setTimeout(() => reject(new Error("La exportación tardó demasiado y fue cancelada.")), maximumRenderTime);
      });
      await Promise.race([finished, timedOut]);

      if (!chunks.length) throw new Error("El navegador no generó datos para el video.");
      const mimeType = activeRecorder.mimeType || "video/webm";
      const extension = mimeType.startsWith("video/mp4") ? "mp4" : "webm";
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const downloadName = `${fileName.replace(/\.[^.]+$/, "") || "monova-video"}-${aspect.replace(":", "x")}.${extension}`;
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = downloadName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setExportProgress(100);
      setExportNotice(`Listo: ${downloadName} se guardó en tus Descargas.`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "No se pudo exportar el video.");
    } finally {
      stopped = true;
      if (renderTimer) window.clearTimeout(renderTimer);
      if (watchdog) window.clearTimeout(watchdog);
      if (recorder?.state !== "inactive") recorder?.stop();
      outputStream?.getTracks().forEach((track) => track.stop());
      video.pause();
      video.muted = previousMuted;
      await seekVideo(video, trimStart).catch(() => undefined);
      setCurrentTime(trimStart);
      setPlaying(false);
      setExporting(false);
    }
  }

  return <section className="video-editor">
    <header className="tool-title"><div><h1>Video Editor <small>BETA</small></h1><p>Edita y exporta videos cortos para redes directamente en Monova.</p></div><span className="connected-badge">EDITOR LOCAL</span></header>
    {!source ? <label className="video-upload"><input type="file" accept="video/*" onChange={chooseVideo}/><Upload size={32}/><strong>Sube tu primer video</strong><span>MP4, MOV o WebM · máximo 500 MB</span><b>Seleccionar video</b></label> :
      <div className="video-editor-shell">
        <aside className="video-controls video-editor-controls">
          <section>
            <h3><Scissors size={15}/> Proyecto</h3>
            <div className="editor-control-grid"><label>Formato<select value={aspect} onChange={(event) => setAspect(event.target.value as Aspect)}><option>9:16</option><option>1:1</option><option>4:5</option><option>16:9</option></select></label><label>Calidad<select value={exportQuality} onChange={(event) => setExportQuality(event.target.value as ExportQuality)}><option>720p</option><option>1080p</option></select></label></div>
            <label>Velocidad<select value={playbackRate} onChange={(event) => { const next = Number(event.target.value); setPlaybackRate(next); if (videoRef.current) videoRef.current.playbackRate = next; }}><option value=".5">0.5×</option><option value=".75">0.75×</option><option value="1">1× normal</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
            <label>Volumen <span>{Math.round(volume * 100)}%</span><input type="range" min="0" max="1" step=".05" value={volume} onChange={(event) => { const next = Number(event.target.value); setVolume(next); if (videoRef.current) videoRef.current.volume = next; }}/></label>
          </section>
          <section>
            <h3><Type size={15}/> Estilo rápido</h3>
            <div className="brand-presets">{stylePresets.map((preset) => <button type="button" onClick={() => applyStylePreset(preset)} key={preset.id}><i style={{ background: preset.color }}/><span>{preset.label}</span></button>)}</div>
          </section>
          <section>
            <h3><Type size={15}/> Texto</h3>
            <label>Contenido<textarea value={overlayText} maxLength={120} onChange={(event) => setOverlayText(event.target.value)} placeholder="Escribe un título…"/></label>
            <label>Tipografía<select value={fontFamily} onChange={(event) => setFontFamily(event.target.value)}><option value="Inter, Arial, sans-serif">Inter · Moderna</option><option value="Georgia, serif">Georgia · Editorial</option><option value="Impact, Haettenschweiler, sans-serif">Impact · Potente</option><option value="Arial Black, Arial, sans-serif">Arial Black · Bold</option><option value="Courier New, monospace">Courier · Tech</option></select></label>
            <div className="field-row"><label>Posición<select value={textPosition} onChange={(event) => setTextPosition(event.target.value as TextPosition)}><option value="top">Arriba</option><option value="center">Centro</option><option value="bottom">Abajo</option></select></label><label>Color<input type="color" value={textColor} onChange={(event) => setTextColor(event.target.value)}/></label></div>
            <label>Tamaño <span>{textSize}px</span><input type="range" min="22" max="90" value={textSize} onChange={(event) => setTextSize(Number(event.target.value))}/></label>
            <label>Opacidad <span>{Math.round(textOpacity * 100)}%</span><input type="range" min=".2" max="1" step=".05" value={textOpacity} onChange={(event) => setTextOpacity(Number(event.target.value))}/></label>
            <label>Espaciado <span>{letterSpacing}px</span><input type="range" min="-2" max="12" step="1" value={letterSpacing} onChange={(event) => setLetterSpacing(Number(event.target.value))}/></label>
            <span className="control-label">Tratamiento</span><div className="text-presets">{(["clean","shadow","outline","box","neon"] as TextEffect[]).map((effect) => <button type="button" className={textEffect === effect ? "active" : ""} onClick={() => setTextEffect(effect)} key={effect}>{({clean:"Limpio",shadow:"Sombra",outline:"Contorno",box:"Caja",neon:"Neón"})[effect]}</button>)}</div>
            <label>Animación<select value={textAnimation} onChange={(event) => setTextAnimation(event.target.value as TextAnimation)}><option value="none">Sin animación</option><option value="fade">Aparecer</option><option value="pop">Pop</option><option value="slide">Deslizar</option></select></label>
          </section>
          <section>
            <h3><Volume2 size={15}/> Imagen</h3>
            <div className="editor-control-grid"><label>Encuadre<select value={videoFit} onChange={(event) => setVideoFit(event.target.value as VideoFit)}><option value="cover">Llenar</option><option value="contain">Completo</option></select></label><label>Fondo<input type="color" value={stageColor} onChange={(event) => setStageColor(event.target.value)}/></label></div>
            <label>Brillo <span>{brightness}%</span><input type="range" min="50" max="150" value={brightness} onChange={(event) => setBrightness(Number(event.target.value))}/></label>
            <label>Contraste <span>{contrast}%</span><input type="range" min="50" max="150" value={contrast} onChange={(event) => setContrast(Number(event.target.value))}/></label>
            <label>Saturación <span>{saturation}%</span><input type="range" min="0" max="180" value={saturation} onChange={(event) => setSaturation(Number(event.target.value))}/></label>
            <label className="editor-toggle"><input type="checkbox" checked={showSafeZones} onChange={(event) => setShowSafeZones(event.target.checked)}/><span>Mostrar zonas seguras</span></label>
          </section>
          <section>
            <h3><Type size={15}/> Firma de marca</h3>
            <label className="editor-toggle"><input type="checkbox" checked={brandEnabled} onChange={(event) => setBrandEnabled(event.target.checked)}/><span>Mostrar firma</span></label>
            {brandEnabled && <><label>Nombre<input type="text" maxLength={28} value={brandLabel} onChange={(event) => setBrandLabel(event.target.value)}/></label><label>Ubicación<select value={brandPosition} onChange={(event) => setBrandPosition(event.target.value as BrandPosition)}><option value="top-left">Arriba izquierda</option><option value="top-right">Arriba derecha</option><option value="bottom-left">Abajo izquierda</option><option value="bottom-right">Abajo derecha</option></select></label></>}
          </section>
          <button className="reset-editor" onClick={reset}><RotateCcw size={14}/> Restablecer edición</button>
        </aside>
        <main className="video-workspace">
          <div className={`video-stage aspect-${aspect.replace(":", "-")}`} style={{ background: stageColor }}><video ref={videoRef} src={source} playsInline onLoadedMetadata={loaded} onTimeUpdate={updateTime} style={{ objectFit: videoFit, filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` }}/>{showSafeZones && <div className="video-safe-zones"><span/></div>}{overlayText && <div className={`video-text position-${textPosition} effect-${textEffect} animation-${textAnimation}`} style={{ color: textColor, fontSize: `${Math.max(18, textSize * .55)}px`, fontFamily, opacity: textOpacity, letterSpacing: `${letterSpacing}px` }}>{overlayText}</div>}{brandEnabled && brandLabel.trim() && <div className={`video-brand position-${brandPosition}`} style={{ color: textColor }}>{brandLabel}</div>}</div>
          <div className="playback-bar"><button onClick={() => void togglePlayback()}>{playing ? <Pause size={17}/> : <Play size={17}/>}</button><span>{formatTime(currentTime)} / {formatTime(duration)}</span><Volume2 size={15}/><b>{fileName}</b><button className="export-video" disabled={exporting} onClick={() => void exportVideo()}><Download size={15}/>{exporting ? `Exportando ${exportProgress}%` : "Exportar video"}</button></div>
          <div className="timeline"><div className="timeline-head"><strong>Timeline · 3 capas</strong><span>Duración final: {formatTime(Math.max(0, (trimEnd - trimStart) / playbackRate))}</span></div><div className="cut-toolbar"><button onClick={cutStartAtPlayhead}><Scissors size={13}/> Cortar todo antes</button><button onClick={cutEndAtPlayhead}><Scissors size={13}/> Cortar todo después</button><span>Cabezal: {formatTime(currentTime)}</span></div><input className="playhead-range" type="range" min={trimStart} max={trimEnd || 0.1} step=".01" value={Math.min(Math.max(currentTime, trimStart), trimEnd || .1)} onChange={(event) => seek(Number(event.target.value))}/><div className="timeline-layers"><div className="timeline-layer-label">VIDEO</div><div className="clip-track"><span style={{ left: `${duration ? (trimStart / duration) * 100 : 0}%`, right: `${duration ? 100 - (trimEnd / duration) * 100 : 0}%` }}><Scissors size={13}/> {fileName}</span></div>{overlayText && <><div className="timeline-layer-label">TEXTO</div><div className="clip-track text-layer"><span>{overlayText}</span></div></>}{brandEnabled && <><div className="timeline-layer-label">MARCA</div><div className="clip-track brand-layer"><span>{brandLabel}</span></div></>}</div><div className="trim-row"><label>Inicio<input type="range" min="0" max={duration} step=".05" value={trimStart} onChange={(event) => updateTrimStart(Number(event.target.value))}/><b>{formatTime(trimStart)}</b></label><label>Final<input type="range" min="0" max={duration} step=".05" value={trimEnd} onChange={(event) => updateTrimEnd(Number(event.target.value))}/><b>{formatTime(trimEnd)}</b></label></div></div>
        </main>
      </div>}
    {error && <p className="tool-error">{error}</p>}
    {exportNotice && <p className="tool-success">{exportNotice}</p>}
  </section>;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function seekVideo(video: HTMLVideoElement, time: number) {
  if (Math.abs(video.currentTime - time) < .02 && video.readyState >= 2) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    let timeout = 0;
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener("seeked", completed);
      video.removeEventListener("error", failed);
    };
    const completed = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error("No se pudo leer el video seleccionado.")); };
    timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("No se pudo preparar el video para exportar."));
    }, 5_000);
    video.addEventListener("seeked", completed, { once: true });
    video.addEventListener("error", failed, { once: true });
    video.currentTime = time;
  });
}

function drawVideoFrame(context: CanvasRenderingContext2D, video: HTMLVideoElement, width: number, height: number, fit: VideoFit, background: string, brightness: number, contrast: number, saturation: number) {
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  const sourceRatio = video.videoWidth / video.videoHeight;
  const targetRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  let x = 0;
  let y = 0;
  if ((sourceRatio > targetRatio && fit === "cover") || (sourceRatio < targetRatio && fit === "contain")) {
    drawWidth = height * sourceRatio;
    x = (width - drawWidth) / 2;
  } else {
    drawHeight = width / sourceRatio;
    y = (height - drawHeight) / 2;
  }
  context.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  context.drawImage(video, x, y, drawWidth, drawHeight);
  context.filter = "none";
}

function drawText(context: CanvasRenderingContext2D, text: string, width: number, height: number, position: TextPosition, fontSize: number, color: string, effect: TextEffect, animation: TextAnimation, elapsed: number, fontFamily: string, opacity: number, letterSpacing: number) {
  const scale = width / 720;
  const size = Math.round(fontSize * scale);
  const entrance = Math.min(1, Math.max(0, elapsed / .45));
  const animatedSize = animation === "pop" ? size * (.65 + entrance * .35) : size;
  context.font = `800 ${animatedSize}px ${fontFamily}`;
  (context as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${letterSpacing * scale}px`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.globalAlpha = opacity * (animation === "fade" ? entrance : 1);
  context.lineWidth = effect === "outline" ? Math.max(5, size * .13) : Math.max(3, size * .09);
  context.strokeStyle = effect === "neon" ? color : "rgba(0,0,0,.8)";
  context.shadowColor = effect === "neon" ? color : effect === "shadow" ? "rgba(0,0,0,.9)" : "transparent";
  context.shadowBlur = effect === "neon" ? size * .35 : effect === "shadow" ? size * .12 : 0;
  context.fillStyle = color;
  const y = position === "top" ? height * .15 : position === "bottom" ? height * .84 : height * .5;
  const lines = wrapText(context, text, width * .82);
  const lineHeight = size * 1.12;
  lines.forEach((line, index) => {
    const lineY = y + (index - (lines.length - 1) / 2) * lineHeight;
    const x = width / 2 + (animation === "slide" ? (1 - entrance) * -width * .25 : 0);
    if (effect === "box") {
      const measured = context.measureText(line).width;
      context.fillStyle = "rgba(0,0,0,.72)";
      context.fillRect(x - measured / 2 - size * .18, lineY - size * .56, measured + size * .36, size * 1.12);
      context.fillStyle = color;
    }
    if (effect !== "clean" && effect !== "box") context.strokeText(line, x, lineY);
    context.fillText(line, x, lineY);
  });
  context.globalAlpha = 1;
  context.shadowBlur = 0;
  (context as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";
}

function drawBrand(context: CanvasRenderingContext2D, text: string, width: number, height: number, position: BrandPosition, color: string) {
  const size = Math.max(18, Math.round(width * .025));
  const paddingX = size * .7;
  const paddingY = size * .48;
  context.font = `800 ${size}px Inter, Arial, sans-serif`;
  context.textBaseline = "middle";
  const measured = context.measureText(text).width;
  const left = position.endsWith("left") ? width * .055 : width * .945 - measured - paddingX * 2;
  const top = position.startsWith("top") ? height * .055 : height * .945 - size - paddingY * 2;
  context.fillStyle = "rgba(0,0,0,.62)";
  roundRect(context, left, top, measured + paddingX * 2, size + paddingY * 2, size * .45);
  context.fill();
  context.fillStyle = color;
  context.textAlign = "left";
  context.fillText(text, left + paddingX, top + (size + paddingY * 2) / 2);
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}
