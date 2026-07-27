"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Download, Pause, Play, RotateCcw, Scissors, Type, Upload, Volume2 } from "lucide-react";

type Aspect = "9:16" | "1:1" | "16:9" | "4:5";
type TextPosition = "top" | "center" | "bottom";
type TextEffect = "clean" | "shadow" | "outline" | "box" | "neon";
type TextAnimation = "none" | "fade" | "pop" | "slide";

const aspectDimensions: Record<Aspect, { width: number; height: number }> = {
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1280, height: 720 },
  "4:5": { width: 864, height: 1080 },
};

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
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState("");

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
    setVolume(1);
    setPlaybackRate(1);
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

  async function exportVideo() {
    const video = videoRef.current;
    if (!video || !source || trimEnd <= trimStart) return;
    if (!window.MediaRecorder) return setError("Este navegador no permite exportar video localmente.");
    setExporting(true);
    setExportProgress(0);
    setError("");
    const dimensions = aspectDimensions[aspect];
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d");
    if (!context) {
      setExporting(false);
      return setError("No se pudo iniciar el renderizador.");
    }
    const mimeType = ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm;codecs=vp8"]
      .find((type) => MediaRecorder.isTypeSupported(type)) || "video/webm";
    const canvasStream = canvas.captureStream(30);
    const captured = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.();
    const audioTracks = volume > 0 ? (captured?.getAudioTracks() || []) : [];
    const outputStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
    const recorder = new MediaRecorder(outputStream, { mimeType, videoBitsPerSecond: 8_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    const finished = new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });

    const previousMuted = video.muted;
    video.muted = true;
    video.pause();
    video.currentTime = trimStart;
    await waitForSeek(video);
    recorder.start(250);

    let stopped = false;
    const render = () => {
      if (stopped) return;
      drawVideoFrame(context, video, dimensions.width, dimensions.height);
      if (overlayText.trim()) drawText(context, overlayText, dimensions.width, dimensions.height, textPosition, textSize, textColor, textEffect, textAnimation, video.currentTime - trimStart);
      const elapsed = Math.max(0, video.currentTime - trimStart);
      setExportProgress(Math.min(100, Math.round((elapsed / (trimEnd - trimStart)) * 100)));
      if (video.currentTime >= trimEnd || video.ended) {
        stopped = true;
        video.pause();
        recorder.stop();
        return;
      }
      requestAnimationFrame(render);
    };
    await video.play();
    render();
    await finished;
    video.muted = previousMuted;
    video.currentTime = trimStart;
    setCurrentTime(trimStart);
    setPlaying(false);

    const extension = mimeType.startsWith("video/mp4") ? "mp4" : "webm";
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileName.replace(/\.[^.]+$/, "") || "monova-video"}-${aspect.replace(":", "x")}.${extension}`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setExportProgress(100);
    setExporting(false);
  }

  return <section className="video-editor">
    <header className="tool-title"><div><h1>Video Editor <small>BETA</small></h1><p>Edita y exporta videos cortos para redes directamente en Monova.</p></div><span className="connected-badge">EDITOR LOCAL</span></header>
    {!source ? <label className="video-upload"><input type="file" accept="video/*" onChange={chooseVideo}/><Upload size={32}/><strong>Sube tu primer video</strong><span>MP4, MOV o WebM · máximo 500 MB</span><b>Seleccionar video</b></label> :
      <div className="video-editor-shell">
        <aside className="video-controls">
          <section><h3><Scissors size={15}/> Proyecto</h3><label>Formato<select value={aspect} onChange={(event) => setAspect(event.target.value as Aspect)}><option>9:16</option><option>1:1</option><option>4:5</option><option>16:9</option></select></label><label>Velocidad<select value={playbackRate} onChange={(event) => { const next = Number(event.target.value); setPlaybackRate(next); if (videoRef.current) videoRef.current.playbackRate = next; }}><option value=".5">0.5×</option><option value=".75">0.75×</option><option value="1">1× normal</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label><label>Volumen <span>{Math.round(volume * 100)}%</span><input type="range" min="0" max="1" step=".05" value={volume} onChange={(event) => { const next = Number(event.target.value); setVolume(next); if (videoRef.current) videoRef.current.volume = next; }}/></label></section>
          <section><h3><Type size={15}/> Texto</h3><label>Contenido<textarea value={overlayText} maxLength={120} onChange={(event) => setOverlayText(event.target.value)} placeholder="Escribe un título…"/></label><div className="field-row"><label>Posición<select value={textPosition} onChange={(event) => setTextPosition(event.target.value as TextPosition)}><option value="top">Arriba</option><option value="center">Centro</option><option value="bottom">Abajo</option></select></label><label>Color<input type="color" value={textColor} onChange={(event) => setTextColor(event.target.value)}/></label></div><label>Tamaño <span>{textSize}px</span><input type="range" min="22" max="90" value={textSize} onChange={(event) => setTextSize(Number(event.target.value))}/></label><span className="control-label">Estilo</span><div className="text-presets">{(["clean","shadow","outline","box","neon"] as TextEffect[]).map((effect) => <button type="button" className={textEffect === effect ? "active" : ""} onClick={() => setTextEffect(effect)} key={effect}>{({clean:"Limpio",shadow:"Sombra",outline:"Contorno",box:"Caja",neon:"Neón"})[effect]}</button>)}</div><label>Animación<select value={textAnimation} onChange={(event) => setTextAnimation(event.target.value as TextAnimation)}><option value="none">Sin animación</option><option value="fade">Aparecer</option><option value="pop">Pop</option><option value="slide">Deslizar</option></select></label></section>
          <button className="reset-editor" onClick={reset}><RotateCcw size={14}/> Restablecer edición</button>
        </aside>
        <main className="video-workspace">
          <div className={`video-stage aspect-${aspect.replace(":", "-")}`}><video ref={videoRef} src={source} playsInline onLoadedMetadata={loaded} onTimeUpdate={updateTime}/>{overlayText && <div className={`video-text position-${textPosition} effect-${textEffect} animation-${textAnimation}`} style={{ color: textColor, fontSize: `${Math.max(18, textSize * .55)}px` }}>{overlayText}</div>}</div>
          <div className="playback-bar"><button onClick={() => void togglePlayback()}>{playing ? <Pause size={17}/> : <Play size={17}/>}</button><span>{formatTime(currentTime)} / {formatTime(duration)}</span><Volume2 size={15}/><b>{fileName}</b><button className="export-video" disabled={exporting} onClick={() => void exportVideo()}><Download size={15}/>{exporting ? `Exportando ${exportProgress}%` : "Exportar video"}</button></div>
          <div className="timeline"><div className="timeline-head"><strong>Timeline</strong><span>Duración final: {formatTime(Math.max(0, (trimEnd - trimStart) / playbackRate))}</span></div><div className="cut-toolbar"><button onClick={cutStartAtPlayhead}><Scissors size={13}/> Cortar todo antes</button><button onClick={cutEndAtPlayhead}><Scissors size={13}/> Cortar todo después</button><span>Cabezal: {formatTime(currentTime)}</span></div><input className="playhead-range" type="range" min={trimStart} max={trimEnd || 0.1} step=".01" value={Math.min(Math.max(currentTime, trimStart), trimEnd || .1)} onChange={(event) => seek(Number(event.target.value))}/><div className="clip-track"><span style={{ left: `${duration ? (trimStart / duration) * 100 : 0}%`, right: `${duration ? 100 - (trimEnd / duration) * 100 : 0}%` }}><Scissors size={13}/> {fileName}</span></div><div className="trim-row"><label>Inicio<input type="range" min="0" max={duration} step=".05" value={trimStart} onChange={(event) => updateTrimStart(Number(event.target.value))}/><b>{formatTime(trimStart)}</b></label><label>Final<input type="range" min="0" max={duration} step=".05" value={trimEnd} onChange={(event) => updateTrimEnd(Number(event.target.value))}/><b>{formatTime(trimEnd)}</b></label></div></div>
        </main>
      </div>}
    {error && <p className="tool-error">{error}</p>}
  </section>;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function waitForSeek(video: HTMLVideoElement) {
  if (video.readyState >= 2) return Promise.resolve();
  return new Promise<void>((resolve) => video.addEventListener("seeked", () => resolve(), { once: true }));
}

function drawVideoFrame(context: CanvasRenderingContext2D, video: HTMLVideoElement, width: number, height: number) {
  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);
  const sourceRatio = video.videoWidth / video.videoHeight;
  const targetRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  let x = 0;
  let y = 0;
  if (sourceRatio > targetRatio) {
    drawWidth = height * sourceRatio;
    x = (width - drawWidth) / 2;
  } else {
    drawHeight = width / sourceRatio;
    y = (height - drawHeight) / 2;
  }
  context.drawImage(video, x, y, drawWidth, drawHeight);
}

function drawText(context: CanvasRenderingContext2D, text: string, width: number, height: number, position: TextPosition, fontSize: number, color: string, effect: TextEffect, animation: TextAnimation, elapsed: number) {
  const scale = width / 720;
  const size = Math.round(fontSize * scale);
  const entrance = Math.min(1, Math.max(0, elapsed / .45));
  const animatedSize = animation === "pop" ? size * (.65 + entrance * .35) : size;
  context.font = `800 ${animatedSize}px Inter, Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.globalAlpha = animation === "fade" ? entrance : 1;
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
