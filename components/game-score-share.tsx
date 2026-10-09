"use client";

import { useState } from "react";
import { Download, Share2 } from "lucide-react";
import styles from "./monova-game.module.css";

export function GameScoreShare({ score }: { score: number }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const shareText = `¡Hice ${score.toLocaleString("es-CO")} puntos en el Halloween de Monova! ¿Me superas?`;

  async function downloadCard() {
    setBusy(true);
    setStatus("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
      gradient.addColorStop(0, "#26103e");
      gradient.addColorStop(1, "#0d0714");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1080);
      ctx.strokeStyle = "#ff7428";
      ctx.lineWidth = 6;
      ctx.strokeRect(44, 44, 992, 992);
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = i % 2 ? "#ff742833" : "#ffd34a33";
        ctx.fillRect(80 + (i * 137) % 910, 90 + (i * 211) % 890, 10, 10);
      }
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "900 60px Arial";
      ctx.fillText("MONOVA", 540, 170);
      ctx.fillStyle = "#ffb64f";
      ctx.font = "bold 26px Arial";
      ctx.fillText("CONCURSO HALLOWEEN", 540, 235);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 42px Arial";
      ctx.fillText("MI PUNTAJE", 540, 375);
      const value = score.toLocaleString("es-CO");
      let fontSize = 160;
      ctx.font = `900 ${fontSize}px Arial`;
      while (ctx.measureText(value).width > 850) ctx.font = `900 ${--fontSize}px Arial`;
      ctx.fillStyle = "#ffd34a";
      ctx.fillText(value, 540, 565);
      ctx.fillStyle = "#ff7428";
      ctx.font = "900 68px Arial";
      ctx.fillText("¿ME SUPERAS?", 540, 705);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 30px Arial";
      ctx.fillText("Juega por una web 100% gratis", 540, 805);
      ctx.font = "bold 32px Arial";
      ctx.fillText("monova.digital/juego", 540, 920);
      ctx.fillStyle = "#c6b9d2";
      ctx.font = "20px Arial";
      ctx.fillText("Resultado de partida · No acredita una posición oficial", 540, 985);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Export failed")), "image/png"));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `monova-halloween-${score}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus("Tarjeta descargada. Envía tu puntaje por WhatsApp para participar.");
    } catch {
      setStatus("No pudimos crear la tarjeta. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const url = "https://monova.digital/juego";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mi puntaje en Monova", text: shareText, url });
        setStatus("Resultado compartido.");
      } else {
        await navigator.clipboard.writeText(`${shareText} ${url}`);
        setStatus("Reto copiado. Pégalo donde quieras compartirlo.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setStatus("No se pudo compartir. Puedes descargar tu tarjeta.");
    }
  }

  return <div className={styles.scoreShare}>
    <div><button type="button" onClick={share}><Share2 size={15} /> Compartir reto</button><button type="button" onClick={downloadCard} disabled={busy}><Download size={15} /> {busy ? "Creando…" : "Mi tarjeta"}</button></div>
    <p role="status">{status}</p>
  </div>;
}
